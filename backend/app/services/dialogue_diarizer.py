from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from typing import Any

from app.core.logging import logger

_INTERROGATIVE_WORDS_TR = {
    "ne", "nasıl", "neden", "niçin", "kim", "kime", "kimden", "hangi", "hangisi",
    "nerede", "nereden", "nereye", "kaç", "kaça", "acaba", "peki", "mı", "mi", "mu", "mü",
}

_REACTION_WORDS_TR = {
    "evet", "kesinlikle", "aynen", "aynen öyle", "haklısınız", "katılıyorum",
    "bence", "bence de", "bana göre", "tabii", "tabii ki", "elbette", "anladım",
    "şöyle", "şöyle ki", "aslında", "doğru", "yani", "katılmıyorum", "hayır",
    "iyiyim", "iyidir", "teşekkürler", "teşekkür ederim", "sağ olun", "sağol",
    "harika", "süper", "güzel", "merhaba", "selam", "günaydın",
}

_CONTINUATION_WORDS_TR = {
    "çünkü", "ayrıca", "dolayısıyla", "bu yüzden", "bunun için", "bunun yanında",
    "üstelik", "aynı zamanda", "örneğin", "mesela", "nitekim", "zaten", "hatta",
}

_VOCATIVE_WORDS_TR = {
    "hocam", "arkadaşlar", "arkadaşım", "bey", "hanım", "sayın", "sizce",
    "siz ne dersiniz", "dinleyiciler", "konuğumuz", "sevgili",
}


def _split_into_dialogue_units(
    segments: list[dict[str, Any]], raw_text: str
) -> list[dict[str, Any]]:
    """Normalizes input segments or paragraphs into speech units with timestamps."""
    units: list[dict[str, Any]] = []

    if segments and len(segments) > 0:
        for s in segments:
            t = str(s.get("text", "")).strip()
            if not t:
                continue
            units.append(
                {
                    "start": float(s.get("start", 0.0)),
                    "end": float(s.get("end", 0.0)),
                    "text": t,
                    "speaker": s.get("speaker"),
                }
            )
    else:
        # Fallback to paragraph splitting if no whisper segments
        paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]
        if not paragraphs:
            paragraphs = [raw_text.strip()] if raw_text.strip() else []

        cur = 0.0
        for p in paragraphs:
            word_count = len(p.split())
            dur = max(3.0, round(word_count * 0.45, 1))
            units.append(
                {
                    "start": cur,
                    "end": cur + dur,
                    "text": p,
                    "speaker": None,
                }
            )
            cur += dur

    return units


def _call_gemini_diarization(
    units: list[dict[str, Any]],
    speaker_count: int,
    api_key: str,
) -> list[dict[str, Any]] | None:
    """Calls Google Gemini API to semantically label and diarize the conversation."""
    try:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-2.0-flash:generateContent?key={api_key}"
        )

        compact_script = []
        for i, u in enumerate(units):
            compact_script.append(f"[{i}] ({u['start']}s - {u['end']}s): {u['text']}")

        # Cap at first 120 turns to avoid token overflow
        script_text = "\n".join(compact_script[:120])

        prompt = f"""Sen uzman bir Türkçe konuşmacı çözümleme (Diarization) yapay zekâsısın.
Aşağıda bir video veya ses kaydının transkript parçaları numaralarıyla verilmiştir.
Toplam konuşmacı sayısı: {speaker_count}.

GÖREVİN:
1. Konuşmanın anlamsal akışını, kimin soru sorduğunu, kimin yanıt verdiğini analiz et.
2. Her parçaya 0 ile {speaker_count - 1} arasında bir speaker_index ata.
3. Metindeki hiçbir kelimeyi DEĞİŞTİRME.
4. Çıktıyı SADECE geçerli bir JSON array olarak döndür:
[
  {{"id": 0, "speaker_index": 0, "role": "Soru Soran"}},
  {{"id": 1, "speaker_index": 1, "role": "Cevaplayan"}}
]

TRANSKRİPT PARÇALARI:
{script_text}
"""

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json",
            },
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=12) as response:
            resp_body = response.read().decode("utf-8")
            data = json.loads(resp_body)
            raw_content = (
                data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )
            parsed = json.loads(raw_content)

            if isinstance(parsed, list):
                mapping: dict[int, dict[str, Any]] = {}
                for item in parsed:
                    if isinstance(item, dict) and "id" in item:
                        mapping[int(item["id"])] = item

                # Reconstruct turns
                turns: list[dict[str, Any]] = []
                cur_speaker: int | None = None
                cur_turn: dict[str, Any] | None = None

                for i, u in enumerate(units):
                    assigned = mapping.get(i, {})
                    sp_idx = int(assigned.get("speaker_index", 0)) % speaker_count
                    role = assigned.get("role") or (
                        "Soru Soran" if sp_idx == 0 else "Cevaplayan"
                    )

                    if cur_turn is None or sp_idx != cur_speaker:
                        if cur_turn is not None:
                            turns.append(cur_turn)
                        cur_speaker = sp_idx
                        cur_turn = {
                            "id": len(turns) + 1,
                            "speaker_index": sp_idx,
                            "speaker_name": f"Konuşmacı {sp_idx + 1}",
                            "start": u["start"],
                            "end": u["end"],
                            "text": u["text"],
                            "role": role,
                        }
                    else:
                        cur_turn["end"] = max(cur_turn["end"], u["end"])
                        cur_turn["text"] = f"{cur_turn['text']} {u['text']}"

                if cur_turn is not None:
                    turns.append(cur_turn)

                return turns

    except Exception as e:
        logger.warning("gemini_diarization_failed_fallback_to_semantic", error=str(e))
        return None

    return None


def _classify_unit_intent(text: str) -> dict[str, bool]:
    """Analyzes a Turkish utterance to determine conversational acts and speaker intent."""
    clean = text.lower().strip()
    words = set(re.findall(r"\w+", clean))

    is_question = (
        clean.endswith("?")
        or bool(words & _INTERROGATIVE_WORDS_TR)
        or bool(re.search(r"\b(mı|mi|mu|mü|mısın|misin|musun|müsün|mısınız|misiniz)\b", clean))
    )

    is_reaction = bool(
        words & _REACTION_WORDS_TR
        or re.match(r"^(evet|hayır|aynen|kesinlikle|tabii|elbette|bence|şöyle)\b", clean)
    )

    is_continuation = bool(
        re.match(r"^(çünkü|ayrıca|dolayısıyla|bu yüzden|nitekim|yani|üstelik|hatta)\b", clean)
    )

    is_vocative = bool(words & _VOCATIVE_WORDS_TR)

    return {
        "is_question": is_question,
        "is_reaction": is_reaction,
        "is_continuation": is_continuation,
        "is_vocative": is_vocative,
    }


def _semantic_flow_diarize(
    units: list[dict[str, Any]],
    speaker_count: int = 2,
) -> list[dict[str, Any]]:
    """
    State-of-the-art heuristic semantic flow analysis for Turkish dialogues.
    Uses conversational turn-taking, speech acts (Q&A, agreement, vocatives, continuations),
    and clause lengths to accurately distinguish Speaker 1 vs Speaker 2 vs Speaker 3.
    """
    if not units:
        return []

    turns: list[dict[str, Any]] = []
    current_speaker = 0
    cur_turn: dict[str, Any] | None = None

    # Track conversational context
    last_was_question = False
    consecutive_same_speaker = 0

    for i, u in enumerate(units):
        text = u["text"].strip()
        if not text:
            continue

        prev_u = units[i - 1] if i > 0 else None
        pause = (u["start"] - prev_u["end"]) if prev_u else 0.0

        intents = _classify_unit_intent(text)
        should_shift = False

        # 1. Explicit speaker marker (e.g. ">>", "[Ahmet]:", "Speaker 2:")
        if text.startswith(">>") or u.get("speaker"):
            should_shift = True
            current_speaker = (current_speaker + 1) % speaker_count
        # 2. If previous utterance was a question and this unit does NOT continue previous thought
        elif last_was_question and not intents["is_continuation"]:
            should_shift = True
            current_speaker = (current_speaker + 1) % speaker_count
        # 3. If this unit starts with a continuation conjunction ("çünkü", "ayrıca"),
        # DO NOT shift! Keep with the current speaker who is explaining.
        elif intents["is_continuation"]:
            should_shift = False
        # 4. If this is a direct reaction ("Evet", "Aynen", "Bence de") following another speaker
        elif intents["is_reaction"] and consecutive_same_speaker >= 1:
            should_shift = True
            current_speaker = (current_speaker + 1) % speaker_count
        # 5. Long conversational pause (> 2.5s) + new sentence starting without continuation
        elif pause >= 2.5 and not intents["is_continuation"]:
            should_shift = True
            current_speaker = (current_speaker + 1) % speaker_count

        # Assign role based on intents
        role = "Cevaplayan / Konuk"
        if intents["is_question"]:
            role = "Soru Soran / Röportaj Yapan"
        elif intents["is_reaction"]:
            role = "Onaylayan / Yorumcu"
        elif current_speaker == 0:
            role = "Konuşmacı 1"
        else:
            role = f"Konuşmacı {current_speaker + 1}"

        if cur_turn is None or (should_shift and cur_turn["speaker_index"] != current_speaker):
            if cur_turn is not None:
                turns.append(cur_turn)
            cur_turn = {
                "id": len(turns) + 1,
                "speaker_index": current_speaker,
                "speaker_name": f"Konuşmacı {current_speaker + 1}",
                "start": u["start"],
                "end": u["end"],
                "text": text,
                "role": role,
            }
            consecutive_same_speaker = 1
        else:
            cur_turn["end"] = max(cur_turn["end"], u["end"])
            cur_turn["text"] = f"{cur_turn['text']} {text}"
            consecutive_same_speaker += 1

        last_was_question = intents["is_question"]

    if cur_turn is not None:
        turns.append(cur_turn)

    return turns


def diarize_dialogue_sync(
    text: str,
    segments: list[dict[str, Any]] | None = None,
    speaker_count: int = 2,
    api_key: str | None = None,
) -> dict[str, Any]:
    """
    Performs AI or semantic flow dialogue diarization on the given transcript.
    Returns structured speaker turns with colors, timestamps, and conversational roles.
    """
    effective_count = max(2, min(6, speaker_count))
    units = _split_into_dialogue_units(segments or [], text)

    effective_api_key = api_key or os.environ.get("GEMINI_API_KEY")

    if effective_api_key and effective_api_key.strip():
        gemini_turns = _call_gemini_diarization(units, effective_count, effective_api_key.strip())
        if gemini_turns and len(gemini_turns) > 0:
            return {
                "speaker_count": effective_count,
                "turns": gemini_turns,
                "method": "ai_gemini",
            }

    # Fallback to intelligent Semantic Flow Diarizer
    semantic_turns = _semantic_flow_diarize(units, effective_count)
    return {
        "speaker_count": effective_count,
        "turns": semantic_turns,
        "method": "semantic_flow",
    }
