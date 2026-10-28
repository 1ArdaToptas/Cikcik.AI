import type {
  Catalog,
  STTDiarizeResult,
  STTRefineResult,
  STTResult,
  STTSegment,
  STTTranslateResult,
  Voice,
} from '../types'

/**
 * Base URL of the backend. Empty by default so requests go to `/api/...` on the
 * same origin and are forwarded by the Vite dev proxy (see vite.config.ts).
 * Set VITE_API_URL (e.g. http://127.0.0.1:8000) to call the backend directly.
 */
const apiBaseUrl = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')}/api`

export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

const friendlyMessages: Record<string, string> = {
  voice_not_found: 'Seçilen ses sunucuda bulunamadı.',
  language_not_supported: 'Bu ses seçilen dili desteklemiyor.',
  validation_error: 'Metin veya ayarlar geçersiz.',
  piper_model_not_found: 'Piper modeli eksik. Backend klasöründe "python scripts/download_model.py" çalıştırın.',
  piper_synthesis_failed: 'Ses üretilemedi. Lütfen tekrar deneyin.',
  edge_tts_failed: 'Akıcı ses oluşturulurken bir sorun çıktı.',
  rate_limited: 'Çok fazla istek gönderildi. Biraz bekleyip tekrar deneyin.',
  server_busy: 'Ses motoru meşgul. Birkaç saniye sonra tekrar deneyin.',
  stt_failed: 'Ses metne çevrilirken bir hata oluştu.',
}

async function toApiError(response: Response): Promise<ApiError> {
  let code = 'http_error'
  let message = `Sunucu hatası (${response.status}).`
  try {
    const payload = (await response.json()) as { error?: { code?: string; message?: string } }
    code = payload.error?.code ?? code
    message = payload.error?.message ?? message
  } catch {
    // Body was not JSON (e.g. proxy error page); keep the generic message.
  }
  return new ApiError(friendlyMessages[code] ?? message, code, response.status)
}

async function request(path: string, init?: RequestInit) {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, init)
  } catch {
    throw new ApiError('Backend’e ulaşılamıyor. Sunucunun çalıştığından emin olun.', 'network_error', 0)
  }
  if (!response.ok) throw await toApiError(response)
  return response
}

export async function fetchCatalog(signal?: AbortSignal): Promise<Catalog> {
  const response = await request('/voices', { signal })
  return (await response.json()) as Catalog
}

export type SynthesisInput = {
  text: string
  voiceId: string
  languageId: string
  speed: number
}

export async function synthesizeSpeech(input: SynthesisInput) {
  const response = await request('/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: input.text,
      voice_id: input.voiceId,
      language: input.languageId,
      speed: input.speed,
    }),
  })

  const blob = await response.blob()
  if (blob.size === 0) throw new ApiError('Sunucu boş ses döndürdü.', 'empty_audio', response.status)

  const duration = Number(response.headers.get('X-Duration-Seconds'))
  const format = response.headers.get('X-Audio-Format') ?? (blob.type.includes('mpeg') ? 'mp3' : 'wav')

  return {
    id: response.headers.get('X-Generation-Id') ?? `gen_${crypto.randomUUID()}`,
    duration: Number.isFinite(duration) ? duration : 0,
    audioFormat: format,
    blob,
  }
}

export async function transcribeFile(
  file: File,
  language?: string,
  targetLanguage?: string,
): Promise<STTResult> {
  const formData = new FormData()
  formData.append('file', file)
  if (language && language !== 'auto') {
    formData.append('language', language)
  }
  if (targetLanguage && targetLanguage !== 'none') {
    formData.append('target_language', targetLanguage)
  }

  const response = await request('/transcribe/file', {
    method: 'POST',
    body: formData,
  })
  return (await response.json()) as STTResult
}

export async function transcribeUrl(
  url: string,
  language?: string,
  targetLanguage?: string,
): Promise<STTResult> {
  const response = await request('/transcribe/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      language: language && language !== 'auto' ? language : null,
      target_language: targetLanguage && targetLanguage !== 'none' ? targetLanguage : null,
    }),
  })
  return (await response.json()) as STTResult
}

export async function refineTranscript(
  text: string,
  language?: string,
): Promise<STTRefineResult> {
  const response = await request('/transcribe/refine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      language: language ?? 'auto',
    }),
  })
  return (await response.json()) as STTRefineResult
}

export async function translateTranscript(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'auto',
): Promise<STTTranslateResult> {
  const response = await request('/transcribe/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      target_language: targetLanguage,
      source_language: sourceLanguage,
    }),
  })
  return (await response.json()) as STTTranslateResult
}

export async function apiDiarizeTranscript(
  text: string,
  segments?: STTSegment[],
  speakerCount: number = 2,
  apiKey?: string,
): Promise<STTDiarizeResult> {
  const response = await request('/transcribe/diarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      segments: segments ?? [],
      speaker_count: speakerCount,
      api_key: apiKey || null,
    }),
  })
  return (await response.json()) as STTDiarizeResult
}

export async function createCustomVoice(
  file: Blob | File,
  name: string,
  description?: string,
): Promise<Voice> {
  const formData = new FormData()
  formData.append('file', file, 'sample.wav')
  formData.append('name', name)
  if (description) {
    formData.append('description', description)
  }
  const response = await request('/voices/custom', {
    method: 'POST',
    body: formData,
  })
  return (await response.json()) as Voice
}

export async function deleteCustomVoice(voiceId: string): Promise<void> {
  await request(`/voices/custom/${encodeURIComponent(voiceId)}`, {
    method: 'DELETE',
  })
}
