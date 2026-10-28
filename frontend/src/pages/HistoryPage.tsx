import {
  ArrowRight,
  Clock,
  Download,
  FileAudio,
  Headphones,
  Mic,
  Play,
  Trash2,
  Volume2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AudioPlayer } from '../components/AudioPlayer'
import { CicikMascot } from '../components/CicikMascot'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { useLanguage } from '../context/LanguageContext'
import { useStudio } from '../context/StudioContext'
import { formatClock, formatRelativeTime } from '../lib/format'
import type { Generation } from '../types'

type SavedTranscript = {
  id: string
  title: string
  text: string
  createdAt: string
  duration: number
  wordCount: number
}

function loadSavedTranscripts(): SavedTranscript[] {
  try {
    const raw = localStorage.getItem('cicik_transcripts_v1')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function HistoryPage() {
  const {
    generations,
    activeClip,
    playGeneration,
    deleteGeneration,
    clearHistory,
    voiceById,
    languageById,
  } = useStudio()
  const { locale, trEn } = useLanguage()
  const [activeTab, setActiveTab] = useState<'tts' | 'stt'>('tts')
  const [transcripts, setTranscripts] = useState<SavedTranscript[]>(loadSavedTranscripts)
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

  const totalTtsSeconds = useMemo(
    () => generations.reduce((sum, g) => sum + g.duration, 0),
    [generations],
  )
  const totalSttSeconds = useMemo(
    () => transcripts.reduce((sum, t) => sum + t.duration, 0),
    [transcripts],
  )

  const requestDeleteTranscript = (item: SavedTranscript) => {
    setDeleteModal({
      isOpen: true,
      title: trEn('Transkript Kaydını Sil', 'Delete Transcript Entry'),
      description: trEn(
        `"${item.title}" başlıklı konuşma kaydı kalıcı olarak silinecektir.`,
        `The transcript titled "${item.title}" will be permanently deleted.`,
      ),
      onConfirm: async () => {
        const updated = transcripts.filter((t) => t.id !== item.id)
        setTranscripts(updated)
        try {
          localStorage.setItem('cicik_transcripts_v1', JSON.stringify(updated))
        } catch {
          // storage error
        }
      },
    })
  }

  const requestDeleteGeneration = (item: Generation) => {
    setDeleteModal({
      isOpen: true,
      title: trEn('Seslendirme Kaydını Sil', 'Delete Audio Generation'),
      description: trEn(
        `"${item.text.slice(0, 60)}..." adlı ses kaydı kalıcı olarak geçmişten silinecektir.`,
        `The audio clip "${item.text.slice(0, 60)}..." will be permanently deleted from history.`,
      ),
      itemCount: 1,
      onConfirm: async () => {
        deleteGeneration(item.id)
      },
    })
  }

  const requestClearHistory = () => {
    if (activeTab === 'tts') {
      setDeleteModal({
        isOpen: true,
        title: trEn('Tüm Ses Üretim Geçmişini Sil', 'Clear All Audio Generations'),
        description: trEn(
          'Ürettiğiniz tüm yapay zekâ seslendirmeleri kalıcı olarak silinecektir. Bu işlem geri alınamaz.',
          'All AI speech audio generations will be permanently removed. This cannot be undone.',
        ),
        itemCount: generations.length,
        onConfirm: async () => {
          clearHistory()
        },
      })
    } else {
      setDeleteModal({
        isOpen: true,
        title: trEn('Tüm Transkript Geçmişini Sil', 'Clear All Transcript History'),
        description: trEn(
          'Kaydedilen tüm konuşma metinleri ve transkriptler kalıcı olarak silinecektir.',
          'All saved speech transcripts and notes will be permanently removed.',
        ),
        itemCount: transcripts.length,
        onConfirm: async () => {
          setTranscripts([])
          try {
            localStorage.setItem('cicik_transcripts_v1', JSON.stringify([]))
          } catch {
            // ignore
          }
        },
      })
    }
  }

  return (
    <div className="space-y-8 animate-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-chick-orange font-sans">
            <Clock className="size-4" aria-hidden="true" />
            <span>{trEn('Kayıt ve Üretim Arşivi', 'Recording & Generation Archive')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-main)] font-display mt-1">
            {trEn('Ses & Üretim Geçmişi', 'Audio & Generation History')}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] font-sans">
            {trEn(
              'Cicik ile ürettiğin tüm yapay zekâ seslendirmeleri ve mikrofon kayıtlarını buradan dinle ve indir.',
              'Listen to and download all your AI voice generations and microphone recordings created with Cicik.',
            )}
          </p>
        </div>

        {/* Clear history button */}
        {(activeTab === 'tts' && generations.length > 0) ||
        (activeTab === 'stt' && transcripts.length > 0) ? (
          <button
            type="button"
            onClick={requestClearHistory}
            className="inline-flex items-center gap-1.5 rounded-full border border-chick-red/30 bg-chick-red/10 px-4 py-2 text-xs font-bold text-chick-red transition hover:bg-chick-red hover:text-black cursor-pointer shadow-xs"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            <span>{trEn('Geçmişi Temizle', 'Clear History')}</span>
          </button>
        ) : null}
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="cambly-card p-5 flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-chick-yellow/20 text-chick-orange font-bold">
            <Volume2 className="size-6 text-black dark:text-chick-yellow" aria-hidden="true" />
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-[var(--text-main)]">
              {generations.length}
            </p>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {trEn('TTS Ses Üretimi', 'TTS Generations')}
            </p>
          </div>
        </div>

        <div className="cambly-card p-5 flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-500/15 text-sky-500 font-bold">
            <Mic className="size-6 text-sky-600 dark:text-sky-400" aria-hidden="true" />
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-[var(--text-main)]">
              {transcripts.length}
            </p>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {trEn('STT Konuşma Kaydı', 'STT Speech Recordings')}
            </p>
          </div>
        </div>

        <div className="cambly-card p-5 flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-500 font-bold">
            <Headphones className="size-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-[var(--text-main)]">
              {formatClock(totalTtsSeconds + totalSttSeconds)}
            </p>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {trEn('Toplam Ses Süresi', 'Total Audio Duration')}
            </p>
          </div>
        </div>
      </div>

      {/* Active Audio Player (sticky or top card when clip selected) */}
      {activeClip && (
        <div className="animate-enter">
          <AudioPlayer clip={activeClip} />
        </div>
      )}

      {/* Category Tabs: TTS vs STT */}
      <div
        className="inline-flex flex-wrap rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-1 gap-1"
        role="tablist"
        aria-label={trEn('Geçmiş Kategorisi', 'History Category')}
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'tts'}
          onClick={() => setActiveTab('tts')}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeTab === 'tts'
              ? 'bg-chick-yellow text-black font-bold shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Volume2 className="size-4 shrink-0" aria-hidden="true" />
          <span>
            {trEn('Metinden Sese Üretimleri', 'Text-to-Speech Generations')} ({generations.length})
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'stt'}
          onClick={() => setActiveTab('stt')}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition cursor-pointer ${
            activeTab === 'stt'
              ? 'bg-chick-yellow text-black font-bold shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Mic className="size-4 shrink-0" aria-hidden="true" />
          <span>
            {trEn('Konuşma Kayıtları', 'Speech Recordings')} ({transcripts.length})
          </span>
        </button>
      </div>

      {/* Tab 1: TTS Generations */}
      {activeTab === 'tts' && (
        <div>
          {generations.length === 0 ? (
            <div className="cambly-card p-12 text-center flex flex-col items-center space-y-4">
              <CicikMascot mood="empty" size="md" />
              <h2 className="text-lg font-bold text-[var(--text-main)] font-display">
                {trEn('Henüz Ses Üretilmedi', 'No Audio Generated Yet')}
              </h2>
              <p className="text-xs text-[var(--text-muted)] max-w-sm">
                {trEn(
                  'Metinden sese sayfasına giderek Türkçe veya İngilizce bir metni seslendirebilirsin.',
                  'Go to the Text-to-Speech page to synthesize any Turkish or English text.',
                )}
              </p>
              <Link
                to="/speech"
                className="inline-flex items-center gap-2 rounded-full bg-chick-yellow px-6 py-2.5 text-xs font-bold text-black shadow-sm"
              >
                <Volume2 className="size-4" aria-hidden="true" />
                <span>{trEn('Metin Seslendir (TTS)', 'Text to Speech (TTS)')}</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {generations.map((item) => {
                const voice = voiceById(item.voiceId)
                const language = languageById(item.languageId)
                const isActive = activeClip?.generation.id === item.id
                return (
                  <article
                    key={item.id}
                    className={`cambly-card-interactive p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isActive
                        ? 'border-chick-yellow bg-[var(--sidebar-bg)] ring-1 ring-chick-yellow/40'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => void playGeneration(item)}
                        aria-label={trEn('Oynat', 'Play')}
                        className="grid size-11 shrink-0 place-items-center rounded-full bg-chick-yellow text-black shadow-xs transition hover:scale-105 active:scale-95 cursor-pointer"
                        title={trEn('Oynat', 'Play')}
                      >
                        <Play className="size-4 fill-current ml-0.5" aria-hidden="true" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-[var(--text-main)]">
                            {voice?.name ?? item.voiceId}
                          </span>
                          <span className="rounded-full bg-[var(--sidebar-bg)] border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-muted)]">
                            {language?.native ?? item.languageId}
                          </span>
                          <span className="rounded-full bg-chick-yellow/20 px-2 py-0.5 text-[10px] font-mono font-bold text-[var(--text-main)]">
                            {item.speed.toFixed(2)}×
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                          {item.text}
                        </p>

                        <div className="mt-2 flex items-center gap-3 text-[11px] font-mono text-[var(--text-muted)]">
                          <span>{formatClock(item.duration)}</span>
                          <span>·</span>
                          <span>{formatRelativeTime(item.createdAt, locale)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => void playGeneration(item)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-4 py-2 text-xs font-bold text-[var(--text-main)] hover:bg-chick-yellow hover:text-black cursor-pointer transition"
                      >
                        <Headphones className="size-3.5" aria-hidden="true" />
                        <span>{trEn('Dinle', 'Listen')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDeleteGeneration(item)}
                        aria-label={trEn('Bu kaydı sil', 'Delete this recording')}
                        className="p-2 rounded-full border border-chick-red/30 bg-chick-red/10 text-chick-red hover:bg-chick-red hover:text-black transition cursor-pointer"
                        title={trEn('Bu kaydı sil', 'Delete this recording')}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: STT Recordings */}
      {activeTab === 'stt' && (
        <div>
          {transcripts.length === 0 ? (
            <div className="cambly-card p-12 text-center flex flex-col items-center space-y-4">
              <CicikMascot mood="empty" size="md" />
              <h2 className="text-lg font-bold text-[var(--text-main)] font-display">
                {trEn('Henüz Konuşma Kaydı Yok', 'No Speech Recordings Yet')}
              </h2>
              <p className="text-xs text-[var(--text-muted)] max-w-sm">
                {trEn(
                  'Canlı stüdyoya giderek mikrofonunla konuşabilir ve anında kayıt alabilirsin.',
                  'Go to the live studio to speak with your microphone and record right away.',
                )}
              </p>
              <Link
                to="/studio"
                className="inline-flex items-center gap-2 rounded-full bg-chick-yellow px-6 py-2.5 text-xs font-bold text-black shadow-sm"
              >
                <Mic className="size-4" aria-hidden="true" />
                <span>{trEn('Canlı Stüdyoyu Aç', 'Open Live Studio')}</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {transcripts.map((item) => (
                <article
                  key={item.id}
                  className="cambly-card-interactive p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileAudio className="size-4 shrink-0 text-chick-orange" aria-hidden="true" />
                      <h3 className="text-sm font-bold text-[var(--text-main)] font-display truncate">
                        {item.title}
                      </h3>
                    </div>

                    <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed font-sans">
                      {item.text}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-mono text-[var(--text-muted)]">
                      <span>{formatClock(item.duration)}</span>
                      <span>·</span>
                      <span>
                        {item.wordCount} {trEn('kelime', 'words')}
                      </span>
                      <span>·</span>
                      <span>{new Date(item.createdAt).toLocaleString(locale)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Link
                      to="/transcripts"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-main)] hover:bg-chick-yellow hover:text-black cursor-pointer transition"
                    >
                      <span>{trEn('Transkriptte Gör', 'View in Transcripts')}</span>
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([item.text], { type: 'text/plain;charset=utf-8' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${item.title}_${Date.now()}.txt`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      aria-label={trEn('İndir (.txt)', 'Download (.txt)')}
                      className="p-2 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                      title={trEn('İndir (.txt)', 'Download (.txt)')}
                    >
                      <Download className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDeleteTranscript(item)}
                      aria-label={trEn('Sil', 'Delete')}
                      className="p-2 rounded-full border border-chick-red/30 bg-chick-red/10 text-chick-red hover:bg-chick-red hover:text-black transition cursor-pointer"
                      title={trEn('Sil', 'Delete')}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

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
