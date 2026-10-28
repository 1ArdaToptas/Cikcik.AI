from pydantic import BaseModel, Field


class STTSegment(BaseModel):
    start: float = Field(description="Başlangıç zamanı (saniye)")
    end: float = Field(description="Bitiş zamanı (saniye)")
    text: str = Field(description="Bu zaman aralığında söylenen metin")
    speaker: str | None = Field(default=None, description="Konuşmacı etiketi")


class STTResponse(BaseModel):
    text: str = Field(description="Çevrilen metin")
    language: str | None = Field(default=None, description="Tespit edilen veya seçilen dil")
    duration: float | None = Field(default=None, description="Ses süresi (saniye)")
    source_type: str = Field(description="url veya file")
    translated_text: str | None = Field(
        default=None,
        description="Hedef dil seçildiyse çevrilmiş metin",
    )
    target_language: str | None = Field(
        default=None,
        description="Çeviri hedef dili (örn: tr, en, de)",
    )
    segments: list[STTSegment] = Field(
        default_factory=list,
        description="Videonun/sesin dakika ve saniye bazında zaman damgaları",
    )


class STTRefineRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=200000,
        description="Düzenlenecek transkript metni",
    )
    language: str | None = Field(default="auto", description="Dil (tr, en, auto)")


class STTRefineResponse(BaseModel):
    readable_text: str = Field(
        description="İçeriği bozulmadan paragraflara ayrılmış ve temizlenmiş okunaklı metin"
    )
    important_only_text: str = Field(
        description="İçeriği bozulmadan sadece önemli cümlelerden oluşan metin"
    )
    highlights: list[str] = Field(
        default_factory=list,
        description="Metinden çıkarılan en önemli cümleler",
    )
    keywords: list[str] = Field(
        default_factory=list,
        description="Öne çıkan anahtar kavramlar",
    )
    paragraphs: list[str] = Field(
        default_factory=list,
        description="Okunaklı paragraf listesi",
    )


class STTTranslateRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=200000,
        description="Çevrilecek transkript metni",
    )
    target_language: str = Field(
        default="en",
        description="Hedef dil kodu (tr, en, de, fr, es, ar, ru, ja)",
    )
    source_language: str | None = Field(
        default="auto",
        description="Kaynak dil kodu (auto, tr, en vb.)",
    )


class STTTranslateResponse(BaseModel):
    translated_text: str = Field(description="Hedef dile çevrilmiş okunaklı metin")
    source_language: str = Field(description="Algılanan veya seçilen kaynak dil")
    target_language: str = Field(description="Çevrilen hedef dil")
    paragraphs: list[str] = Field(
        default_factory=list,
        description="Çevrilmiş okunaklı paragraflar",
    )


class STTDiarizedTurn(BaseModel):
    id: int
    speaker_index: int = Field(
        description="0-indexed konuşmacı sırası (0: Konuşmacı 1, 1: Konuşmacı 2...)"
    )
    speaker_name: str = Field(description="Görünen konuşmacı adı (örn: Konuşmacı 1)")
    start: float
    end: float
    text: str
    role: str | None = Field(
        default=None,
        description="Konuşmacı rolü: Soru Soran / Cevaplayan / Yorumcu",
    )


class STTDiarizeRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=200000,
        description="Diyarize edilecek metin",
    )
    segments: list[STTSegment] = Field(
        default_factory=list,
        description="Whisper / YouTube zaman damgaları",
    )
    speaker_count: int = Field(
        default=2,
        ge=2,
        le=6,
        description="Konuşmacı sayısı (2, 3, 4, 5, 6)",
    )
    api_key: str | None = Field(
        default=None,
        description="Opsiyonel Gemini API anahtarı",
    )


class STTDiarizeResponse(BaseModel):
    speaker_count: int
    turns: list[STTDiarizedTurn]
    method: str = Field(description="ai_gemini veya semantic_flow")

