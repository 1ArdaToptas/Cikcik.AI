import { CheckCircle2, Clock, LoaderCircle, Mic, Plus, Trash2, Wand2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { AudioPlayer } from '../components/AudioPlayer'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { CustomVoiceModal } from '../components/CustomVoiceModal'
import { BorderBeam } from '../components/magicui'
import { ClickSpark, ShinyText } from '../components/react-bits'
import { RadixSlider } from '../components/ui/RadixSlider'
import { Tooltip } from '../components/ui/Tooltip'
import { useLanguage } from '../context/LanguageContext'
import { useStudio } from '../context/StudioContext'
import { voiceAccent } from '../data/catalog'
import { formatClock, formatRelativeTime, truncate } from '../lib/format'
import { deleteCustomVoice } from '../lib/ttsApi'

const DEFAULT_TEXT_TR =
  'Merhaba! Bu stüdyoda artık son derece akıcı, teklemeyen Türkçe ve İngilizce yapay zekâ sesleriyle metinlerinizi seslendirebilirsiniz.'
const DEFAULT_TEXT_EN =
  'Welcome to the voice studio! You can now generate natural, crystal-clear speech in both English and Turkish.'

type VoiceFilter = 'all' | 'tr' | 'en' | 'custom'

export function TextToSpeech() {
  const {
    catalog,
    catalogError,
    generate,
    isGenerating,
    errorMessage,
    activeClip,
    generations,
    playGeneration,
    deleteGeneration,
    clearHistory,
    voiceById,
    refreshCatalog,
  } = useStudio()
  const { locale, trEn } = useLanguage()
  const { voices, languages, limits } = catalog
  const maxChars = limits.max_text_length

  const [text, setText] = useState(DEFAULT_TEXT_TR)
  const [voiceChoice, setVoiceId] = useState('')
  const [voiceFilter, setVoiceFilter] = useState<VoiceFilter>('all')
  const [languageChoice, setLanguageId] = useState('')
  const [speedChoice, setSpeed] = useState(1)
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)

  // Filtered voices for display
  const filteredVoices = useMemo(() => {
    if (voiceFilter === 'all') return voices
    if (voiceFilter === 'custom') {
      return voices.filter((v) => v.engine === 'custom_clone' || v.is_custom)
    }
    return voices.filter((v) => v.languages.includes(voiceFilter))
  }, [voices, voiceFilter])

  // Selected voice (fallback to first available)
  const selectedVoice =
    voices.find((voice) => voice.id === voiceChoice) ?? filteredVoices[0] ?? voices[0]
  const voiceId = selectedVoice?.id ?? ''

  // Filter languages supported by selected voice
  const availableLanguages = useMemo(
    () => languages.filter((language) => selectedVoice?.languages.includes(language.id)),
    [languages, selectedVoice],
  )
  const languageId = availableLanguages.some((language) => language.id === languageChoice)
    ? languageChoice
    : (availableLanguages[0]?.id ?? '')
  const speed = Math.min(limits.max_speed, Math.max(limits.min_speed, speedChoice))

  const remaining = maxChars - text.length
  const usagePct = Math.min(100, Math.max(0, (text.length / Math.max(1, maxChars)) * 100))
  const canGenerate =
    text.trim().length > 0 && !isGenerating && remaining >= 0 && Boolean(voiceId && languageId)
  const recent = useMemo(() => generations.slice(0, 8), [generations])

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    title: string
    description?: string
    itemCount?: number
    onConfirm: () => Promise<void> | void
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {},
  })

  const handleDeleteVoice = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteModal({
      isOpen: true,
      title: trEn('Özel Sesi Sil', 'Delete Custom Voice'),
      description: trEn(
        `"${name}" adlı özel ses karakteri kalıcı olarak silinecektir.`,
        `The custom voice "${name}" will be permanently deleted.`,
      ),
      onConfirm: async () => {
        await deleteCustomVoice(id)
        await refreshCatalog()
        if (voiceChoice === id) {
          setVoiceId('')
        }
      },
    })
  }

  const [progress, setProgress] = useState(0)
  const [estimatedRemainingSec, setEstimatedRemainingSec] = useState(0)
  const [progressStage, setProgressStage] = useState('')
  const [showProgress, setShowProgress] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
      }
    }
  }, [])

  const onGenerate = async () => {
    if (!canGenerate) return

    setShowProgress(true)
    setProgress(10)
    const textLen = text.trim().length
    const currentVoice = voiceById(voiceId)
    let estimatedTotal = 2.0
    if (currentVoice?.engine === 'custom_clone') {
      estimatedTotal = Math.max(3.5, textLen * 0.07 + 2.5)
    } else if (currentVoice?.engine === 'piper') {
      estimatedTotal = Math.max(2.2, textLen * 0.03 + 1.8)
    } else {
      estimatedTotal = Math.max(1.8, textLen * 0.014 + 1.2)
    }

    setEstimatedRemainingSec(Math.ceil(estimatedTotal))
    setProgressStage(trEn('Metin çözümleniyor & fonem analizi yapılıyor…', 'Parsing text & analyzing phonemes…'))

    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
    }

    const startTime = Date.now()
    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const remaining = Math.max(0.5, estimatedTotal - elapsed)
      setEstimatedRemainingSec(Math.ceil(remaining))

      const ratio = elapsed / estimatedTotal
      let nextPct: number
      if (ratio > 1) {
        nextPct = Math.min(97, Math.round(90 + (1 - Math.exp(-0.8 * (ratio - 1))) * 7))
      } else {
        nextPct = Math.max(10, Math.min(93, Math.round(ratio * 93)))
      }
      setProgress(nextPct)

      if (nextPct < 25) {
        setProgressStage(trEn('Metin çözümleniyor & fonem analizi yapılıyor…', 'Parsing text & analyzing phonemes…'))
      } else if (nextPct < 60) {
        setProgressStage(trEn('Nöral ses dalgaları işleniyor…', 'Synthesizing neural voice waveforms…'))
      } else if (nextPct < 85) {
        setProgressStage(trEn('Doğal vurgular ve tonlama oluşturuluyor…', 'Generating natural prosody and intonation…'))
      } else {
        setProgressStage(trEn('Ses klibi birleştiriliyor & optimize ediliyor…', 'Assembling audio clip & finalizing…'))
      }
    }, 120)

    try {
      await generate({ text, voiceId, languageId, speed })
      setProgress(100)
      setEstimatedRemainingSec(0)
      setProgressStage(trEn('Sentezleme tamamlandı! Ses hazır.', 'Synthesis complete! Audio is ready.'))
    } finally {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
      setTimeout(() => {
        setShowProgress(false)
        setProgress(0)
      }, 1400)
    }
  }

  const speedPresets = [0.85, 1.0, 1.15, 1.25]

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)]">
      <div className="flex flex-col gap-6 animate-enter">
        <section className="cambly-card relative overflow-hidden p-5 sm:p-7 shadow-xl">
          <BorderBeam duration={14} borderWidth={1.5} colorFrom="#FFE733" colorTo="#F59E0B" />
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src="/logo.jpg"
                  alt={trEn('Cicik Metin Seslendirme Maskotu', 'Cicik Text-to-Speech Mascot')}
                  width={36}
                  height={36}
                  loading="lazy"
                  decoding="async"
                  className="size-9 rounded-xl object-cover ring-2 ring-chick-yellow/60 shadow-md animate-chirp"
                />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-chick-orange font-sans">
                  {trEn('Cicik Metin Editörü', 'Cicik Text Editor')}
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text-main)] font-display">
                  <label htmlFor="script">
                    {trEn('Civciv Ne Okusun?', 'What Should Cicik Read?')}
                  </label>
                </h1>
              </div>
            </div>
            <span
              className={`font-mono text-xs font-bold px-3 py-1 rounded-full ${
                remaining < 0
                  ? 'bg-chick-red/15 text-chick-red border border-chick-red/30'
                  : 'bg-[var(--sidebar-bg)] text-[var(--text-main)] border border-[var(--border-subtle)]'
              }`}
              aria-live="polite"
            >
              {text.length.toLocaleString(locale)} / {maxChars.toLocaleString(locale)}{' '}
              {trEn('harf', 'chars')}
            </span>
          </div>

          <textarea
            id="script"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) void onGenerate()
            }}
            maxLength={maxChars}
            rows={7}
            placeholder={trEn(
              'Seslendirmek istediğiniz Türkçe veya İngilizce metni buraya yazın...',
              'Type or paste the Turkish or English text you want to synthesize here...',
            )}
            className="w-full resize-y rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-main)] px-4 py-3.5 text-[15px] leading-7 text-[var(--text-main)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-chick-yellow focus:ring-1 focus:ring-chick-yellow"
          />

          {/* Subtle capacity progress bar */}
          <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-[var(--sidebar-bg)]">
            <div
              className="h-full rounded-full bg-chick-yellow transition-all duration-300"
              style={{ width: `${Math.max(1.5, usagePct)}%` }}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
            <span>
              {trEn(
                'İpucu: Ctrl + Enter ile doğrudan seslendirin.',
                'Tip: Press Ctrl + Enter to synthesize directly.',
              )}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setText(DEFAULT_TEXT_EN)}
                className="hover:text-chick-orange underline font-semibold cursor-pointer"
              >
                {trEn('İngilizce Örnek', 'English Sample')}
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setText(DEFAULT_TEXT_TR)}
                className="hover:text-chick-orange underline font-semibold cursor-pointer"
              >
                {trEn('Türkçe Örnek', 'Turkish Sample')}
              </button>
            </div>
          </div>
        </section>

        <section className="cambly-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-chick-orange font-sans">
                {trEn('Ötüş Karakterleri', 'Voice Characters')}
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-main)] font-display">
                {trEn('Yapay Zekâ Sesleri & Klonların', 'AI Voices & Your Clones')}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(true)}
                className="group flex items-center gap-2 rounded-full border border-purple-500/50 bg-purple-500/15 dark:bg-purple-500/20 px-3.5 py-2 text-xs font-bold transition hover:bg-purple-500/25 hover:scale-105 shadow-xs cursor-pointer"
              >
                <Plus
                  className="size-3.5 text-purple-700 dark:text-purple-300 group-hover:rotate-90 transition-transform"
                  aria-hidden="true"
                />
                <Mic className="size-3.5 text-purple-700 dark:text-purple-300" aria-hidden="true" />
                <span className="font-bold text-purple-950 dark:text-purple-200">
                  {trEn('Kendi Sesini Klonla', 'Clone Your Voice')}
                </span>
              </button>
              <span className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-500/50 bg-amber-500/20 dark:bg-amber-400/15 px-3 py-1.5 text-xs font-bold shadow-xs">
                <span className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span className="font-bold text-amber-950 dark:text-amber-200">
                  {trEn('XTTS + Neural Canlı', 'XTTS + Neural Live')}
                </span>
              </span>
            </div>
          </div>

          {/* Voice Filter Pills */}
          <div
            className="mt-4 flex flex-wrap items-center gap-1.5 border-b border-[var(--border-subtle)] pb-4"
            role="tablist"
            aria-label={trEn('Ses Filtresi', 'Voice Filter')}
          >
            {(
              [
                { id: 'all', label: trEn('Tümü', 'All') },
                { id: 'tr', label: trEn('Türkçe', 'Turkish') },
                { id: 'en', label: trEn('İngilizce', 'English') },
                { id: 'custom', label: trEn('Özel Klon', 'Custom Clone') },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={voiceFilter === f.id}
                onClick={() => setVoiceFilter(f.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  voiceFilter === f.id
                    ? 'bg-chick-yellow text-black shadow-xs'
                    : 'border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {catalogError ? (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300" role="status">
              {catalogError}{' '}
              {trEn(
                'Varsayılan ses listesi gösteriliyor.',
                'Showing default fallback voice list.',
              )}
            </p>
          ) : null}

          {filteredVoices.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-6 text-center text-xs text-[var(--text-muted)]">
              {trEn(
                'Bu filtrede henüz ses karakteri bulunmuyor.',
                'No voice characters found in this filter yet.',
              )}
            </div>
          ) : (
            <div
              className="mt-5 grid gap-3 sm:grid-cols-2"
              role="radiogroup"
              aria-label={trEn('Ses', 'Voice')}
            >
              {filteredVoices.map((voice) => {
                const selected = voice.id === voiceId
                const isFluent = voice.engine === 'edge'
                const isCustom = voice.engine === 'custom_clone' || voice.is_custom
                return (
                  <button
                    key={voice.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setVoiceId(voice.id)}
                    className={`group relative rounded-2xl border p-4 text-left transition cursor-pointer ${
                      selected
                        ? isCustom
                          ? 'border-purple-500 bg-purple-500/15 shadow-sm ring-2 ring-purple-500/40'
                          : 'border-[var(--focus-ring)] bg-[var(--surface-hover)] shadow-sm ring-2 ring-[var(--focus-ring)]/40'
                        : 'border-[var(--border-subtle)] bg-[var(--sidebar-bg)] hover:border-[var(--focus-ring)]/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white shadow-xs ring-1 ring-black/10 dark:ring-white/15 ${
                          isCustom
                            ? 'bg-gradient-to-br from-purple-600 to-indigo-700'
                            : voiceAccent(voice.id)
                        }`}
                      >
                        {voice.name.slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-bold text-[var(--text-main)] font-display">
                            {voice.name}
                          </p>
                          {selected && (
                            <span
                              className={`size-2 rounded-full shrink-0 ${
                                isCustom ? 'bg-purple-500' : 'bg-[var(--focus-ring)]'
                              }`}
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <p className="truncate text-xs text-[var(--text-muted)] font-sans">
                          {voice.style}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                            isCustom
                              ? 'border-purple-400/50 bg-purple-500/20 text-purple-700 dark:text-purple-300'
                              : isFluent
                                ? 'border-[var(--focus-ring)]/40 bg-[var(--focus-ring)]/10 text-[var(--text-main)]'
                                : 'border-[var(--border-subtle)] text-[var(--text-muted)] bg-[var(--card-bg)]'
                          }`}
                        >
                          {isCustom ? (
                            <ShinyText text={voice.tag} speed={3} shimmerColor="#d8b4fe" />
                          ) : (
                            voice.tag
                          )}
                        </span>
                        {isCustom && (
                          <Tooltip content={trEn('Bu özel sesi sil', 'Delete this custom voice')}>
                            <span
                              role="button"
                              tabIndex={0}
                              aria-label={trEn('Bu özel sesi sil', 'Delete this custom voice')}
                              onClick={(e) => handleDeleteVoice(voice.id, voice.name, e)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  handleDeleteVoice(
                                    voice.id,
                                    voice.name,
                                    e as unknown as React.MouseEvent,
                                  )
                                }
                              }}
                              className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-chick-red/20 hover:text-chick-red transition cursor-pointer"
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="cambly-card p-5">
            <label
              htmlFor="language"
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)] font-sans"
            >
              {trEn('Dil', 'Language')}
            </label>
            <select
              id="language"
              value={languageId}
              onChange={(event) => setLanguageId(event.target.value)}
              disabled={availableLanguages.length <= 1}
              className="mt-3 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3.5 py-3 text-sm font-medium text-[var(--text-main)] outline-none focus:border-chick-yellow disabled:opacity-80 transition cursor-pointer"
            >
              {availableLanguages.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.native} ({language.label})
                </option>
              ))}
            </select>
          </div>

          <div className="cambly-card p-5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="speed"
                className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)] font-sans"
              >
                {trEn('Konuşma Hızı', 'Speech Speed')}
              </label>
              <div className="flex items-center gap-1">
                {speedPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSpeed(preset)}
                    className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold transition cursor-pointer ${
                      Math.abs(speed - preset) < 0.01
                        ? 'bg-chick-yellow text-black'
                        : 'bg-[var(--sidebar-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {preset}×
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <RadixSlider
                value={speed}
                onChange={setSpeed}
                min={limits.min_speed}
                max={limits.max_speed}
                step={0.05}
                ariaLabel={trEn('Konuşma hızı', 'Speech speed')}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] font-medium text-[var(--text-muted)] font-sans">
              <span>{trEn('Aheste (Yavaş)', 'Slow (Calm)')}</span>
              <span className="font-mono font-bold text-chick-orange">{speed.toFixed(2)}×</span>
              <span>{trEn('Hızlı (Seri)', 'Fast (Rapid)')}</span>
            </div>
          </div>
        </section>

        {/* Real-time Progress & Estimated Time Remaining Panel */}
        {showProgress && (
          <div
            className="cambly-card p-4 sm:p-5 border-2 border-[var(--focus-ring)]/40 shadow-md animate-enter"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={trEn('Ses oluşturma ilerlemesi', 'Voice generation progress')}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {progress === 100 ? (
                  <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                ) : (
                  <LoaderCircle className="size-4.5 animate-spin text-[var(--focus-ring)] shrink-0" aria-hidden="true" />
                )}
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {trEn('Ses Üretim İlerlemesi', 'Voice Generation Progress')}
                </span>
                <span className="font-mono text-sm font-extrabold text-[var(--text-main)]">
                  %{progress}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3 py-1 font-mono text-xs font-bold text-[var(--text-main)] shadow-2xs">
                <Clock className="size-3.5 text-chick-orange shrink-0" aria-hidden="true" />
                <span>
                  {progress === 100
                    ? trEn('Tamamlandı', 'Done')
                    : trEn(`Kalan Tahmini: ~${estimatedRemainingSec} sn`, `Estimated Remaining: ~${estimatedRemainingSec}s`)}
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="relative mt-3 h-3 w-full overflow-hidden rounded-full bg-[var(--sidebar-bg)] border border-[var(--border-subtle)] p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-150 relative overflow-hidden ${
                  progress === 100
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-amber-500 via-chick-yellow to-chick-orange'
                }`}
                style={{ width: `${progress}%` }}
              >
                {progress < 100 && (
                  <div className="absolute inset-0 bg-white/25 animate-pulse" />
                )}
              </div>
            </div>

            {/* Sub-status label */}
            <div className="mt-2.5 flex items-center justify-between text-xs text-[var(--text-muted)] font-sans">
              <span className="truncate font-medium text-[var(--text-main)]">{progressStage}</span>
              <span className="shrink-0 font-mono text-[11px] text-[var(--text-muted)] ml-2">
                {text.trim().length} {trEn('karakter', 'chars')}
              </span>
            </div>
          </div>
        )}

        <ClickSpark sparkColor="#FFE733" sparkCount={12} className="w-full">
          <button
            type="button"
            onClick={() => void onGenerate()}
            disabled={!canGenerate}
            className="group relative inline-flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-chick-yellow px-8 text-sm sm:text-base font-bold text-black transition-all hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-sm animate-cambly-pulse"
          >
            {isGenerating ? (
              <>
                <LoaderCircle className="size-5 animate-spin text-black shrink-0" aria-hidden="true" />
                <span className="font-bold tracking-wide">
                  {trEn(
                    `%${progress} · Sentezleniyor (~${estimatedRemainingSec} sn)…`,
                    `%${progress} · Synthesizing (~${estimatedRemainingSec}s)…`,
                  )}
                </span>
                <div className="flex items-end gap-1 h-4 ml-1" aria-hidden="true">
                  <span
                    className="w-1 rounded-full bg-black animate-wave-bar"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-1 rounded-full bg-black animate-wave-bar"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1 rounded-full bg-black animate-wave-bar"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </>
            ) : (
              <>
                <img
                  src="/logo.jpg"
                  alt={trEn('Cicik Seslendir İkonu', 'Cicik Synthesize Icon')}
                  width={24}
                  height={24}
                  loading="lazy"
                  decoding="async"
                  className="size-6 rounded-lg object-cover ring-1 ring-black/20 group-hover:scale-110 transition"
                />
                <span className="tracking-wide">
                  {trEn('Doğal ve Akıcı Seslendir', 'Synthesize Natural Speech')}
                </span>
                <Wand2 className="size-4 opacity-75 group-hover:rotate-12 transition" aria-hidden="true" />
              </>
            )}
          </button>
        </ClickSpark>
        <div aria-live="assertive" role="alert">
          {errorMessage ? (
            <p className="rounded-xl border border-chick-red/30 bg-chick-red/10 p-3 text-xs font-semibold text-chick-red">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <AudioPlayer clip={activeClip} />
      </div>

      <aside className="animate-enter lg:sticky lg:top-24 lg:self-start">
        <section className="cambly-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)] font-sans">
                {trEn('Kitaplık', 'Library')}
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--text-main)] font-display">
                {trEn('Son üretilenler', 'Recent Generations')}
              </h2>
            </div>
            {generations.length > 0 ? (
              <Tooltip content={trEn('Geçmişi temizle', 'Clear history')}>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModal({
                      isOpen: true,
                      title: trEn('Üretim Geçmişini Sil', 'Clear Generation History'),
                      description: trEn(
                        'Son üretilen tüm ses kayıtları geçmişten kaldırılacaktır. Bu işlem geri alınamaz.',
                        'All recently generated audio recordings will be cleared from history. This cannot be undone.',
                      ),
                      itemCount: generations.length,
                      onConfirm: async () => {
                        clearHistory()
                      },
                    })
                  }}
                  className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-chick-red/10 hover:text-chick-red cursor-pointer"
                  aria-label={trEn('Geçmişi temizle', 'Clear history')}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </Tooltip>
            ) : null}
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--text-muted)] font-sans">
            {trEn(
              'Oynatıcıya yüklemek için bir klibe tıklayın.',
              'Click a clip to load it into the player.',
            )}
          </p>

          {recent.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-[var(--border-subtle)] px-3 py-6 text-center text-xs text-[var(--text-muted)] font-sans">
              {trEn(
                'Henüz kayıt yok. İlk sesinizi üretin.',
                'No clips yet. Generate your first audio.',
              )}
            </p>
          ) : (
            <ul className="mt-5 space-y-2">
              {recent.map((item) => {
                const voice = voiceById(item.voiceId)
                const active = activeClip?.generation.id === item.id
                return (
                  <li key={item.id} className="relative group/clip">
                    <div
                      className={`w-full rounded-2xl border transition ${
                        active
                          ? 'border-[var(--focus-ring)] bg-[var(--surface-hover)] shadow-xs ring-1 ring-[var(--focus-ring)]/40'
                          : 'border-[var(--border-subtle)] bg-[var(--sidebar-bg)] hover:border-[var(--focus-ring)]/60'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => void playGeneration(item)}
                        disabled={isGenerating}
                        aria-current={active ? 'true' : undefined}
                        className="w-full rounded-2xl px-3.5 py-3 text-left transition disabled:cursor-wait cursor-pointer pr-8"
                      >
                        <p className="text-sm font-medium leading-5 text-[var(--text-main)]">
                          {truncate(item.text, 72)}
                        </p>
                        <p className="mt-2 text-[11px] font-mono text-[var(--text-muted)]">
                          {voice?.name ?? item.voiceId} · {formatClock(item.duration)} ·{' '}
                          {formatRelativeTime(item.createdAt, locale)}
                        </p>
                      </button>

                      <Tooltip content={trEn('Bu kaydı sil', 'Delete this clip')}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteGeneration(item.id)
                          }}
                          aria-label={trEn('Bu kaydı sil', 'Delete this clip')}
                          className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--text-muted)] opacity-60 hover:opacity-100 hover:bg-chick-red/10 hover:text-chick-red transition cursor-pointer"
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </Tooltip>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </aside>

      <CustomVoiceModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSuccess={(newId) => {
          setVoiceId(newId)
          void refreshCatalog()
        }}
      />

      {/* In-App UX Pro Max Confirm & Loading Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        description={deleteModal.description}
        itemCount={deleteModal.itemCount}
        onConfirm={deleteModal.onConfirm}
        onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
