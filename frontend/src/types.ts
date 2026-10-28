export type Voice = {
  id: string
  name: string
  style: string
  tag: string
  gender?: string
  engine?: string
  languages: string[]
  is_custom?: boolean
}

export type Language = {
  id: string
  label: string
  native: string
}

export type TTSLimits = {
  max_text_length: number
  min_speed: number
  max_speed: number
}

export type Catalog = {
  voices: Voice[]
  languages: Language[]
  limits: TTSLimits
}

export type Generation = {
  id: string
  text: string
  voiceId: string
  languageId: string
  speed: number
  createdAt: string
  duration: number
  audioFormat?: string
}

export type ActiveClip = {
  generation: Generation
  audioUrl: string
}

export type STTSegment = {
  start: number
  end: number
  text: string
  speaker?: string
}

export type STTResult = {
  text: string
  language?: string
  duration?: number
  source_type: string
  translated_text?: string
  target_language?: string
  segments?: STTSegment[]
}

export type STTRefineResult = {
  readable_text: string
  important_only_text: string
  highlights: string[]
  keywords: string[]
  paragraphs: string[]
}

export type STTTranslateResult = {
  translated_text: string
  source_language: string
  target_language: string
  paragraphs: string[]
}

export type STTDiarizedTurn = {
  id: number
  speaker_index: number
  speaker_name: string
  start: number
  end: number
  text: string
  role?: string
}

export type STTDiarizeResult = {
  speaker_count: number
  turns: STTDiarizedTurn[]
  method: 'ai_gemini' | 'semantic_flow'
}
