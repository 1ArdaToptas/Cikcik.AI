import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { LoaderCircle, Mic, Play, Square, UploadCloud, Volume2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useLanguage } from '../context/LanguageContext'
import { createCustomVoice } from '../lib/ttsApi'

type CustomVoiceModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newVoiceId: string) => void
}

export function CustomVoiceModal({ isOpen, onClose, onSuccess }: CustomVoiceModalProps) {
  const { trEn } = useLanguage()
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload')
  const [name, setName] = useState('')
  const [description, setDescription] = useState(() =>
    trEn('Ders notları & akıcı okuma', 'Study notes & fluent reading'),
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const resetForm = () => {
    setName('')
    setDescription(trEn('Ders notları & akıcı okuma', 'Study notes & fluent reading'))
    setSelectedFile(null)
    setRecordedBlob(null)
    setError(null)
    setIsLoading(false)
    setIsRecording(false)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setRecordedBlob(null)
    setError(null)

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setRecordedBlob(audioBlob)
        setSelectedFile(null)

        if (previewUrl) URL.revokeObjectURL(previewUrl)
        const url = URL.createObjectURL(audioBlob)
        setPreviewUrl(url)
      }

      mediaRecorder.start(200)
      setIsRecording(true)
      setRecordingSeconds(0)

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch {
      setError(
        trEn(
          'Mikrofona erişilemedi. Lütfen tarayıcı izinlerini kontrol edin.',
          'Could not access microphone. Please check browser permissions.',
        ),
      )
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError(trEn('Lütfen ses için bir isim girin.', 'Please enter a name for the voice.'))
      return
    }

    let targetAudio: File | Blob | null = null
    if (activeTab === 'upload') {
      if (!selectedFile) {
        setError(trEn('Lütfen bir ses dosyası seçin.', 'Please choose an audio file.'))
        return
      }
      targetAudio = selectedFile
    } else {
      if (!recordedBlob) {
        setError(trEn('Lütfen mikrofonla bir kayıt yapın.', 'Please record with the microphone.'))
        return
      }
      targetAudio = recordedBlob
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await createCustomVoice(
        targetAudio,
        name.trim(),
        description.trim() || trEn('Özel Klonlanmış Ses', 'Custom Cloned Voice'),
      )

      resetForm()
      onSuccess(result.id)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : trEn('Ses kaydedilirken bir hata oluştu.', 'An error occurred while saving the voice.'),
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) handleClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs animate-enter" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Content
            className="cambly-card relative w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 text-[var(--text-main)] shadow-2xl transition-colors outline-none animate-enter"
            onPointerDownOutside={(e) => {
              if (isLoading) e.preventDefault()
            }}
            onEscapeKeyDown={(e) => {
              if (isLoading) e.preventDefault()
            }}
          >
            <Dialog.Close asChild>
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                aria-label={trEn('Kapat', 'Close')}
                className="absolute right-5 top-5 grid size-9 place-items-center rounded-full text-[var(--text-muted)] transition hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--text-main)] cursor-pointer disabled:opacity-40"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </Dialog.Close>

            <div className="mb-5 flex items-start gap-4 pr-8">
              <div className="relative shrink-0">
                <img
                  src="/logo.jpg"
                  alt={trEn('Cicik Özel Ses Klonlama Maskotu', 'Cicik Custom Voice Cloning Mascot')}
                  width={48}
                  height={48}
                  loading="lazy"
                  decoding="async"
                  className="size-12 rounded-2xl object-cover ring-2 ring-purple-400/40 shadow-md animate-chirp"
                />
                <span className="absolute -bottom-1 -right-1 flex size-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-3.5 bg-purple-500 ring-2 ring-[var(--card-bg)]" />
                </span>
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 dark:text-purple-300 font-sans">
                  <Volume2 className="size-3" aria-hidden="true" />
                  {trEn('XTTS v2 Sıfır Hata Ses Klonlama', 'XTTS v2 Zero-Defect Voice Cloning')}
                </div>
                <Dialog.Title className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-main)] font-display">
                  {trEn('Kendi Sesini 1-e-1 Klonla', 'Clone Your Own Voice 1-to-1')}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed font-sans">
                  {trEn(
                    '10-30 saniyelik temiz bir ses kaydı yükleyin veya mikrofona konuşun. Yapay zekâ tınınızı ve konuşma renginizi öğrenerek metinleri sizin sesinizle okusun.',
                    'Upload a clean 10-30 second audio clip or speak into your microphone. AI learns your timbre and tone to read any text in your voice.',
                  )}
                </Dialog.Description>
              </div>
            </div>

            {/* Radix Tabs Component */}
            <Tabs.Root
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as 'upload' | 'record')}
              className="w-full"
            >
              <Tabs.List className="mb-4 grid grid-cols-2 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-1">
                <Tabs.Trigger
                  value="upload"
                  className="flex items-center justify-center gap-2 rounded-full py-2 text-xs font-bold transition cursor-pointer data-[state=active]:bg-chick-yellow data-[state=active]:text-black data-[state=active]:shadow-xs data-[state=inactive]:text-[var(--text-muted)] data-[state=inactive]:hover:text-[var(--text-main)]"
                >
                  <UploadCloud className="size-4" aria-hidden="true" />
                  {trEn('Dosya Yükle', 'Upload File')}
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="record"
                  className="flex items-center justify-center gap-2 rounded-full py-2 text-xs font-bold transition cursor-pointer data-[state=active]:bg-chick-yellow data-[state=active]:text-black data-[state=active]:shadow-xs data-[state=inactive]:text-[var(--text-muted)] data-[state=inactive]:hover:text-[var(--text-main)]"
                >
                  <Mic className="size-4" aria-hidden="true" />
                  {trEn('Mikrofonla Kaydet', 'Record Microphone')}
                </Tabs.Trigger>
              </Tabs.List>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label
                    htmlFor="voice-clone-name"
                    className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-sans"
                  >
                    {trEn('Ses Karakteri Adı', 'Voice Character Name')}
                  </label>
                  <input
                    id="voice-clone-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={trEn('Örn: Arda - Ders Notları', 'e.g., Alex - Study Notes')}
                    required
                    maxLength={40}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--text-main)] outline-none transition focus:border-chick-yellow"
                  />
                </div>

                <div>
                  <label
                    htmlFor="voice-clone-desc"
                    className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-sans"
                  >
                    {trEn('Açıklama / Stil (İsteğe Bağlı)', 'Description / Style (Optional)')}
                  </label>
                  <input
                    id="voice-clone-desc"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={trEn(
                      'Örn: Ders çalışma, özet anlatımı için sakin ton',
                      'e.g., Calm tone for study notes and summaries',
                    )}
                    maxLength={80}
                    className="mt-1.5 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3.5 py-2.5 text-sm font-medium text-[var(--text-main)] outline-none transition focus:border-chick-yellow"
                  />
                </div>

                <Tabs.Content value="upload" className="outline-none">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-sans">
                    {trEn('Ses Örneği (MP3 / WAV)', 'Voice Sample (MP3 / WAV)')}
                  </span>
                  <label className="mt-1.5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-5 text-center transition hover:border-chick-yellow cursor-pointer">
                    <UploadCloud className="size-8 text-chick-orange mb-2" aria-hidden="true" />
                    <span className="text-xs font-bold text-[var(--text-main)] underline decoration-chick-yellow decoration-2 underline-offset-2">
                      {trEn('Dosya seçin', 'Choose a file')}
                    </span>
                    <input
                      type="file"
                      accept="audio/wav,audio/mp3,audio/mpeg,audio/m4a,audio/ogg,audio/flac"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                      {trEn(
                        'veya sürükleyip bırakın (10-30 sn idealdir)',
                        'or drag and drop (10-30s is ideal)',
                      )}
                    </p>
                    {selectedFile && (
                      <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {trEn('Seçildi:', 'Selected:')} {selectedFile.name} (
                        {(selectedFile.size / 1024).toFixed(0)} KB)
                      </p>
                    )}
                  </label>
                </Tabs.Content>

                <Tabs.Content value="record" className="outline-none">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-sans">
                    {trEn('Mikrofon Kaydı', 'Microphone Recording')}
                  </span>
                  <div className="mt-1.5 flex flex-col items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-5 text-center">
                    {isRecording ? (
                      <div className="flex flex-col items-center gap-3">
                        <span className="relative flex size-12 items-center justify-center rounded-full bg-chick-red/20 text-chick-red">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-chick-red opacity-75" />
                          <Square className="size-5 fill-current" aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-chick-red font-mono">
                            {trEn('Kaydediliyor...', 'Recording...')} 00:
                            {recordingSeconds.toString().padStart(2, '0')}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {trEn(
                              'Lütfen 10-15 saniye normal hızda net bir cümle okuyun.',
                              'Please read a clear sentence at a natural pace for 10-15 seconds.',
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="rounded-full bg-chick-red px-5 py-2 text-xs font-bold text-black shadow-sm transition hover:opacity-90 cursor-pointer"
                        >
                          {trEn('Kaydı Bitir', 'Stop Recording')}
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <button
                          type="button"
                          onClick={startRecording}
                          aria-label={trEn('Kayda Başla', 'Start Recording')}
                          className="flex size-12 items-center justify-center rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 transition hover:bg-purple-500 hover:text-white cursor-pointer"
                        >
                          <Mic className="size-5" aria-hidden="true" />
                        </button>
                        <div>
                          <p className="text-xs font-bold text-[var(--text-main)]">
                            {recordedBlob
                              ? trEn('Kayıt Tamamlandı!', 'Recording Completed!')
                              : trEn('Kayda Başlamak İçin Tıklayın', 'Click to Start Recording')}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--text-muted)] max-w-sm">
                            {trEn(
                              'Örnek metin: "Bugün çalıştığım ders notlarını ve önemli maddeleri sesli olarak dinlemek istiyorum."',
                              'Sample text: "I would like to listen to my study notes and key takeaways spoken aloud in my own voice."',
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Tabs.Content>

                {previewUrl && (
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-3">
                    <Play
                      className="size-4 text-purple-600 dark:text-purple-400 shrink-0 fill-current"
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <audio ref={previewAudioRef} src={previewUrl} controls className="h-8 w-full" />
                    </div>
                  </div>
                )}

                {error && (
                  <p
                    role="alert"
                    className="text-xs text-chick-red bg-chick-red/10 border border-chick-red/30 rounded-xl p-3 font-semibold"
                  >
                    {error}
                  </p>
                )}

                <div className="mt-5 flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-5 py-2.5 text-xs font-bold text-[var(--text-muted)] transition hover:text-[var(--text-main)] disabled:opacity-50 cursor-pointer"
                  >
                    {trEn('Vazgeç', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || (!selectedFile && !recordedBlob)}
                    className="flex items-center gap-2 rounded-full bg-chick-yellow px-6 py-2.5 text-xs font-bold text-black shadow-sm transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 cursor-pointer animate-cambly-pulse"
                  >
                    {isLoading ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin text-black" aria-hidden="true" />
                        {trEn('Ses Analiz Ediliyor...', 'Analyzing Voice...')}
                      </>
                    ) : (
                      trEn('Sesi Klonla ve Kaydet', 'Clone & Save Voice')
                    )}
                  </button>
                </div>
              </form>
            </Tabs.Root>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
