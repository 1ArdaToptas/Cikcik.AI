import {
  AudioLines,
  Calendar,
  Clock,
  FileText,
  Mic,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CicikMascot } from '../components/CicikMascot'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { TranscriptResultCard } from '../components/TranscriptResultCard'
import { useLanguage } from '../context/LanguageContext'
import type { STTSegment } from '../types'

type SavedTranscript = {
  id: string
  title: string
  text: string
  createdAt: string
  duration: number
  wordCount: number
  segments?: STTSegment[]
  mediaUrl?: string
}

const STORAGE_KEY = 'cicik_transcripts_v1'

function loadSavedTranscripts(): SavedTranscript[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistSavedTranscripts(items: SavedTranscript[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // storage error
  }
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function TranscriptsPage() {
  const { locale, trEn } = useLanguage()
  const [transcripts, setTranscripts] = useState<SavedTranscript[]>(loadSavedTranscripts)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(() => transcripts[0]?.id ?? null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    title: string
    description?: string
    onConfirm: () => Promise<void> | void
  }>({
    isOpen: false,
    title: '',
    onConfirm: () => {},
  })

  // Filtered transcripts
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return transcripts
    return transcripts.filter(
      (t) => t.title.toLowerCase().includes(q) || t.text.toLowerCase().includes(q),
    )
  }, [searchQuery, transcripts])

  const selectedTranscript = useMemo(() => {
    return transcripts.find((t) => t.id === selectedId) ?? filtered[0] ?? null
  }, [transcripts, selectedId, filtered])

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const targetItem = transcripts.find((t) => t.id === id)
    setDeleteModal({
      isOpen: true,
      title: trEn('Transkripti Sil', 'Delete Transcript'),
      description: trEn(
        `"${targetItem?.title ?? 'Bu'}" transkript kaydı kalıcı olarak silinecektir. Bu işlem geri alınamaz.`,
        `The transcript titled "${targetItem?.title ?? 'this'}" will be permanently removed. This cannot be undone.`,
      ),
      onConfirm: async () => {
        const updated = transcripts.filter((t) => t.id !== id)
        setTranscripts(updated)
        persistSavedTranscripts(updated)
        if (selectedId === id) {
          setSelectedId(updated[0]?.id ?? null)
        }
      },
    })
  }

  const handleUpdateSelectedText = (updatedText: string) => {
    if (!selectedTranscript) return
    const wordCount = updatedText.split(/\s+/).filter(Boolean).length
    const updated = transcripts.map((t) =>
      t.id === selectedTranscript.id
        ? { ...t, text: updatedText, wordCount: wordCount || 1 }
        : t,
    )
    setTranscripts(updated)
    persistSavedTranscripts(updated)
  }

  const handleSaveTitle = () => {
    if (!selectedTranscript || !newTitle.trim()) return
    const updated = transcripts.map((t) =>
      t.id === selectedTranscript.id ? { ...t, title: newTitle.trim() } : t,
    )
    setTranscripts(updated)
    persistSavedTranscripts(updated)
    setIsEditingTitle(false)
  }

  return (
    <div className="space-y-6 animate-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-chick-orange font-sans">
            <FileText className="size-4" aria-hidden="true" />
            <span>{trEn('Kayıt Kitaplığı', 'Recording Library')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-main)] font-display mt-1">
            {trEn('Transkript Kitaplığı', 'Transcripts Library')}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)] font-sans">
            {trEn(
              'Konuşma kayıtlarından oluşturulan tüm yazı ve notlarını buradan incele ve yönet.',
              'Review and manage all your texts and notes created from speech recordings here.',
            )}
          </p>
        </div>

        <Link
          to="/studio"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-chick-yellow px-6 py-3 text-sm font-bold text-black shadow-sm transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Mic className="size-4" aria-hidden="true" />
          <span>{trEn('Yeni Kayıt Başlat', 'Start New Recording')}</span>
        </Link>
      </div>

      {transcripts.length === 0 ? (
        /* Empty State */
        <div className="cambly-card flex flex-col items-center justify-center p-12 sm:p-16 text-center space-y-4">
          <CicikMascot mood="empty" size="lg" />
          <h2 className="text-2xl font-bold text-[var(--text-main)] font-display">
            {trEn('Henüz Kayıtlı Bir Transkript Yok', 'No Saved Transcripts Yet')}
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-md font-sans">
            {trEn(
              'Canlı stüdyoya girip mikrofonuna konuşarak veya bir ses dosyası yükleyerek ilk transkriptini oluşturabilirsin.',
              'Go to the live studio and speak into your microphone or upload an audio file to create your first transcript.',
            )}
          </p>
          <Link
            to="/studio"
            className="inline-flex items-center gap-2 rounded-full bg-chick-yellow px-7 py-3 text-sm font-bold text-black shadow-sm hover:scale-[1.02] cursor-pointer mt-2"
          >
            <Mic className="size-4" aria-hidden="true" />
            <span>{trEn('Canlı Stüdyoya Git', 'Go to Live Studio')}</span>
          </Link>
        </div>
      ) : (
        /* Main Layout: Split list & detail */
        <div className="grid gap-6 lg:grid-cols-[minmax(320px,1fr)_minmax(0,1.8fr)]">
          {/* Left Column: Search & Transcript list */}
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]"
                aria-hidden="true"
              />
              <label htmlFor="transcript-search" className="sr-only">
                {trEn('Transkriptlerde ara', 'Search transcripts')}
              </label>
              <input
                id="transcript-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={trEn('Transkriptlerde ara...', 'Search transcripts...')}
                className="w-full rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg)] pl-10 pr-9 py-2.5 text-xs sm:text-sm text-[var(--text-main)] outline-none transition focus:border-chick-yellow"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label={trEn('Aramayı temizle', 'Clear search')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Transcripts List */}
            <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <div className="cambly-card p-6 text-center text-xs text-[var(--text-muted)]">
                  {trEn(
                    `"${searchQuery}" aramasıyla eşleşen transkript bulunamadı.`,
                    `No transcripts found matching "${searchQuery}".`,
                  )}
                </div>
              ) : (
                filtered.map((item) => {
                  const isSelected = selectedTranscript?.id === item.id
                  return (
                    <article
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`cambly-card p-4 transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'border-chick-yellow/80 bg-[var(--sidebar-bg)] ring-1 ring-chick-yellow/40'
                          : 'hover:border-chick-yellow/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-main)] line-clamp-1 font-display">
                          <AudioLines
                            className="size-3.5 shrink-0 text-chick-orange"
                            aria-hidden="true"
                          />
                          <span className="truncate">{item.title}</span>
                        </h3>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(item.id, e)}
                          aria-label={trEn('Sil', 'Delete')}
                          className="rounded-lg p-1 text-[var(--text-muted)] hover:text-chick-red hover:bg-chick-red/10 transition cursor-pointer"
                          title={trEn('Sil', 'Delete')}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      <p className="mt-1.5 text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed font-sans">
                        {item.text}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3 text-chick-orange" aria-hidden="true" />
                          {formatTime(item.duration)}
                        </span>
                        <span>
                          {item.wordCount} {trEn('kelime', 'words')}
                        </span>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Transcript Detail Reader */}
          <div>
            {selectedTranscript ? (
              <div className="space-y-4">
                {/* Header Metadata Card */}
                <div className="cambly-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {isEditingTitle ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="rounded-xl border border-chick-yellow bg-[var(--sidebar-bg)] px-3 py-1.5 text-base font-bold text-[var(--text-main)] outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitle()
                            if (e.key === 'Escape') setIsEditingTitle(false)
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleSaveTitle}
                          className="rounded-full bg-chick-yellow px-3.5 py-1.5 text-xs font-bold text-black cursor-pointer"
                        >
                          {trEn('Kaydet', 'Save')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingTitle(false)}
                          className="text-xs font-semibold text-[var(--text-muted)] cursor-pointer"
                        >
                          {trEn('İptal', 'Cancel')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] font-display truncate">
                          {selectedTranscript.title}
                        </h2>
                        <button
                          type="button"
                          onClick={() => {
                            setNewTitle(selectedTranscript.title)
                            setIsEditingTitle(true)
                          }}
                          aria-label={trEn('Başlığı Düzenle', 'Edit Title')}
                          className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition cursor-pointer"
                          title={trEn('Başlığı Düzenle', 'Edit Title')}
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    )}

                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-chick-orange" aria-hidden="true" />
                        {new Date(selectedTranscript.createdAt).toLocaleString(locale)}
                      </span>
                      <span>·</span>
                      <span>
                        {selectedTranscript.wordCount} {trEn('kelime', 'words')}
                      </span>
                      <span>·</span>
                      <span>
                        {formatTime(selectedTranscript.duration)} {trEn('kayıt', 'rec')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Readable Transcript + Timestamps + Clear + AI Important Highlights */}
                <TranscriptResultCard
                  key={selectedTranscript.id}
                  text={selectedTranscript.text}
                  language="auto"
                  segments={selectedTranscript.segments}
                  mediaUrl={selectedTranscript.mediaUrl}
                  title={selectedTranscript.title}
                  onClear={() => handleDelete(selectedTranscript.id)}
                  onUpdateText={handleUpdateSelectedText}
                />
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* In-App UX Pro Max Confirm & Loading Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        description={deleteModal.description}
        onConfirm={deleteModal.onConfirm}
        onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
