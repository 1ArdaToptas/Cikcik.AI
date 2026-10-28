from __future__ import annotations

import re

# Turkish number words mappings
_ONES = {
    0: "sıfır",
    1: "bir",
    2: "iki",
    3: "üç",
    4: "dört",
    5: "beş",
    6: "altı",
    7: "yedi",
    8: "sekiz",
    9: "dokuz",
}

_TENS = {
    10: "on",
    20: "yirmi",
    30: "otuz",
    40: "kırk",
    50: "elli",
    60: "altmış",
    70: "yetmiş",
    80: "seksen",
    90: "doksan",
}

# Unit abbreviations attached to numbers (e.g. 100 m -> 100 metre, 50 km -> 50 kilometre)
# STRICT word boundary and leading digit required to prevent corrupting internal letters in words!
_UNIT_ABBREVIATIONS = [
    (re.compile(r"\b(\d+)\s*km\b", re.IGNORECASE), r"\1 kilometre"),
    (re.compile(r"\b(\d+)\s*m\b", re.IGNORECASE), r"\1 metre"),
    (re.compile(r"\b(\d+)\s*cm\b", re.IGNORECASE), r"\1 santimetre"),
    (re.compile(r"\b(\d+)\s*mm\b", re.IGNORECASE), r"\1 milimetre"),
    (re.compile(r"\b(\d+)\s*kg\b", re.IGNORECASE), r"\1 kilogram"),
    (re.compile(r"\b(\d+)\s*gr\b", re.IGNORECASE), r"\1 gram"),
    (re.compile(r"\b(\d+)\s*tl\b", re.IGNORECASE), r"\1 türk lirası"),
    (re.compile(r"\b(\d+)\s*dk\b", re.IGNORECASE), r"\1 dakika"),
    (re.compile(r"\b(\d+)\s*sn\b", re.IGNORECASE), r"\1 saniye"),
    (re.compile(r"\b(\d+)\s*sa\b", re.IGNORECASE), r"\1 saat"),
]

# Standalone title/common abbreviations with explicit word boundaries and dots
_WORD_ABBREVIATIONS = [
    (re.compile(r"\bvb\.", re.IGNORECASE), "ve benzeri"),
    (re.compile(r"\bvs\.", re.IGNORECASE), "ve saire"),
    (re.compile(r"\bdr\.", re.IGNORECASE), "doktor"),
    (re.compile(r"\bprof\.", re.IGNORECASE), "profesör"),
    (re.compile(r"\bav\.", re.IGNORECASE), "avukat"),
    (re.compile(r"\bdoç\.", re.IGNORECASE), "doçent"),
    (re.compile(r"\bmüh\.", re.IGNORECASE), "mühendis"),
    (re.compile(r"\bapt\.", re.IGNORECASE), "apartmanı"),
    (re.compile(r"\bsok\.", re.IGNORECASE), "sokak"),
    (re.compile(r"\bcad\.", re.IGNORECASE), "cadde"),
    (re.compile(r"\bmah\.", re.IGNORECASE), "mahallesi"),
]


def number_to_turkish_words(n: int) -> str:
    """Converts an integer (up to 999,999,999) to natural Turkish spoken words."""
    if n == 0:
        return "sıfır"
    if n < 0:
        return f"eksi {number_to_turkish_words(-n)}"

    words: list[str] = []

    # Millions
    if n >= 1_000_000:
        millions = n // 1_000_000
        n %= 1_000_000
        if millions == 1:
            words.append("bir milyon")
        else:
            words.append(f"{number_to_turkish_words(millions)} milyon")

    # Thousands
    if n >= 1000:
        thousands = n // 1000
        n %= 1000
        if thousands == 1:
            words.append("bin")
        else:
            words.append(f"{number_to_turkish_words(thousands)} bin")

    # Hundreds
    if n >= 100:
        hundreds = n // 100
        n %= 100
        if hundreds == 1:
            words.append("yüz")
        else:
            words.append(f"{_ONES[hundreds]} yüz")

    # Tens
    if n >= 10:
        tens = (n // 10) * 10
        n %= 10
        words.append(_TENS[tens])

    # Ones
    if n > 0:
        words.append(_ONES[n])

    return " ".join(words)


def normalize_text_for_speech(text: str) -> str:
    """Normalizes digits, percentages, and common abbreviations to natural spoken Turkish.

    Guarantees that words with internal letters ('m', 'cm', etc.) are never accidentally corrupted
    and removes Unicode combining dot artifacts ('\\u0307').
    """
    text = text.strip().replace("\u0307", "")
    if not text:
        return ""

    # Percentages: %50 -> yüzde elli
    text = re.sub(
        r"%(\d+)",
        lambda m: f"yüzde {number_to_turkish_words(int(m.group(1)))}",
        text,
    )

    # Unit abbreviations attached to numbers (e.g. 50 km -> 50 kilometre)
    for pattern, repl in _UNIT_ABBREVIATIONS:
        text = pattern.sub(repl, text)

    # Standalone digits: 1995 -> bin dokuz yüz doksan beş
    text = re.sub(
        r"\b\d+\b",
        lambda m: number_to_turkish_words(int(m.group(0))),
        text,
    )

    # Common word abbreviations with explicit word boundaries
    for pattern, repl in _WORD_ABBREVIATIONS:
        text = pattern.sub(repl, text)

    # Clean accidental mid-word hyphens (e.g. "tekleme-yen" -> "teklemeyen")
    text = re.sub(r"(?<=[a-zA-ZçğıöşüÇĞİÖŞÜ])-(?=[a-zA-ZçğıöşüÇĞİÖŞÜ])", "", text)

    # Smooth short 1-2 word exclamations at sentence starts ("Merhaba! Bu..." -> "Merhaba, bu...")
    # Prevents XTTS from slurring initial consonants ('Merhaba!' -> 'Nayaba!')
    text = re.sub(
        r"^([A-Za-zçğıöşüÇĞİÖŞÜ]+(?:\s+[A-Za-zçğıöşüÇĞİÖŞÜ]+)?)!\s+([A-Za-zçğıöşüÇĞİÖŞÜ])",
        lambda m: f"{m.group(1)}, {m.group(2)}",
        text,
    )

    return text


def turkish_safe_lower(text: str) -> str:
    """Converts text to lowercase using Turkish rules ('İ' -> 'i', 'I' -> 'ı') without '\\u0307'."""
    return (
        text.replace("İ", "i")
        .replace("I", "ı")
        .replace("Ğ", "ğ")
        .replace("Ü", "ü")
        .replace("Ş", "ş")
        .replace("Ö", "ö")
        .replace("Ç", "ç")
        .lower()
        .replace("\u0307", "")
    )


def prepare_natural_phrases(text: str) -> list[tuple[str, str]]:
    """Splits text into natural breath-length phrases for XTTS v2 (~80-110 chars).

    - Prevents 1-word isolated sentences (merges them with the following clause).
    - Splits long sentences (> 95 chars) at commas so XTTS never runs out of breath
      or hallucinates pauses/trailing vowels ('-e') at the end of long clauses.
    """
    clean = normalize_text_for_speech(text)
    if not clean:
        return []

    # Break by sentences (. ! ? ;)
    sentence_chunks = re.split(r"([.!?;\n]+)", clean)

    raw_sentences: list[tuple[str, str]] = []
    i = 0
    while i < len(sentence_chunks):
        sentence = sentence_chunks[i].strip()
        punct = sentence_chunks[i + 1].strip() if i + 1 < len(sentence_chunks) else "."
        i += 2

        if not sentence:
            continue

        primary_punct = punct[0] if punct else "."
        if primary_punct not in {".", "!", "?", ";"}:
            primary_punct = "."

        # Merge 1-word sentences (like standalone "Merhaba!") into the next sentence if available
        if len(sentence.split()) <= 1 and i < len(sentence_chunks) and sentence_chunks[i].strip():
            sentence_chunks[i] = f"{sentence}, {sentence_chunks[i].strip()}"
            continue

        # Split sentences > 95 chars at commas to keep within XTTS's natural breath window
        if len(sentence) > 95 and "," in sentence:
            sub_clauses = sentence.split(",")
            accum: list[str] = []
            for clause in sub_clauses:
                c = clause.strip()
                if not c:
                    continue
                accum.append(c)
                if sum(len(x) for x in accum) >= 45:
                    raw_sentences.append((", ".join(accum).strip() + ".", ","))
                    accum = []
            if accum:
                if raw_sentences and len(", ".join(accum)) < 25:
                    prev_text, _ = raw_sentences.pop()
                    tail = ", ".join(accum).strip() + primary_punct
                    merged_text = prev_text.rstrip(".") + ", " + tail
                    raw_sentences.append((merged_text, primary_punct))
                else:
                    raw_sentences.append((", ".join(accum).strip() + primary_punct, primary_punct))
        else:
            raw_sentences.append((sentence + primary_punct, primary_punct))

    return raw_sentences
