import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileAudio,
  Globe,
  Languages,
  LoaderCircle,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { TranscriptResultCard } from '../components/TranscriptResultCard'
import { useLanguage } from '../context/LanguageContext'
import { TRANSLATION_LANGUAGES } from '../lib/transcriptFormat'
import { transcribeFile, transcribeUrl } from '../lib/ttsApi'
import type { STTSegment } from '../types'

export function SpeechToText() {
  const { trEn } = useLanguage()
  const [activeTab, setActiveTab] = useState<'url' | 'file'>('url')
  const [videoUrl, setVideoUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [language, setLanguage] = useState<'auto' | 'tr' | 'en'>('auto')
  const [translateTarget, setTranslateTarget] = useState<string>('none')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<string | null>(null)
  const [segments, setSegments] = useState<STTSegment[]>([])
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string | undefined>(undefined)
  const [autoTranslatedText, setAutoTranslatedText] = useState<string | null>(null)
  const [autoTargetLang, setAutoTargetLang] = useState<string | null>(null)

  const [sttProgress, setSttProgress] = useState(0)
  const [sttEstimatedSec, setSttEstimatedSec] = useState(0)
  const [sttStage, setSttStage] = useState('')
  const [showSttProgress, setShowSttProgress] = useState(false)
  const sttTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (sttTimerRef.current !== null) {
        window.clearInterval(sttTimerRef.current)
      }
    }
  }, [])

  const handleTranscribeUrl = async () => {
    const url = videoUrl.trim()
    if (!url) return
    setIsLoading(true)
    setError(null)
    setTranscription(null)
    setSegments([])
    setCurrentMediaUrl(undefined)
    setAutoTranslatedText(null)
    setShowSttProgress(true)
    setSttProgress(10)
    const estimatedTotal = 7.5
    setSttEstimatedSec(Math.ceil(estimatedTotal))
    setSttStage(trEn('Video bağlantısı çözümleniyor & ses akışı indiriliyor…', 'Resolving video URL & downloading audio stream…'))

    if (sttTimerRef.current !== null) window.clearInterval(sttTimerRef.current)
    const startTime = Date.now()
    sttTimerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const remaining = Math.max(0.5, estimatedTotal - elapsed)
      setSttEstimatedSec(Math.ceil(remaining))

      const ratio = elapsed / estimatedTotal
      let nextPct: number
      if (ratio > 1) {
        nextPct = Math.min(97, Math.round(90 + (1 - Math.exp(-0.8 * (ratio - 1))) * 7))
      } else {
        nextPct = Math.max(10, Math.min(93, Math.round(ratio * 93)))
      }
      setSttProgress(nextPct)

      if (nextPct < 25) {
        setSttStage(trEn('Video bağlantısı çözümleniyor & ses akışı indiriliyor…', 'Resolving video URL & downloading audio stream…'))
      } else if (nextPct < 55) {
        setSttStage(trEn('Whisper nöral modeli yükleniyor & ses analiz ediliyor…', 'Loading Whisper neural model & processing audio…'))
      } else if (nextPct < 80) {
        setSttStage(trEn('Konuşmalar yapay zekâ ile nöral olarak deşifre ediliyor…', 'Deciphering speech & words with AI…'))
      } else {
        setSttStage(trEn('Zaman damgaları senkronize ediliyor & altyazılar hazırlanıyor…', 'Synchronizing timestamps & formatting subtitles…'))
      }
    }, 120)

    try {
      const res = await transcribeUrl(url, language, translateTarget)
      setSttProgress(100)
      setSttEstimatedSec(0)
      setSttStage(trEn('Transkripsiyon tamamlandı!', 'Transcription complete!'))
      setTranscription(res.text)
      setSegments(res.segments ?? [])
      setCurrentMediaUrl(url)
      setAutoTranslatedText(res.translated_text ?? null)
      setAutoTargetLang(res.target_language ?? null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : trEn(
              'Ses metne çevrilirken bir hata oluştu.',
              'An error occurred while transcribing audio.',
            ),
      )
    } finally {
      if (sttTimerRef.current !== null) {
        window.clearInterval(sttTimerRef.current)
        sttTimerRef.current = null
      }
      setIsLoading(false)
      setTimeout(() => {
        setShowSttProgress(false)
        setSttProgress(0)
      }, 1500)
    }
  }

  const handleTranscribeFile = async () => {
    if (!selectedFile) return
    setIsLoading(true)
    setError(null)
    setTranscription(null)
    setSegments([])
    setCurrentMediaUrl(undefined)
    setAutoTranslatedText(null)
    setShowSttProgress(true)
    setSttProgress(10)
    const fileSizeMb = selectedFile.size / (1024 * 1024)
    const estimatedTotal = Math.max(3.5, Math.min(25, fileSizeMb * 2.2 + 3.0))
    setSttEstimatedSec(Math.ceil(estimatedTotal))
    setSttStage(trEn('Ses dosyası okunuyor & dalga formu analiz ediliyor…', 'Reading audio file & analyzing waveform…'))

    if (sttTimerRef.current !== null) window.clearInterval(sttTimerRef.current)
    const startTime = Date.now()
    sttTimerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const remaining = Math.max(0.5, estimatedTotal - elapsed)
      setSttEstimatedSec(Math.ceil(remaining))

      const ratio = elapsed / estimatedTotal
      let nextPct: number
      if (ratio > 1) {
        nextPct = Math.min(97, Math.round(90 + (1 - Math.exp(-0.8 * (ratio - 1))) * 7))
      } else {
        nextPct = Math.max(10, Math.min(93, Math.round(ratio * 93)))
      }
      setSttProgress(nextPct)

      if (nextPct < 25) {
        setSttStage(trEn('Ses dosyası okunuyor & dalga formu analiz ediliyor…', 'Reading audio file & analyzing waveform…'))
      } else if (nextPct < 55) {
        setSttStage(trEn('Whisper nöral ağı ses parçalarını dönüştürüyor…', 'Whisper neural network transcribing segments…'))
      } else if (nextPct < 80) {
        setSttStage(trEn('Kelime zaman damgaları ve konuşmacı geçişleri işleniyor…', 'Processing word timestamps & speech segments…'))
      } else {
        setSttStage(trEn('Metin temizleniyor ve dil kontrolleri tamamlanıyor…', 'Refining transcript & finalizing language check…'))
      }
    }, 120)

    try {
      const res = await transcribeFile(selectedFile, language, translateTarget)
      setSttProgress(100)
      setSttEstimatedSec(0)
      setSttStage(trEn('Transkripsiyon tamamlandı!', 'Transcription complete!'))
      setTranscription(res.text)
      setSegments(res.segments ?? [])
      setCurrentMediaUrl(undefined)
      setAutoTranslatedText(res.translated_text ?? null)
      setAutoTargetLang(res.target_language ?? null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : trEn(
              'Ses dosyası çevrilirken bir hata oluştu.',
              'An error occurred while transcribing the audio file.',
            ),
      )
    } finally {
      if (sttTimerRef.current !== null) {
        window.clearInterval(sttTimerRef.current)
        sttTimerRef.current = null
      }
      setIsLoading(false)
      setTimeout(() => {
        setShowSttProgress(false)
        setSttProgress(0)
      }, 1500)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-enter">
      {/* Başlık Kartı (Cambly Card) */}
      <section className="cambly-card p-6 sm:p-8">
        <div className="flex flex-col-reverse gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-chick-orange font-sans">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {trEn('Yapay Zekâ Whisper STT Modeli', 'AI Whisper STT Model')}
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)] font-display">
              {trEn('Sesten Metne Çevirici (Speech-to-Text)', 'Speech-to-Text Converter')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)] font-sans">
              {trEn(
                'Herhangi bir YouTube veya video linkini yapıştırın ya da bilgisayarınızdan ses dosyası (MP3, WAV, M4A) yükleyin. Yapay zekâ sesi analiz edip saniyeler içinde eksiksiz metne döksün.',
                'Paste any YouTube or video URL, or upload an audio file (MP3, WAV, M4A) from your computer. AI analyzes the audio and transcribes it into text in seconds.',
              )}
            </p>
          </div>
          <div className="shrink-0 flex items-center justify-center">
            <div className="relative">
              <img
                src="/logo.jpg"
                alt={trEn('Cicik Whisper STT Maskotu', 'Cicik Whisper STT Mascot')}
                width={64}
                height={64}
                loading="lazy"
                decoding="async"
                className="size-16 rounded-2xl object-cover ring-2 ring-chick-yellow/50 shadow-md animate-chirp"
              />
              <span className="absolute -bottom-1 -right-1 flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chick-yellow opacity-75" />
                <span className="relative inline-flex rounded-full size-3 bg-chick-yellow" />
              </span>
            </div>
          </div>
        </div>

        {/* Sekme Seçicileri (Cambly Pill) */}
        <div
          className="mt-6 flex flex-wrap gap-2 border-b border-[var(--border-subtle)] pb-4"
          role="tablist"
          aria-label={trEn('Çeviri Kaynağı', 'Transcription Source')}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'url'}
            onClick={() => setActiveTab('url')}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'url'
                ? 'bg-chick-yellow text-black font-bold shadow-xs'
                : 'border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Globe className="size-4" aria-hidden="true" />
            {trEn('Video / Web Linki ile', 'Via Video / Web URL')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'file'}
            onClick={() => setActiveTab('file')}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'file'
                ? 'bg-chick-yellow text-black font-bold shadow-xs'
                : 'border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <FileAudio className="size-4" aria-hidden="true" />
            {trEn('Ses Dosyası Yükle', 'Upload Audio File')}
          </button>
        </div>

        {/* Dil ve Otomatik Çeviri Seçimi */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="stt-lang" className="text-xs font-bold text-[var(--text-muted)] font-sans">
              {trEn('Ses Dili:', 'Audio Language:')}
            </label>
            <select
              id="stt-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'auto' | 'tr' | 'en')}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] outline-none focus:border-chick-yellow cursor-pointer"
            >
              <option value="auto">
                {trEn('Otomatik Algıla (Tavsiye Edilen)', 'Auto Detect (Recommended)')}
              </option>
              <option value="tr">{trEn('Türkçe', 'Turkish')}</option>
              <option value="en">{trEn('İngilizce', 'English')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Languages className="size-4 text-chick-orange shrink-0" aria-hidden="true" />
            <label
              htmlFor="stt-translate-lang"
              className="text-xs font-bold text-[var(--text-muted)] font-sans"
            >
              {trEn('Çeviri Dili:', 'Translate To:')}
            </label>
            <select
              id="stt-translate-lang"
              value={translateTarget}
              onChange={(e) => setTranslateTarget(e.target.value)}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3 py-1.5 text-xs font-medium text-[var(--text-main)] outline-none focus:border-chick-yellow cursor-pointer"
            >
              <option value="none">
                {trEn('Çeviri Yok (Orijinal Metin)', 'No Translation (Original Text)')}
              </option>
              {TRANSLATION_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {trEn(lang.tr, lang.en)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* İşlem Alanı */}
      <section className="cambly-card p-6 sm:p-7">
        {/* Real-time Progress & Estimated Time Remaining Panel */}
        {showSttProgress && (
          <div
            className="mb-5 cambly-card p-4 sm:p-5 border-2 border-[var(--focus-ring)]/40 shadow-md animate-enter"
            role="progressbar"
            aria-valuenow={sttProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={trEn('Transkripsiyon ilerlemesi', 'Transcription progress')}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {sttProgress === 100 ? (
                  <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                ) : (
                  <LoaderCircle className="size-4.5 animate-spin text-[var(--focus-ring)] shrink-0" aria-hidden="true" />
                )}
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {trEn('Whisper STT İlerlemesi', 'Whisper STT Progress')}
                </span>
                <span className="font-mono text-sm font-extrabold text-[var(--text-main)]">
                  %{sttProgress}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3 py-1 font-mono text-xs font-bold text-[var(--text-main)] shadow-2xs">
                <Clock className="size-3.5 text-chick-orange shrink-0" aria-hidden="true" />
                <span>
                  {sttProgress === 100
                    ? trEn('Tamamlandı', 'Done')
                    : trEn(`Kalan Tahmini: ~${sttEstimatedSec} sn`, `Estimated Remaining: ~${sttEstimatedSec}s`)}
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="relative mt-3 h-3.5 w-full overflow-hidden rounded-full bg-[var(--sidebar-bg)] border border-[var(--border-subtle)] p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-150 relative overflow-hidden ${
                  sttProgress === 100
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-amber-500 via-chick-yellow to-chick-orange'
                }`}
                style={{ width: `${sttProgress}%` }}
              >
                {sttProgress < 100 && (
                  <div className="absolute inset-0 bg-white/25 animate-pulse" />
                )}
              </div>
            </div>

            {/* Sub-status label */}
            <div className="mt-2.5 flex items-center justify-between text-xs text-[var(--text-muted)] font-sans">
              <span className="truncate font-medium text-[var(--text-main)]">{sttStage}</span>
            </div>
          </div>
        )}

        {activeTab === 'url' ? (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="video-url"
                className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]"
              >
                {trEn('Video veya Ses Bağlantısı', 'Video or Audio URL')}
              </label>
              <input
                id="video-url"
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder={trEn(
                  'https://www.youtube.com/watch?v=... veya direkt ses bağlantısı',
                  'https://www.youtube.com/watch?v=... or direct audio link',
                )}
                className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-4 py-3.5 text-sm text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-chick-yellow"
              />
            </div>
            <button
              type="button"
              disabled={isLoading || !videoUrl.trim()}
              onClick={() => void handleTranscribeUrl()}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-chick-yellow px-6 text-sm font-bold text-black shadow-sm transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed sm:w-auto cursor-pointer animate-cambly-pulse"
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin text-black shrink-0" aria-hidden="true" />
                  <span>
                    {trEn(
                      `%${sttProgress} · Çevriliyor (~${sttEstimatedSec} sn)…`,
                      `%${sttProgress} · Transcribing (~${sttEstimatedSec}s)…`,
                    )}
                  </span>
                </>
              ) : (
                trEn('Videodaki Sesi Hızlıca Metne Çevir', 'Transcribe Video Audio Quickly')
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-8 text-center hover:border-chick-yellow transition">
              <UploadCloud className="size-10 text-chick-orange" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-[var(--text-main)]">
                {selectedFile
                  ? selectedFile.name
                  : trEn(
                      'Bir ses dosyası seçin veya sürükleyin',
                      'Choose or drag an audio file here',
                    )}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)] font-mono">
                {trEn(
                  'MP3, WAV, M4A, OGG, FLAC (Maks. 50MB)',
                  'MP3, WAV, M4A, OGG, FLAC (Max 50MB)',
                )}
              </p>
              <label className="mt-4 cursor-pointer rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg)] px-5 py-2 text-xs font-bold text-[var(--text-main)] transition hover:bg-black/5 dark:hover:bg-white/10">
                {trEn('Dosya Seç', 'Select File')}
                <input
                  type="file"
                  accept="audio/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setSelectedFile(e.target.files[0])
                  }}
                />
              </label>
            </div>
            <button
              type="button"
              disabled={isLoading || !selectedFile}
              onClick={() => void handleTranscribeFile()}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-chick-yellow px-6 text-sm font-bold text-black shadow-sm transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed sm:w-auto cursor-pointer animate-cambly-pulse"
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin text-black shrink-0" aria-hidden="true" />
                  <span>
                    {trEn(
                      `%${sttProgress} · Çevriliyor (~${sttEstimatedSec} sn)…`,
                      `%${sttProgress} · Transcribing (~${sttEstimatedSec}s)…`,
                    )}
                  </span>
                </>
              ) : (
                trEn('Dosyayı Metne Çevir', 'Transcribe File')
              )}
            </button>
          </div>
        )}

        {/* Hata Alanı */}
        {error ? (
          <div
            role="alert"
            className="mt-5 flex items-center gap-2.5 rounded-xl border border-chick-red/30 bg-chick-red/10 p-4 text-sm font-semibold text-chick-red"
          >
            <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}
      </section>

      {/* Sonuç Alanı (Zaman Damgalı + Okunaklı Paragraflar + Çeviri + Metni Temizle + Yapay Zekâ Düzenle) */}
      {transcription !== null ? (
        <TranscriptResultCard
          text={transcription}
          language={language}
          segments={segments}
          mediaUrl={currentMediaUrl}
          initialTranslatedText={autoTranslatedText}
          initialTargetLanguage={autoTargetLang}
          onClear={() => {
            setTranscription(null)
            setSegments([])
            setCurrentMediaUrl(undefined)
            setAutoTranslatedText(null)
          }}
          onUpdateText={(newText) => setTranscription(newText)}
          title={trEn('Çevrilen Metin', 'Transcribed Text')}
        />
      ) : null}
    </div>
  )
}
