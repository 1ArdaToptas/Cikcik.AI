import {
  AlignLeft,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Download,
  Eraser,
  ExternalLink,
  FileJson,
  FileText,
  Key,
  Languages,
  LoaderCircle,
  MessageSquare,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { useLanguage } from '../context/LanguageContext'
import {
  diarizeTranscript,
  formatSecondsToTimestamp,
  formatSegmentsToSrt,
  groupSegmentsByInterval,
  SPEAKER_PALETTES,
  splitIntoReadableParagraphs,
  TRANSLATION_LANGUAGES,
  type SpeakerTurn,
} from '../lib/transcriptFormat'
import { apiDiarizeTranscript, refineTranscript, translateTranscript } from '../lib/ttsApi'
import type { STTRefineResult, STTSegment, STTTranslateResult } from '../types'
import { Dropdown } from './ui/Dropdown'
import { Tooltip } from './ui/Tooltip'

type Props = {
  text: string
  language?: string
  segments?: STTSegment[]
  mediaUrl?: string
  initialTranslatedText?: string | null
  initialTargetLanguage?: string | null
  onClear?: () => void
  onUpdateText?: (newText: string) => void
  title?: string
}

type ViewMode =
  | 'readable'
  | 'speakers'
  | 'timestamps'
  | 'highlights'
  | 'translated'
  | 'raw'

function getTimestampUrl(url: string, seconds: number): string | null {
  if (!url || !url.trim()) return null
  const clean = url.trim()
  if (clean.includes('youtube.com') || clean.includes('youtu.be')) {
    const sep = clean.includes('?') ? '&' : '?'
    return `${clean}${sep}t=${Math.floor(seconds)}s`
  }
  return null
}

export function TranscriptResultCard({
  text,
  language = 'auto',
  segments = [],
  mediaUrl,
  initialTranslatedText = null,
  initialTargetLanguage = null,
  onClear,
  onUpdateText,
  title,
}: Props) {
  const { trEn } = useLanguage()
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    initialTranslatedText
      ? 'translated'
      : 'readable',
  )
  const [targetLang, setTargetLang] = useState<string>(() =>
    initialTargetLanguage && initialTargetLanguage !== 'none'
      ? initialTargetLanguage
      : language === 'en'
        ? 'tr'
        : 'en',
  )
  const [aiState, setAiState] = useState<{ forText: string; result: STTRefineResult } | null>(null)
  const [translationState, setTranslationState] = useState<{
    forText: string
    result: STTTranslateResult
  } | null>(null)

  const [isRefining, setIsRefining] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [refineError, setRefineError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [chunkInterval, setChunkInterval] = useState<number>(180) // 180s = 3 minutes default
  const [copiedGroupId, setCopiedGroupId] = useState<number | null>(null)

  // Speaker Diarization States
  const [speakerCount, setSpeakerCount] = useState<number>(2) // 2'li sohbet varsayılan
  const [selectedSpeakerFilter, setSelectedSpeakerFilter] = useState<number | 'all'>('all')
  const [copiedTurnId, setCopiedTurnId] = useState<number | null>(null)
  const [customTurns, setCustomTurns] = useState<SpeakerTurn[] | null>(null)
  const [isDiarizingAi, setIsDiarizingAi] = useState(false)
  const [diarizeMethod, setDiarizeMethod] = useState<'ai_gemini' | 'semantic_flow' | null>(null)
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('tts_gemini_key') || ''
    } catch {
      return ''
    }
  })
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)

  // Derive AI result for current text without setState-in-effect
  const aiResult = aiState?.forText === text ? aiState.result : null

  const currentLangLabel = useMemo(() => {
    const item = TRANSLATION_LANGUAGES.find((l) => l.code === targetLang)
    return item ? trEn(item.tr, item.en) : targetLang.toUpperCase()
  }, [targetLang, trEn])

  const translationOptions = useMemo(
    () =>
      TRANSLATION_LANGUAGES.map((l) => ({
        value: l.code,
        label: trEn(l.tr, l.en),
      })),
    [trEn],
  )

  // Derive translation result (either from on-demand translation or initial auto-translation)
  const translationResult: STTTranslateResult | null = useMemo(() => {
    if (translationState?.forText === text) {
      return translationState.result
    }
    if (initialTranslatedText) {
      return {
        translated_text: initialTranslatedText,
        source_language: language,
        target_language: initialTargetLanguage || targetLang,
        paragraphs: splitIntoReadableParagraphs(initialTranslatedText),
      }
    }
    return null
  }, [translationState, text, initialTranslatedText, language, initialTargetLanguage, targetLang])

  const activeViewMode: ViewMode =
    viewMode === 'highlights' && !aiResult
      ? 'readable'
      : viewMode === 'translated' && !translationResult
        ? 'readable'
        : viewMode === 'timestamps' && (!segments || segments.length === 0)
          ? 'readable'
          : viewMode

  const paragraphs = useMemo(() => {
    if (aiResult && aiResult.paragraphs.length > 0) {
      return aiResult.paragraphs
    }
    return splitIntoReadableParagraphs(text)
  }, [text, aiResult])

  const segmentGroups = useMemo(() => {
    if (!segments || segments.length === 0) return []
    return groupSegmentsByInterval(segments, chunkInterval)
  }, [segments, chunkInterval])

  // Multi-Speaker Diarization (2'li, 3'lü, 4+ Sohbet Ayrımı)
  const defaultSpeakerTurns = useMemo(() => {
    return diarizeTranscript(segments ?? [], text, speakerCount)
  }, [segments, text, speakerCount])

  const speakerTurns = customTurns ?? defaultSpeakerTurns

  const filteredSpeakerTurns = useMemo(() => {
    if (selectedSpeakerFilter === 'all') return speakerTurns
    return speakerTurns.filter((turn) => turn.speakerIndex === selectedSpeakerFilter)
  }, [speakerTurns, selectedSpeakerFilter])

  const handleAiDiarize = async () => {
    if (!text.trim() || isDiarizingAi) return
    setIsDiarizingAi(true)
    setRefineError(null)
    try {
      const res = await apiDiarizeTranscript(text, segments, speakerCount, geminiApiKey)
      setDiarizeMethod(res.method)
      const mappedTurns: SpeakerTurn[] = res.turns.map((t) => ({
        id: t.id,
        speakerIndex: t.speaker_index,
        speakerName: t.speaker_name,
        start: t.start,
        end: t.end,
        text: t.text,
        sentenceCount: 1,
        role: t.role,
        palette: SPEAKER_PALETTES[t.speaker_index % SPEAKER_PALETTES.length],
      }))
      setCustomTurns(mappedTurns)
      setViewMode('speakers')
    } catch (err) {
      setRefineError(
        err instanceof Error
          ? err.message
          : trEn(
              'Konuşmacı analizi sırasında bir hata oluştu.',
              'An error occurred during speaker diarization analysis.',
            ),
      )
    } finally {
      setIsDiarizingAi(false)
    }
  }

  const handleSwitchSpeaker = (turnId: number, newSpeakerIdx: number) => {
    const base = customTurns ?? defaultSpeakerTurns
    const updated = base.map((t) => {
      if (t.id === turnId) {
        const pal = SPEAKER_PALETTES[newSpeakerIdx % SPEAKER_PALETTES.length]
        return {
          ...t,
          speakerIndex: newSpeakerIdx,
          speakerName: pal.labelTr,
          palette: pal,
        }
      }
      return t
    })
    setCustomTurns(updated)
  }

  const translatedParagraphs = useMemo(() => {
    if (!translationResult) return []
    if (translationResult.paragraphs && translationResult.paragraphs.length > 0) {
      return translationResult.paragraphs
    }
    return splitIntoReadableParagraphs(translationResult.translated_text)
  }, [translationResult])

  // Active text for Copy / Download based on current view mode
  const activeOutputText = useMemo(() => {
    if (activeViewMode === 'speakers' && filteredSpeakerTurns.length > 0) {
      return filteredSpeakerTurns
        .map(
          (t) =>
            `[${formatSecondsToTimestamp(t.start)} - ${formatSecondsToTimestamp(t.end)}] ${t.speakerName}:\n${t.text}`,
        )
        .join('\n\n')
    }
    if (activeViewMode === 'timestamps' && segmentGroups.length > 0) {
      return segmentGroups
        .map(
          (g) =>
            `[${formatSecondsToTimestamp(g.start)} - ${formatSecondsToTimestamp(g.end)}] (${trEn('Bölüm', 'Chapter')} ${g.id})\n${g.text}`,
        )
        .join('\n\n')
    }
    if (activeViewMode === 'highlights' && aiResult) {
      return aiResult.important_only_text || aiResult.highlights.join('\n\n')
    }
    if (activeViewMode === 'translated' && translationResult) {
      return translationResult.translated_text
    }
    if (activeViewMode === 'readable') {
      return aiResult?.readable_text || paragraphs.join('\n\n')
    }
    return text
  }, [
    activeViewMode,
    filteredSpeakerTurns,
    segmentGroups,
    trEn,
    aiResult,
    translationResult,
    paragraphs,
    text,
  ])

  const wordCount = useMemo(
    () => activeOutputText.split(/\s+/).filter(Boolean).length,
    [activeOutputText],
  )
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 160))

  const handleAiRefine = async () => {
    if (!text.trim() || isRefining) return
    setIsRefining(true)
    setRefineError(null)
    try {
      const res = await refineTranscript(text, language)
      setAiState({ forText: text, result: res })
      setViewMode('highlights')
    } catch (err) {
      setRefineError(
        err instanceof Error
          ? err.message
          : trEn(
              'Yapay zekâ düzenlemesi sırasında bir hata oluştu.',
              'An error occurred during AI refinement.',
            ),
      )
    } finally {
      setIsRefining(false)
    }
  }

  const handleTranslate = async (overrideTarget?: string) => {
    const chosenTarget = overrideTarget ?? targetLang
    if (!text.trim() || isTranslating) return
    setIsTranslating(true)
    setRefineError(null)
    try {
      const res = await translateTranscript(text, chosenTarget, language)
      setTranslationState({ forText: text, result: res })
      setViewMode('translated')
    } catch (err) {
      setRefineError(
        err instanceof Error
          ? err.message
          : trEn(
              'Metin çevrilirken bir hata oluştu.',
              'An error occurred while translating the text.',
            ),
      )
    } finally {
      setIsTranslating(false)
    }
  }

  const handleCopy = () => {
    if (!activeOutputText) return
    void navigator.clipboard.writeText(activeOutputText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadTxt = () => {
    if (!activeOutputText) return
    const blob = new Blob([activeOutputText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const suffix =
      activeViewMode === 'speakers'
        ? 'renkli_konusmacilar'
        : activeViewMode === 'timestamps'
          ? 'zaman_damgali'
          : activeViewMode === 'highlights'
            ? 'onemli_yerler'
            : activeViewMode === 'translated'
              ? `ceviri_${translationResult?.target_language ?? targetLang}`
              : 'transkript'
    a.download = `cicik_${suffix}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadSrt = () => {
    if (!segments || segments.length === 0) return
    const targetSegments =
      chunkInterval > 0 && segmentGroups.length > 0
        ? segmentGroups.map((g) => ({ start: g.start, end: g.end, text: g.text }))
        : segments
    const srtContent = formatSegmentsToSrt(targetSegments)
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cicik_altyazi_${Date.now()}.srt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadJson = () => {
    if (!activeOutputText) return
    const payload = JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        mode: activeViewMode,
        wordCount,
        characterCount: activeOutputText.length,
        highlights: aiResult?.highlights ?? [],
        keywords: aiResult?.keywords ?? [],
        translatedText: translationResult?.translated_text ?? null,
        targetLanguage: translationResult?.target_language ?? null,
        text: activeOutputText,
      },
      null,
      2,
    )
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cicik_transcript_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="cambly-card p-6 sm:p-8 animate-enter">
      {/* Top Header: Title, Stats & Primary AI / Translate / Clear Actions */}
      <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-chick-success/15 p-2.5 text-chick-success shrink-0">
              <Check className="size-5 stroke-[3]" aria-hidden="true" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-chick-orange font-sans">
                {activeViewMode === 'speakers'
                  ? trEn(
                      `Renkli Konuşmacı Ayrımı (${speakerCount === 2 ? "2'li Sohbet" : speakerCount === 3 ? "3'lü Sohbet" : "Kalabalık Sohbet"})`,
                      `Colored Speakers (${speakerCount === 2 ? '2-Way Dialogue' : speakerCount === 3 ? '3-Way Panel' : 'Group Conversation'})`,
                    )
                  : activeViewMode === 'timestamps'
                    ? trEn(
                        '3 Dakikalık Bölümler (Zaman Damgalı)',
                        '3-Minute Chapters (With Timestamps)',
                      )
                    : activeViewMode === 'highlights'
                      ? trEn('Yapay Zekâ · Sadece Önemli Yerler', 'AI · Key Highlights Only')
                      : activeViewMode === 'translated'
                        ? trEn(
                            `Çeviri Sonucu (${(translationResult?.target_language ?? targetLang).toUpperCase()})`,
                            `Translated Result (${(translationResult?.target_language ?? targetLang).toUpperCase()})`,
                          )
                        : trEn('Okunaklı Transkripsiyon', 'Readable Transcription')}
              </span>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] font-display">
                  {title ?? trEn('Transkripsiyon Sonucu', 'Transcription Result')}
                </h2>
                <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-2.5 py-0.5 text-[11px] font-mono text-[var(--text-muted)]">
                  {wordCount} {trEn('kelime', 'words')} · {activeOutputText.length}{' '}
                  {trEn('harf', 'chars')} · ~{readingMinutes} {trEn('dk okuma', 'min read')}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Bar: Translate + AI Edit (Important Parts Only) + Clear Text */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Language Selector + Translate Button */}
            <div className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-1 gap-1">
              <Languages className="size-3.5 ml-2 text-chick-orange shrink-0" aria-hidden="true" />
              <Dropdown
                title={trEn('Hedef Dil', 'Target Language')}
                options={translationOptions}
                selected={targetLang}
                onSelect={(val) => setTargetLang(val)}
                align="start"
                trigger={
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-[var(--text-main)] hover:text-chick-orange transition cursor-pointer"
                  >
                    <span>{currentLangLabel}</span>
                    <ChevronDown className="size-3 opacity-60" aria-hidden="true" />
                  </button>
                }
              />
              <button
                type="button"
                onClick={() => void handleTranslate()}
                disabled={isTranslating || !text.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-chick-yellow px-3.5 py-1.5 text-xs font-bold text-black shadow-xs transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isTranslating ? (
                  <>
                    <LoaderCircle className="size-3.5 animate-spin text-black" aria-hidden="true" />
                    <span>{trEn('Çevriliyor…', 'Translating…')}</span>
                  </>
                ) : (
                  <span>{trEn('Metni Çevir', 'Translate')}</span>
                )}
              </button>
            </div>

            {/* AI Refine (Important Parts Only) Button */}
            <button
              type="button"
              onClick={() => void handleAiRefine()}
              disabled={isRefining || !text.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-chick-yellow px-4 py-2 text-xs font-bold text-black shadow-xs transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isRefining ? (
                <>
                  <LoaderCircle className="size-3.5 animate-spin text-black" aria-hidden="true" />
                  <span>{trEn('Yapay Zekâ Düzenliyor…', 'AI Refining…')}</span>
                </>
              ) : (
                <>
                  <Wand2 className="size-3.5 text-black" aria-hidden="true" />
                  <span>
                    {trEn(
                      'Yapay Zekâ Düzenle (Önemli Yerler)',
                      'AI Refine (Important Parts Only)',
                    )}
                  </span>
                </>
              )}
            </button>

            {/* Clear Text Button */}
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="inline-flex items-center gap-1.5 rounded-full border border-chick-red/35 bg-chick-red/10 px-3.5 py-2 text-xs font-bold text-chick-red transition hover:bg-chick-red hover:text-black cursor-pointer"
                title={trEn('Yazılan metni temizle', 'Clear transcribed text')}
              >
                <Eraser className="size-3.5" aria-hidden="true" />
                <span>{trEn('Metni Temizle', 'Clear Text')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary Toolbar: View Mode Tabs + Copy & Export */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div
            className="inline-flex flex-wrap items-center rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-1 gap-1"
            role="tablist"
            aria-label={trEn('Görünüm Modu', 'View Mode')}
          >
            {/* Renkli Konuşmacılar (2'li, 3'lü, 4+ Sohbetler) */}
            <button
              type="button"
              role="tab"
              aria-selected={activeViewMode === 'speakers'}
              onClick={() => setViewMode('speakers')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeViewMode === 'speakers'
                  ? 'bg-chick-yellow text-black shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Users className="size-3.5" aria-hidden="true" />
              <span>
                {trEn('Renkli Konuşmacılar', 'Colored Speakers')} ({speakerTurns.length})
              </span>
            </button>

            {segments && segments.length > 0 && (
              <button
                type="button"
                role="tab"
                aria-selected={activeViewMode === 'timestamps'}
                onClick={() => setViewMode('timestamps')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  activeViewMode === 'timestamps'
                    ? 'bg-chick-yellow text-black shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Clock className="size-3.5" aria-hidden="true" />
                <span>
                  {trEn('3 Dk Bölümler', '3-Min Chapters')} ({segmentGroups.length})
                </span>
              </button>
            )}

            <button
              type="button"
              role="tab"
              aria-selected={activeViewMode === 'readable'}
              onClick={() => setViewMode('readable')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeViewMode === 'readable'
                  ? 'bg-chick-yellow text-black shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <AlignLeft className="size-3.5" aria-hidden="true" />
              <span>
                {trEn('Okunaklı Paragraflar', 'Readable Paragraphs')} ({paragraphs.length})
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeViewMode === 'highlights'}
              onClick={() => {
                if (aiResult) {
                  setViewMode('highlights')
                } else {
                  void handleAiRefine()
                }
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeViewMode === 'highlights'
                  ? 'bg-chick-yellow text-black shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Sparkles className="size-3.5 text-chick-orange" aria-hidden="true" />
              <span>
                {trEn('Sadece Önemli Yerler (AI)', 'Key Highlights Only (AI)')}
                {aiResult ? ` (${aiResult.highlights.length})` : ''}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeViewMode === 'translated'}
              onClick={() => {
                if (translationResult) {
                  setViewMode('translated')
                } else {
                  void handleTranslate()
                }
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeViewMode === 'translated'
                  ? 'bg-chick-yellow text-black shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Languages className="size-3.5 text-chick-orange" aria-hidden="true" />
              <span>
                {trEn('Çeviri', 'Translation')}
                {translationResult
                  ? ` (${translationResult.target_language.toUpperCase()})`
                  : ''}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeViewMode === 'raw'}
              onClick={() => setViewMode('raw')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeViewMode === 'raw'
                  ? 'bg-chick-yellow text-black shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>{trEn('Ham Metin', 'Raw Text')}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tooltip content={copied ? trEn('Panoya kopyalandı', 'Copied to clipboard') : trEn('Metni kopyala', 'Copy text')}>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-main)] transition hover:bg-chick-yellow hover:text-black cursor-pointer"
              >
                {copied ? (
                  <Check className="size-3.5 text-chick-success" aria-hidden="true" />
                ) : (
                  <Copy className="size-3.5" aria-hidden="true" />
                )}
                <span>{copied ? trEn('Kopyalandı', 'Copied') : trEn('Kopyala', 'Copy')}</span>
              </button>
            </Tooltip>

            <Tooltip content={trEn('Metin dosyası olarak indir (.txt)', 'Download as text (.txt)')}>
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-main)] transition hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                <Download className="size-3.5" aria-hidden="true" />
                <span>TXT</span>
              </button>
            </Tooltip>

            <Tooltip content={trEn('JSON dosyası olarak indir (.json)', 'Download as JSON (.json)')}>
              <button
                type="button"
                onClick={handleDownloadJson}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-main)] transition hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                <FileJson className="size-3.5" aria-hidden="true" />
                <span>JSON</span>
              </button>
            </Tooltip>

            {segments && segments.length > 0 && (
              <Tooltip content={trEn('Altyazı dosyası olarak indir (.srt)', 'Download as subtitle (.srt)')}>
                <button
                  type="button"
                  onClick={handleDownloadSrt}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-main)] transition hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                >
                  <FileText className="size-3.5" aria-hidden="true" />
                  <span>SRT</span>
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {refineError && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-chick-red/30 bg-chick-red/10 p-3 text-xs font-semibold text-chick-red"
        >
          {refineError}
        </div>
      )}

      {/* Key Concepts / Keywords Bar when AI Refinement is active */}
      {aiResult && aiResult.keywords.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-chick-yellow/40 bg-chick-yellow/10 px-4 py-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-chick-orange font-sans">
            {trEn('Öne Çıkan Kavramlar:', 'Key Concepts:')}
          </span>
          {aiResult.keywords.map((kw) => (
            <span
              key={kw}
              className="rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-main)]"
            >
              #{kw}
            </span>
          ))}
        </div>
      )}

      {/* MODE: MULTI-SPEAKER DIARIZATION (2'li, 3'lü veya Kalabalık Sohbet Ayrımı ve Renkli Vurgulama) */}
      {activeViewMode === 'speakers' ? (
        <div className="mt-5 space-y-4">
          {/* Header controls: Conversation format selector (2'li, 3'lü, 4+) & speaker filters */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-3.5 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)]/70 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <Users className="size-4 text-chick-orange shrink-0" aria-hidden="true" />
                <span className="text-xs font-bold text-[var(--text-main)] font-sans">
                  {trEn('Sohbet Düzeni:', 'Conversation Type:')}
                </span>
                <div className="inline-flex flex-wrap items-center gap-1.5">
                  {[
                    { count: 2, tr: "2'li Sohbet (Diyalog)", en: '2-Way Dialogue' },
                    { count: 3, tr: "3'lü Sohbet (Panel / Podcast)", en: '3-Way Panel / Podcast' },
                    { count: 4, tr: '4+ Kalabalık Sohbet', en: '4+ Group Discussion' },
                  ].map((opt) => (
                    <button
                      key={opt.count}
                      type="button"
                      onClick={() => {
                        setSpeakerCount(opt.count)
                        setSelectedSpeakerFilter('all')
                        setCustomTurns(null)
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
                        speakerCount === opt.count
                          ? 'bg-chick-yellow text-black shadow-xs scale-102'
                          : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]'
                      }`}
                    >
                      {trEn(opt.tr, opt.en)}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Diarization Action Button */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleAiDiarize()}
                  disabled={isDiarizingAi || !text.trim()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-chick-yellow px-3.5 py-1.5 text-xs font-bold text-black shadow-xs transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  title={trEn(
                    'Diyalog akışını, soru-cevapları ve hitapları yapay zekâ ile anlamsal olarak ayrıştır',
                    'Semantically diarize Q&A dialogue turns with AI',
                  )}
                >
                  {isDiarizingAi ? (
                    <>
                      <LoaderCircle className="size-3.5 animate-spin text-black" aria-hidden="true" />
                      <span>{trEn('Yapay Zekâ Analiz Ediyor…', 'AI Analyzing…')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5 text-black" aria-hidden="true" />
                      <span>{trEn('Yapay Zekâ ile Ayrıştır', 'Diarize with AI')}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowApiKeyInput((prev) => !prev)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                    showApiKeyInput || geminiApiKey
                      ? 'border-chick-yellow/70 bg-chick-yellow/15 text-[var(--text-main)]'
                      : 'border-[var(--border-subtle)] bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                  title={trEn('Google Gemini API Anahtarı Ayarı', 'Google Gemini API Key Settings')}
                >
                  <Key className="size-3 text-chick-orange" aria-hidden="true" />
                  <span>{geminiApiKey ? 'Gemini Key ✓' : trEn('API Key', 'API Key')}</span>
                </button>
              </div>
            </div>

            {/* Optional Gemini API Key Drawer */}
            {showApiKeyInput && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-chick-yellow/40 bg-chick-yellow/5 p-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-[var(--text-main)]">
                    {trEn('Google Gemini API Anahtarı (Opsiyonel):', 'Google Gemini API Key (Optional):')}
                  </span>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiApiKey}
                    onChange={(e) => {
                      const val = e.target.value.trim()
                      setGeminiApiKey(val)
                      try {
                        localStorage.setItem('tts_gemini_key', val)
                      } catch {}
                    }}
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--card-bg)] px-2.5 py-1 text-xs text-[var(--text-main)] outline-none focus:border-chick-yellow w-56 font-mono"
                  />
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {trEn(
                    'Anahtar girilmezse yerel akıllı anlamsal diyalog akış motoru kullanılır.',
                    'If empty, the local semantic dialogue flow engine is used automatically.',
                  )}
                </p>
              </div>
            )}

            {/* Diarize Method Badge if run */}
            {diarizeMethod && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-chick-success/40 bg-chick-success/10 px-3 py-1.5 text-xs font-bold text-chick-success">
                <Check className="size-3.5" aria-hidden="true" />
                <span>
                  {diarizeMethod === 'ai_gemini'
                    ? trEn(
                        '✨ Google Gemini Yapay Zekâsı ile Diyalog Çözümlendi',
                        '✨ Diarized with Google Gemini AI',
                      )
                    : trEn(
                        '🧠 Akıllı Anlamsal Akış Motoru (Soru-Cevap & Diyalog) ile Çözümlendi',
                        '🧠 Diarized with Semantic Dialogue Flow Engine',
                      )}
                </span>
              </div>
            )}

            {/* Speaker Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-sans mr-1">
                {trEn('Konuşmacı Filtresi:', 'Speaker Filter:')}
              </span>
              <button
                type="button"
                onClick={() => setSelectedSpeakerFilter('all')}
                className={`rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  selectedSpeakerFilter === 'all'
                    ? 'bg-chick-yellow text-black shadow-xs'
                    : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]'
                }`}
              >
                {trEn('Tüm Konuşmacılar', 'All Speakers')} ({speakerTurns.length})
              </button>

              {Array.from({ length: speakerCount }).map((_, idx) => {
                const palette = SPEAKER_PALETTES[idx % SPEAKER_PALETTES.length]
                const countForSpeaker = speakerTurns.filter((t) => t.speakerIndex === idx).length
                const isSelected = selectedSpeakerFilter === idx

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setSelectedSpeakerFilter(selectedSpeakerFilter === idx ? 'all' : idx)
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer border ${
                      isSelected
                        ? 'border-chick-yellow bg-chick-yellow/20 text-[var(--text-main)] shadow-xs scale-105'
                        : 'border-[var(--border-subtle)] bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span className={`size-2.5 rounded-full ${palette.dotClass}`} />
                    <span>
                      {trEn(`Konuşmacı ${idx + 1}`, `Speaker ${idx + 1}`)} ({countForSpeaker})
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* List of Highlighted Speaker Turns */}
          {filteredSpeakerTurns.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-8 text-center text-sm text-[var(--text-muted)]">
              {trEn(
                'Seçilen konuşmacı için herhangi bir konuşma bulunamadı.',
                'No speech found for the selected speaker.',
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSpeakerTurns.map((turn) => {
                const jumpUrl = mediaUrl ? getTimestampUrl(mediaUrl, turn.start) : null
                const startTimeFormatted = formatSecondsToTimestamp(turn.start)
                const endTimeFormatted = formatSecondsToTimestamp(turn.end)
                const turnDurationSec = Math.max(1, Math.round(turn.end - turn.start))

                return (
                  <div
                    key={turn.id}
                    className={`rounded-2xl border border-[var(--border-subtle)] p-5 sm:p-6 transition shadow-xs space-y-3.5 border-l-4 ${turn.palette.borderAccent} ${turn.palette.cardBg}`}
                  >
                    {/* Turn Header: Speaker badge + Time jump + Duration + Copy */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)]/70 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Speaker Avatar Badge with Switch Dropdown */}
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold shadow-xs ${turn.palette.badgeClass}`}
                        >
                          <span className={`size-2 rounded-full ${turn.palette.dotClass}`} />
                          <MessageSquare className="size-3" aria-hidden="true" />
                          <label htmlFor={`switch-sp-${turn.id}`} className="sr-only">
                            {trEn('Konuşmacı Seç', 'Select Speaker')}
                          </label>
                          <select
                            id={`switch-sp-${turn.id}`}
                            value={turn.speakerIndex}
                            onChange={(e) => handleSwitchSpeaker(turn.id, Number(e.target.value))}
                            className="bg-transparent font-bold text-inherit outline-none cursor-pointer py-0.5"
                            title={trEn('Bu konuşmayı başka bir konuşmacıya ata', 'Reassign this turn to another speaker')}
                          >
                            {Array.from({ length: speakerCount }).map((_, sIdx) => (
                              <option
                                key={sIdx}
                                value={sIdx}
                                className="bg-[var(--card-bg)] text-[var(--text-main)] font-semibold"
                              >
                                {trEn(`Konuşmacı ${sIdx + 1}`, `Speaker ${sIdx + 1}`)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Conversational Role Pill if detected */}
                        {turn.role && (
                          <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--text-muted)]">
                            {turn.role}
                          </span>
                        )}

                        {/* Timestamp Jump Badge */}
                        {jumpUrl ? (
                          <a
                            href={jumpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-chick-yellow/60 bg-chick-yellow/20 px-3 py-1 font-mono text-xs font-bold text-[var(--text-main)] transition hover:bg-chick-yellow hover:text-black cursor-pointer shadow-xs"
                            title={trEn(
                              `Videoda ${startTimeFormatted} anına git`,
                              `Jump to ${startTimeFormatted} in video`,
                            )}
                          >
                            <Clock className="size-3 text-chick-orange" aria-hidden="true" />
                            <span>
                              {startTimeFormatted} – {endTimeFormatted}
                            </span>
                            <ExternalLink className="size-2.5 opacity-70" aria-hidden="true" />
                          </a>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg)] px-3 py-1 font-mono text-xs font-bold text-[var(--text-main)]">
                            <Clock className="size-3 text-chick-orange" aria-hidden="true" />
                            <span>
                              {startTimeFormatted} – {endTimeFormatted}
                            </span>
                          </div>
                        )}

                        <span className="text-[11px] font-mono text-[var(--text-muted)]">
                          (~{turnDurationSec} {trEn('sn', 's')})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(
                            `[${startTimeFormatted}] ${turn.speakerName}: ${turn.text}`,
                          )
                          setCopiedTurnId(turn.id)
                          setTimeout(() => setCopiedTurnId(null), 2000)
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                        title={trEn('Bu konuşmayı kopyala', 'Copy this turn')}
                      >
                        {copiedTurnId === turn.id ? (
                          <>
                            <Check className="size-3 text-chick-success" aria-hidden="true" />
                            <span>{trEn('Kopyalandı', 'Copied')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" aria-hidden="true" />
                            <span>{trEn('Kopyala', 'Copy')}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Speech Text: Highlighted with speaker's distinctive color */}
                    <div
                      className={`rounded-xl p-4 text-base sm:text-lg leading-relaxed font-sans select-text whitespace-pre-wrap ${turn.palette.highlightClass} border ${turn.palette.borderAccent}`}
                    >
                      {turn.text}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : activeViewMode === 'timestamps' && segmentGroups.length > 0 ? (
        <div className="mt-5 space-y-4">
          {/* Header controls: Interval selector pills & info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-3.5 sm:px-4 sm:py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Clock className="size-4 text-chick-orange shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold text-[var(--text-main)] font-sans">
                {trEn('Bölüm Süresi:', 'Chapter Duration:')}
              </span>
              <div className="inline-flex flex-wrap items-center gap-1">
                {[
                  { sec: 180, tr: '3 Dakika (Önerilen)', en: '3 Min (Recommended)' },
                  { sec: 60, tr: '1 Dakika', en: '1 Min' },
                  { sec: 300, tr: '5 Dakika', en: '5 Min' },
                  { sec: 0, tr: 'Cümle Cümle', en: 'Per Sentence' },
                ].map((opt) => (
                  <button
                    key={opt.sec}
                    type="button"
                    onClick={() => setChunkInterval(opt.sec)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                      chunkInterval === opt.sec
                        ? 'bg-chick-yellow text-black shadow-xs'
                        : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {trEn(opt.tr, opt.en)}
                  </button>
                ))}
              </div>
            </div>

            {mediaUrl && (
              <span className="text-[11px] font-medium text-[var(--text-muted)]">
                {trEn(
                  'Zaman rozetlerine tıklayarak videoda ilgili bölüme gidebilirsiniz.',
                  'Click timestamp badges to jump to that moment in video.',
                )}
              </span>
            )}
          </div>

          {/* Grouped Chapter Cards */}
          <div className="space-y-4">
            {segmentGroups.map((group) => {
              const jumpUrl = mediaUrl ? getTimestampUrl(mediaUrl, group.start) : null
              const startTimeFormatted = formatSecondsToTimestamp(group.start)
              const endTimeFormatted = formatSecondsToTimestamp(group.end)
              const groupDurationSec = Math.max(1, Math.round(group.end - group.start))
              const groupDurationMins = Math.max(1, Math.round(groupDurationSec / 60))

              return (
                <div
                  key={group.id}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-5 sm:p-6 transition hover:border-chick-yellow/70 hover:bg-[var(--card-bg)] shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)]/70 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-chick-orange/15 px-3 py-1 font-mono text-xs font-bold text-chick-orange">
                        {trEn(`Bölüm ${group.id}`, `Chapter ${group.id}`)}
                      </span>

                      {jumpUrl ? (
                        <a
                          href={jumpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-chick-yellow/60 bg-chick-yellow/20 px-3 py-1 font-mono text-xs font-bold text-[var(--text-main)] transition hover:bg-chick-yellow hover:text-black cursor-pointer shadow-xs"
                          title={trEn(
                            `Videoda ${startTimeFormatted} anına git`,
                            `Jump to ${startTimeFormatted} in video`,
                          )}
                        >
                          <Clock className="size-3 text-chick-orange" aria-hidden="true" />
                          <span>
                            {startTimeFormatted} – {endTimeFormatted}
                          </span>
                          <ExternalLink className="size-2.5 opacity-70" aria-hidden="true" />
                        </a>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg)] px-3 py-1 font-mono text-xs font-bold text-[var(--text-main)]">
                          <Clock className="size-3 text-chick-orange" aria-hidden="true" />
                          <span>
                            {startTimeFormatted} – {endTimeFormatted}
                          </span>
                        </div>
                      )}

                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        (~{groupDurationMins} {trEn('dk', 'min')})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(group.text)
                        setCopiedGroupId(group.id)
                        setTimeout(() => setCopiedGroupId(null), 2000)
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                      title={trEn('Bu bölümü kopyala', 'Copy this chapter')}
                    >
                      {copiedGroupId === group.id ? (
                        <>
                          <Check className="size-3 text-chick-success" aria-hidden="true" />
                          <span>{trEn('Kopyalandı', 'Copied')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" aria-hidden="true" />
                          <span>{trEn('Bölümü Kopyala', 'Copy')}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-base sm:text-lg leading-8 text-[var(--text-main)] font-sans select-text whitespace-pre-wrap">
                    {group.text}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      ) : activeViewMode === 'highlights' && aiResult ? (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[var(--text-muted)]">
              {trEn(
                'Metnin orijinal içeriği ve cümle yapısı bozulmadan yalnızca en önemli kısımlar listelendi:',
                'Only the most important sentences are listed below without altering the original wording or meaning:',
              )}
            </p>
            {onUpdateText && aiResult.important_only_text && (
              <button
                type="button"
                onClick={() => onUpdateText(aiResult.important_only_text)}
                className="inline-flex items-center gap-1.5 rounded-full border border-chick-yellow bg-chick-yellow/20 px-3 py-1 text-xs font-bold text-[var(--text-main)] hover:bg-chick-yellow hover:text-black transition cursor-pointer"
              >
                <Check className="size-3.5" aria-hidden="true" />
                <span>
                  {trEn('Sadece Önemli Yerleri Kaydet', 'Keep Only Important Parts')}
                </span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {aiResult.highlights.map((sentence, index) => (
              <div
                key={index}
                className="flex items-start gap-3.5 rounded-2xl border border-chick-yellow/50 bg-[var(--sidebar-bg)] p-4 sm:p-5 transition hover:border-chick-yellow"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-chick-yellow font-mono text-xs font-bold text-black">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="text-base sm:text-lg leading-relaxed text-[var(--text-main)] font-sans select-text">
                  {sentence}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : activeViewMode === 'translated' && translationResult ? (
        /* MODE 2: TRANSLATED VIEW (Çevrilmiş Metin Görünümü) */
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
              <Languages className="size-4 text-chick-orange" aria-hidden="true" />
              <span>
                {trEn(
                  `Kaynak dil: ${translationResult.source_language.toUpperCase()} → Hedef dil: ${translationResult.target_language.toUpperCase()}`,
                  `Source language: ${translationResult.source_language.toUpperCase()} → Target language: ${translationResult.target_language.toUpperCase()}`,
                )}
              </span>
            </div>
            {onUpdateText && translationResult.translated_text && (
              <button
                type="button"
                onClick={() => onUpdateText(translationResult.translated_text)}
                className="inline-flex items-center gap-1.5 rounded-full border border-chick-yellow bg-chick-yellow/20 px-3 py-1 text-xs font-bold text-[var(--text-main)] hover:bg-chick-yellow hover:text-black transition cursor-pointer"
              >
                <Check className="size-3.5" aria-hidden="true" />
                <span>
                  {trEn('Çeviriyi Ana Metin Yap', 'Use Translation as Main Text')}
                </span>
              </button>
            )}
          </div>

          <div className="space-y-3.5">
            {translatedParagraphs.map((para, index) => (
              <div
                key={index}
                className="flex items-start gap-3.5 rounded-2xl border border-chick-yellow/50 bg-[var(--sidebar-bg)] p-4 sm:p-5 transition"
              >
                <span className="mt-1 select-none font-mono text-[11px] font-bold text-chick-orange opacity-80">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="flex-1 text-base sm:text-lg leading-8 text-[var(--text-main)] font-sans select-text">
                  {para}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : activeViewMode === 'readable' ? (
        /* MODE 3: READABLE PARAGRAPHS (İçeriği Bozmadan Okunaklı Paragraf Görünümü) */
        <div className="mt-5 space-y-3.5">
          {paragraphs.map((para, index) => {
            const isHighlighted =
              aiResult?.highlights.some((h) => para.includes(h)) ?? false
            return (
              <div
                key={index}
                className={`group flex items-start gap-3.5 rounded-2xl border p-4 sm:p-5 transition ${
                  isHighlighted
                    ? 'border-chick-yellow/70 bg-chick-yellow/10'
                    : 'border-[var(--border-subtle)] bg-[var(--sidebar-bg)]'
                }`}
              >
                <span className="mt-1 select-none font-mono text-[11px] font-bold text-chick-orange opacity-80">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="flex-1 text-base sm:text-lg leading-8 text-[var(--text-main)] font-sans select-text">
                  {para}
                </p>
              </div>
            )
          })}
        </div>
      ) : (
        /* MODE 4: RAW CONTINUOUS TEXT */
        <div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-6 text-base sm:text-lg leading-relaxed font-sans text-[var(--text-main)] whitespace-pre-wrap select-text">
          {text}
        </div>
      )}
    </section>
  )
}
