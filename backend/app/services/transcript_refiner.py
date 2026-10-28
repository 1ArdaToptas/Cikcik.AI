from __future__ import annotations

import math
import re
from collections import Counter

# Stopwords for Turkish and English to calculate true information density
_STOPWORDS_TR = {
    "ve", "veya", "ile", "için", "bir", "bu", "şu", "o", "da", "de", "ki", "mi", "mı", "mu", "mü",
    "ama", "fakat", "ancak", "lakin", "çünkü", "gibi", "kadar", "olarak", "daha", "çok", "en",
    "var", "yok", "olan", "oldu", "olur", "olup", "ben", "sen", "biz", "siz", "onlar", "ne",
    "nasıl", "neden", "niçin", "nerede", "kim", "hani", "yani", "işte", "şey", "böyle", "şöyle",
    "öyle", "zaten", "bile", "ise", "hem", "ya", "her", "hiç", "bazı", "tüm", "bütün", "diğer",
}

_STOPWORDS_EN = {
    "the", "a", "an", "and", "or", "but", "if", "then", "else", "when", "at", "from", "by", "for",
    "with", "about", "against", "between", "into", "through", "during", "before", "after", "above",
    "below", "to", "up", "down", "in", "out", "on", "off", "over", "under", "again",
    "further", "once", "here", "there", "all", "any", "both", "each", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than",
    "too", "very", "can", "will", "just", "should", "now", "is", "are", "was", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "this", "that", "these", "those",
    "i", "you", "he", "she", "it", "we", "they", "what", "which", "who", "whom",
}

_STOPWORDS = _STOPWORDS_TR | _STOPWORDS_EN

# Discourse cue words that signal important points in Turkish & English
_IMPORTANCE_CUES = {
    # Turkish cues
    "önemli", "önemlisi", "kritik", "temel", "ana", "özetle", "özet", "sonuç", "sonuçta",
    "özellikle", "dikkat", "amaç", "amacımız", "hedef", "nedeni", "sebebi", "çünkü",
    "gerekir", "gerekiyor", "zorunlu", "şart", "mutlaka", "kesinlikle", "ilk", "birincisi",
    "ikincisi", "son", "kısaca", "aslında", "vurgulamak", "unutmayın", "anahtar",
    # English cues
    "important", "critical", "crucial", "essential", "key", "main", "primary", "summary",
    "summarize", "conclusion", "especially", "particular", "note", "remember", "goal",
    "purpose", "objective", "because", "therefore", "thus", "must", "need", "required",
    "first", "second", "finally", "overall", "highlight", "takeaway",
}

# Spoken hesitation sounds to strip without changing actual words
_FILLER_PATTERN = re.compile(
    r"\b(?:ı{2,}|e{2,}|ö{2,}|a{3,}|u{3,}|hı+m+|uh+|um+|er+|ah+|eh+)\b[,.]?\s*",
    flags=re.IGNORECASE | re.UNICODE,
)

# Immediate stutter repetition (e.g., "bu bu", "ve ve", "the the")
_STUTTER_PATTERN = re.compile(
    r"\b(\w{1,12})\s+\1\b",
    flags=re.IGNORECASE | re.UNICODE,
)


def _capitalize_first(text: str) -> str:
    text = text.strip()
    if not text:
        return ""
    first = text[0]
    # Turkish-aware uppercase for 'i' -> 'İ' when Turkish chars exist in text
    if first == "i" and any(ch in text for ch in "çğıöşüÇĞİÖŞÜ"):
        return "İ" + text[1:]
    return first.upper() + text[1:]


def _split_into_sentences(text: str) -> list[str]:
    """
    Splits raw transcript text into clean sentences.
    If the input has no punctuation (e.g., raw YouTube captions), breaks it into
    natural sentence-sized clauses (~18-24 words) at conjunction boundaries
    without altering any words.
    """
    cleaned = _FILLER_PATTERN.sub(" ", text)
    cleaned = _STUTTER_PATTERN.sub(r"\1", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if not cleaned:
        return []

    # Fix spacing around punctuation
    cleaned = re.sub(r"\s+([.,!?;:])", r"\1", cleaned)
    cleaned = re.sub(r"([.,!?;:])([^\s\d.,!?;:])", r"\1 \2", cleaned)

    raw_parts = re.split(r"(?<=[.!?])\s+", cleaned)
    sentences: list[str] = []

    conjunctions = {
        "ama", "fakat", "ancak", "çünkü", "ayrıca", "bununla", "dolayısıyla",
        "bu yüzden", "örneğin", "mesela", "sonra", "ardından", "diğer",
        "but", "however", "because", "therefore", "also", "furthermore", "for example",
        "then", "moreover", "so",
    }

    for part in raw_parts:
        part = part.strip()
        if not part:
            continue
        words = part.split()
        # If a single block has > 30 words without sentence-ending punctuation,
        # split it gently at natural clause boundaries while keeping every word intact.
        if len(words) > 30:
            chunk: list[str] = []
            for word in words:
                lower_w = word.lower().strip(",;:")
                if len(chunk) >= 16 and (
                    lower_w in conjunctions
                    or chunk[-1].endswith((",", ";", ":"))
                    or len(chunk) >= 24
                ):
                    seg = " ".join(chunk).rstrip(",;:")
                    if seg and seg[-1] not in ".!?":
                        seg += "."
                    sentences.append(_capitalize_first(seg))
                    chunk = [word]
                else:
                    chunk.append(word)
            if chunk:
                seg = " ".join(chunk).rstrip(",;:")
                if seg and seg[-1] not in ".!?":
                    seg += "."
                sentences.append(_capitalize_first(seg))
        else:
            if part[-1] not in ".!?":
                part += "."
            sentences.append(_capitalize_first(part))

    return [s for s in sentences if s]


def format_readable_transcript(raw_text: str) -> tuple[str, list[str], list[str]]:
    """
    Returns (readable_text, paragraphs, sentences) while preserving 100% of the content.
    Groups sentences into readable 2-3 sentence paragraphs.
    """
    sentences = _split_into_sentences(raw_text)
    if not sentences:
        return "", [], []

    paragraphs: list[str] = []
    current_group: list[str] = []
    current_chars = 0

    for sentence in sentences:
        current_group.append(sentence)
        current_chars += len(sentence)
        # Group 2-3 sentences or ~260 characters per paragraph for optimal reading rhythm
        if len(current_group) >= 3 or (len(current_group) >= 2 and current_chars >= 220):
            paragraphs.append(" ".join(current_group))
            current_group = []
            current_chars = 0

    if current_group:
        paragraphs.append(" ".join(current_group))

    readable_text = "\n\n".join(paragraphs)
    return readable_text, paragraphs, sentences


def refine_and_extract_highlights(raw_text: str, language: str | None = "auto") -> dict:
    """
    Cleans and structures the transcript without distorting its content, and extracts
    only the most important sentences (highlights) and key terms (keywords).
    """
    readable_text, paragraphs, sentences = format_readable_transcript(raw_text)
    if not sentences:
        return {
            "readable_text": "",
            "important_only_text": "",
            "highlights": [],
            "keywords": [],
            "paragraphs": [],
        }

    # Tokenize content words across all sentences
    word_pattern = re.compile(r"[^\W\d_]{3,}", flags=re.UNICODE)
    all_words: list[str] = []
    sentence_tokens: list[list[str]] = []

    for sent in sentences:
        tokens = [
            w.lower()
            for w in word_pattern.findall(sent)
            if w.lower() not in _STOPWORDS
        ]
        sentence_tokens.append(tokens)
        all_words.extend(tokens)

    word_counts = Counter(all_words)
    max_freq = max(word_counts.values(), default=1)

    # Extract top keywords (preserving clean display casing from original text)
    keywords = [word for word, _ in word_counts.most_common(8)]

    # If text is short (1-2 sentences), all sentences are important
    if len(sentences) <= 2:
        return {
            "readable_text": readable_text,
            "important_only_text": " ".join(sentences),
            "highlights": sentences,
            "keywords": keywords,
            "paragraphs": paragraphs,
        }

    # Score each sentence by information density, cue words, numeric facts, and position
    scored: list[tuple[float, int, str]] = []
    total_sents = len(sentences)

    for idx, (sent, tokens) in enumerate(zip(sentences, sentence_tokens, strict=False)):
        if not tokens:
            scored.append((0.0, idx, sent))
            continue

        # 1. Normalized TF centrality score
        tf_score = sum(word_counts[t] / max_freq for t in set(tokens)) / math.sqrt(len(tokens) + 2)

        # 2. Discourse importance cues bonus
        lower_words = set(re.findall(r"[^\W_]+", sent.lower(), flags=re.UNICODE))
        cue_hits = len(lower_words & _IMPORTANCE_CUES)
        cue_bonus = min(1.2, cue_hits * 0.45)

        # 3. Numeric / factual data bonus (dates, percentages, numbers)
        num_hits = len(re.findall(r"\d+", sent))
        num_bonus = min(0.6, num_hits * 0.25)

        # 4. Structural position bonus (first sentence = thesis, last sentence = conclusion)
        pos_bonus = 0.35 if idx == 0 else (0.25 if idx == total_sents - 1 else 0.0)

        total_score = tf_score + cue_bonus + num_bonus + pos_bonus
        scored.append((total_score, idx, sent))

    # Select top ~40% of sentences (at least 2, at most 7)
    target_count = max(2, min(7, math.ceil(total_sents * 0.42)))
    top_indices = {
        idx
        for _, idx, _ in sorted(scored, key=lambda item: item[0], reverse=True)[:target_count]
    }

    # Preserve original chronological order so the meaning and flow are never distorted
    highlights = [sent for idx, sent in enumerate(sentences) if idx in top_indices]
    important_only_text = "\n\n".join(highlights)

    return {
        "readable_text": readable_text,
        "important_only_text": important_only_text,
        "highlights": highlights,
        "keywords": keywords,
        "paragraphs": paragraphs,
    }
