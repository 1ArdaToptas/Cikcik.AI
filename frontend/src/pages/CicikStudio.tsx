import {
  ArrowRight,
  AudioLines,
  FileAudio,
  FileText,
  Globe,
  Languages,
  LoaderCircle,
  Mic,
  Sparkles,
  Square,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { AudioWaveform } from '../components/AudioWaveform'
import { CicikMascot, type MascotMood } from '../components/CicikMascot'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { BorderBeam, Particles } from '../components/magicui'
import { Aurora, ClickSpark, ShinyText } from '../components/react-bits'
import { TranscriptResultCard } from '../components/TranscriptResultCard'
import { Tooltip } from '../components/ui/Tooltip'
import { useLanguage } from '../context/LanguageContext'
import { TRANSLATION_LANGUAGES } from '../lib/transcriptFormat'
import { transcribeFile, transcribeUrl } from '../lib/ttsApi'
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
    // storage full
  }
}

export function CicikStudio() {
  const { trEn } = useLanguage()
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0.2)
  const [activeTab, setActiveTab] = useState<'record' | 'upload' | 'url'>('record')
  const [sttLang, setSttLang] = useState<'auto' | 'tr' | 'en'>('auto')
  const [translateTarget, setTranslateTarget] = useState<string>('none')

  const [finalTranscript, setFinalTranscript] = useState<string | null>(null)
  const [finalSegments, setFinalSegments] = useState<STTSegment[]>([])
  const [finalMediaUrl, setFinalMediaUrl] = useState<string | undefined>(undefined)
  const [autoTranslatedText, setAutoTranslatedText] = useState<string | null>(null)
  const [autoTargetLang, setAutoTargetLang] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Video URL state
  const [videoUrl, setVideoUrl] = useState('')

  // Audio recording hardware refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // Transcripts list
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

  // Derived mascot mood (0 cascading renders)
  const mood: MascotMood = isRecording
    ? recordingSeconds > 45
      ? 'long'
      : 'listening'
    : isProcessing
      ? 'processing'
      : errorMsg
        ? 'error'
        : finalTranscript
          ? 'success'
          : 'idle'

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioCtxRef.current) void audioCtxRef.current.close()
    }
  }, [])

  // Start real microphone recording with AudioContext analyzer
  const startRecording = async () => {
    try {
      setErrorMsg(null)
      setFinalTranscript(null)
      setFinalSegments([])
      setFinalMediaUrl(undefined)
      audioChunksRef.current = []

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Setup audio analyzer for dynamic waveform
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 64
      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)

      audioCtxRef.current = audioCtx
      analyserRef.current = analyser

      // Level monitoring loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const updateVolume = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const avg = sum / dataArray.length
        setAudioLevel(Math.min(1, avg / 128))
        animFrameRef.current = requestAnimationFrame(updateVolume)
      }
      updateVolume()

      // Real MediaRecorder setup
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop())
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        if (audioCtxRef.current) void audioCtxRef.current.close()

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const file = new File([audioBlob], 'recording.wav', { type: 'audio/wav' })
        await processAudioFile(file, recordingSeconds)
      }

      recorder.start(250)
      setIsRecording(true)
      setRecordingSeconds(0)

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } catch {
      setErrorMsg(
        trEn(
          'Mikrofona erişilemedi. Lütfen mikrofon izinlerini kontrol edin.',
          'Could not access microphone. Please check your microphone permissions.',
        ),
      )
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (!isRecording) return
    setIsRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  // Transcribe recorded or uploaded audio file with Whisper
  const processAudioFile = async (file: File, durationSec: number = 0) => {
    setIsProcessing(true)
    setErrorMsg(null)

    try {
      const res = await transcribeFile(file, sttLang, translateTarget)
      const cleanText = res.text.trim()
      setFinalTranscript(cleanText)
      setFinalSegments(res.segments ?? [])
      setFinalMediaUrl(undefined)
      setAutoTranslatedText(res.translated_text ?? null)
      setAutoTargetLang(res.target_language ?? null)

      // Save to local storage history
      const wordCount = cleanText.split(/\s+/).filter(Boolean).length
      const titleCandidate =
        cleanText.slice(0, 32).trim() || trEn('Yeni Ses Kaydı', 'New Voice Recording')
      const newEntry: SavedTranscript = {
        id: `cicik_${Date.now()}`,
        title: `${titleCandidate}...`,
        text: cleanText,
        createdAt: new Date().toISOString(),
        duration: durationSec || (res.duration ?? 5),
        wordCount: wordCount || 1,
        segments: res.segments ?? [],
        mediaUrl: undefined,
      }
      const updated = [newEntry, ...transcripts]
      setTranscripts(updated)
      persistSavedTranscripts(updated)
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : trEn(
              'Ses yazıya çevrilirken bir hata oluştu.',
              'An error occurred while transcribing audio.',
            ),
      )
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle uploaded audio file
  const handleUploadSubmit = async () => {
    if (!uploadFile) return
    await processAudioFile(uploadFile, 0)
  }

  // Handle Video / Web URL transcription
  const handleUrlSubmit = async () => {
    const url = videoUrl.trim()
    if (!url) return
    setIsProcessing(true)
    setErrorMsg(null)

    try {
      const res = await transcribeUrl(url, sttLang, translateTarget)
      const cleanText = res.text.trim()
      setFinalTranscript(cleanText)
      setFinalSegments(res.segments ?? [])
      setFinalMediaUrl(url)
      setAutoTranslatedText(res.translated_text ?? null)
      setAutoTargetLang(res.target_language ?? null)

      const wordCount = cleanText.split(/\s+/).filter(Boolean).length
      const titleCandidate =
        cleanText.slice(0, 32).trim() || trEn('Video Çevirisi', 'Video Transcript')
      const newEntry: SavedTranscript = {
        id: `cicik_url_${Date.now()}`,
        title: `${titleCandidate}...`,
        text: cleanText,
        createdAt: new Date().toISOString(),
        duration: res.duration ?? 30,
        wordCount: wordCount || 1,
        segments: res.segments ?? [],
        mediaUrl: url,
      }
      const updated = [newEntry, ...transcripts]
      setTranscripts(updated)
      persistSavedTranscripts(updated)
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : trEn(
              'Video bağlantısı çevrilirken bir hata oluştu.',
              'An error occurred while transcribing the video URL.',
            ),
      )
    } finally {
      setIsProcessing(false)
    }
  }

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Delete transcript
  const requestDeleteTranscript = (item: SavedTranscript) => {
    setDeleteModal({
      isOpen: true,
      title: trEn('Kaydı Sil', 'Delete Recording'),
      description: trEn(
        `"${item.title}" başlıklı konuşma kaydı kalıcı olarak silinecektir.`,
        `The transcript titled "${item.title}" will be permanently deleted.`,
      ),
      onConfirm: async () => {
        const updated = transcripts.filter((t) => t.id !== item.id)
        setTranscripts(updated)
        persistSavedTranscripts(updated)
      },
    })
  }

  return (
    <div className="space-y-8 animate-enter">
      {/* 1. HERO & INTERACTIVE RECORDING CARD WITH MAGIC UI & REACT BITS */}
      <section className="cambly-card relative overflow-hidden p-6 sm:p-10 lg:p-12 transition-all shadow-xl">
        {/* Floating Particles Canvas */}
        <Particles quantity={28} ease={60} size={1} className="opacity-50" />

        {/* Laser Border Beam */}
        <BorderBeam duration={14} borderWidth={1.5} colorFrom="#FFE733" colorTo="#38BDF8" />

        {/* React Bits Aurora Ambient Flow */}
        <Aurora className="rounded-3xl" colorStops={['#FFE733', '#38BDF8', '#84CE64', '#FF8071']} />

        <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto space-y-6">
          {/* Cicik Mascot with Dynamic Mood & Speech Bubble */}
          <CicikMascot mood={mood} size="lg" showSpeechBubble={true} />

          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-main)] font-display">
              {isRecording
                ? trEn('Cicik can kulağıyla dinliyor...', 'Cicik is listening closely...')
                : isProcessing
                  ? trEn(
                      'Cicik sözcükleri yazıya döküyor...',
                      'Cicik is transcribing your words...',
                    )
                  : trEn('Konuşmaya hazır mısın?', 'Ready to speak?')}
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-[var(--text-muted)] leading-relaxed font-sans max-w-lg mx-auto">
              {trEn(
                'Mikrofonuna doğal bir şekilde konuş veya bir ses dosyası yükle. Whisper AI kelimesi kelimesine metne döksün.',
                'Speak naturally into your microphone or upload an audio file. Whisper AI transcribes it word for word.',
              )}
            </p>
          </div>

          {/* Mode Switcher Pills + Speech Language Selector */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            <div
              className="inline-flex flex-wrap items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-1 gap-1"
              role="tablist"
              aria-label={trEn('Kayıt Modu', 'Recording Mode')}
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'record'}
                onClick={() => setActiveTab('record')}
                className={`inline-flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'record'
                    ? 'bg-chick-yellow text-black font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Mic className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{trEn('Canlı Mikrofon', 'Live Microphone')}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'upload'}
                onClick={() => setActiveTab('upload')}
                className={`inline-flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-chick-yellow text-black font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <FileAudio className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{trEn('Ses Dosyası', 'Audio File')}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'url'}
                onClick={() => setActiveTab('url')}
                className={`inline-flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'url'
                    ? 'bg-chick-yellow text-black font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Globe className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{trEn('Video / Web Linki', 'Video / Web URL')}</span>
              </button>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3.5 py-2">
              <Globe className="size-3.5 text-chick-orange shrink-0" aria-hidden="true" />
              <label htmlFor="studio-stt-lang" className="sr-only">
                {trEn('Konuşma Dili', 'Speech Language')}
              </label>
              <select
                id="studio-stt-lang"
                value={sttLang}
                onChange={(e) => setSttLang(e.target.value as 'auto' | 'tr' | 'en')}
                className="bg-transparent text-xs font-bold text-[var(--text-main)] outline-none cursor-pointer border-0"
              >
                <option value="auto" className="bg-[var(--card-bg)] text-[var(--text-main)]">
                  {trEn('Dil: Otomatik (TR/EN)', 'Lang: Auto (TR/EN)')}
                </option>
                <option value="tr" className="bg-[var(--card-bg)] text-[var(--text-main)]">
                  {trEn('Dil: Türkçe', 'Lang: Turkish')}
                </option>
                <option value="en" className="bg-[var(--card-bg)] text-[var(--text-main)]">
                  {trEn('Dil: İngilizce', 'Lang: English')}
                </option>
              </select>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-3.5 py-2">
              <Languages className="size-3.5 text-chick-orange shrink-0" aria-hidden="true" />
              <label htmlFor="studio-stt-translate" className="sr-only">
                {trEn('Otomatik Çeviri Dili', 'Auto-Translate Target Language')}
              </label>
              <select
                id="studio-stt-translate"
                value={translateTarget}
                onChange={(e) => setTranslateTarget(e.target.value)}
                className="bg-transparent text-xs font-bold text-[var(--text-main)] outline-none cursor-pointer border-0"
              >
                <option value="none" className="bg-[var(--card-bg)] text-[var(--text-main)]">
                  {trEn('Çeviri: Yok (Orijinal Dil)', 'Translate: Off (Original)')}
                </option>
                {TRANSLATION_LANGUAGES.map((lang) => (
                  <option
                    key={lang.code}
                    value={lang.code}
                    className="bg-[var(--card-bg)] text-[var(--text-main)]"
                  >
                    {trEn(`Çevir: ${lang.tr}`, `Translate: ${lang.en}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TAB 1: Real-time Microphone Recording Experience */}
          {activeTab === 'record' && (
            <div className="w-full flex flex-col items-center space-y-6">
              {/* Real-time Dynamic Waveform */}
              <div className="w-full py-2 flex flex-col items-center">
                <AudioWaveform
                  isRecording={isRecording}
                  audioLevel={audioLevel}
                  barCount={32}
                  colorTheme="gradient"
                />

                {isRecording && (
                  <div className="flex items-center gap-2 mt-3 rounded-full border border-chick-orange/40 bg-chick-orange/15 px-4 py-1.5 font-mono text-sm font-bold text-chick-orange shadow-xs">
                    <span className="size-2.5 rounded-full bg-chick-orange animate-ping" />
                    <ShinyText
                      text={`${trEn('Canlı Kayıt', 'Live Recording')} · ${formatTime(recordingSeconds)}`}
                      speed={3}
                      shimmerColor="#ffffff"
                    />
                  </div>
                )}
              </div>

              {/* Main CTA: Cambly Pill Record Button with React Bits ClickSpark */}
              {!isRecording ? (
                <ClickSpark sparkColor="#FFE733" sparkCount={10}>
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={isProcessing}
                    className="group relative inline-flex items-center gap-3 rounded-full bg-chick-yellow px-8 py-3.5 text-base font-bold text-black shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer animate-cambly-pulse"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-black/10">
                      <Mic className="size-4 text-black group-hover:scale-110 transition-transform" aria-hidden="true" />
                    </span>
                    <span>{trEn('Konuşmaya Başla', 'Start Speaking')}</span>
                  </button>
                </ClickSpark>
              ) : (
                <ClickSpark sparkColor="#FF8071" sparkCount={12}>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="group relative inline-flex items-center gap-3 rounded-full bg-chick-red px-8 py-3.5 text-base font-bold text-black shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer animate-pulse"
                  >
                    <Square className="size-4 fill-current" aria-hidden="true" />
                    <span>{trEn('Kaydı Bitir & Yazıya Dök', 'Stop & Transcribe')}</span>
                  </button>
                </ClickSpark>
              )}
            </div>
          )}

          {/* TAB 2: File Upload Experience */}
          {activeTab === 'upload' && (
            <div className="w-full max-w-md flex flex-col items-center space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--sidebar-bg)] cursor-pointer hover:border-chick-yellow transition-colors p-4">
                <UploadCloud className="size-9 text-chick-orange mb-2" aria-hidden="true" />
                <span className="text-xs font-semibold text-[var(--text-main)]">
                  {uploadFile
                    ? uploadFile.name
                    : trEn(
                        'MP3, WAV, M4A dosyanı buraya bırak',
                        'Drop your MP3, WAV, M4A file here',
                      )}
                </span>
                <span className="text-[11px] text-[var(--text-muted)] mt-1 font-mono">
                  {trEn('Maksimum 50MB', 'Maximum 50MB')}
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
              </label>

              {uploadFile && (
                <button
                  type="button"
                  onClick={handleUploadSubmit}
                  disabled={isProcessing}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-chick-yellow py-3 text-sm font-bold text-black shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Sparkles className="size-4" aria-hidden="true" />
                  <span>{trEn("Dosyayı Cicik'e Gönder", 'Send File to Cicik')}</span>
                </button>
              )}
            </div>
          )}

          {/* TAB 3: Video / Web Link Transcription Experience */}
          {activeTab === 'url' && (
            <div className="w-full max-w-lg flex flex-col items-center space-y-4">
              <div className="w-full text-left">
                <label htmlFor="video-url" className="text-xs font-bold text-[var(--text-main)]">
                  {trEn('YouTube veya Video / Ses Bağlantısı', 'YouTube or Video / Audio URL')}
                </label>
                <div className="relative mt-2">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--text-muted)]" aria-hidden="true" />
                  <input
                    id="video-url"
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder={trEn(
                      "https://www.youtube.com/watch?v=... veya direkt ses URL'si",
                      'https://www.youtube.com/watch?v=... or direct audio URL',
                    )}
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--card-bg)] pl-10 pr-4 py-3 text-xs sm:text-sm text-[var(--text-main)] outline-none transition focus:border-chick-yellow focus:ring-1 focus:ring-chick-yellow"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleUrlSubmit}
                disabled={isProcessing || !videoUrl.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-chick-yellow py-3 text-sm font-bold text-black shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    <span>
                      {trEn(
                        'Videodan Ses İndiriliyor & Yazıya Dökülüyor…',
                        'Downloading Audio from Video & Transcribing…',
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" aria-hidden="true" />
                    <span>{trEn('Videodaki Sesi Metne Çevir', 'Transcribe Video Audio')}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error Message with Mascot Reaction */}
          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-chick-red/30 bg-chick-red/10 p-4 text-xs font-semibold text-chick-red animate-enter"
            >
              {errorMsg}
            </div>
          )}
        </div>
      </section>

      {/* 2. TRANSCRIPTION OUTPUT SCREEN (Timestamps + Readable Paragraphs + Translate + Clear + AI Important Highlights) */}
      {finalTranscript && (
        <TranscriptResultCard
          text={finalTranscript}
          language={sttLang}
          segments={finalSegments}
          mediaUrl={finalMediaUrl}
          initialTranslatedText={autoTranslatedText}
          initialTargetLanguage={autoTargetLang}
          onClear={() => {
            setFinalTranscript(null)
            setFinalSegments([])
            setFinalMediaUrl(undefined)
            setAutoTranslatedText(null)
          }}
          onUpdateText={(newText) => setFinalTranscript(newText)}
        />
      )}

      {/* 3. TRANSCRIPT HISTORY */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-chick-orange" aria-hidden="true" />
            <h2 className="text-xl font-bold text-[var(--text-main)] font-display">
              {trEn('Kayıt Geçmişi', 'Recording History')}
            </h2>
            <span className="rounded-full bg-chick-yellow px-2.5 py-0.5 text-xs font-bold text-black font-sans">
              {transcripts.length}
            </span>
          </div>
          {transcripts.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setDeleteModal({
                  isOpen: true,
                  title: trEn('Tüm Kayıt Geçmişini Sil', 'Clear All Recording History'),
                  description: trEn(
                    'Kaydedilen tüm mikrofon ve video konuşma transkriptleri kalıcı olarak silinecektir.',
                    'All saved microphone and video speech transcripts will be permanently removed.',
                  ),
                  itemCount: transcripts.length,
                  onConfirm: async () => {
                    setTranscripts([])
                    persistSavedTranscripts([])
                  },
                })
              }}
              className="text-xs font-semibold text-[var(--text-muted)] hover:text-chick-red transition cursor-pointer"
            >
              {trEn('Geçmişi Temizle', 'Clear History')}
            </button>
          )}
        </div>

        {transcripts.length === 0 ? (
          /* Empty State with Mascot holding mic */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-10 text-center space-y-3">
            <CicikMascot mood="empty" size="md" />
            <h3 className="text-base font-bold text-[var(--text-main)] font-display">
              {trEn('Henüz bir transkript yok.', 'No transcripts yet.')}
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm font-sans">
              {trEn(
                'İlk kaydını oluştur ve Cicik kelimeleri anında yazıya döksün.',
                'Create your first recording and let Cicik transcribe it right away.',
              )}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {transcripts.map((item) => (
              <article
                key={item.id}
                className="cambly-card-interactive group relative flex flex-col justify-between p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="flex items-center gap-1.5 text-sm font-bold text-[var(--text-main)] line-clamp-1 font-display">
                      <AudioLines className="size-3.5 shrink-0 text-chick-orange" aria-hidden="true" />
                      <span className="truncate">{item.title}</span>
                    </h3>
                    <Tooltip content={trEn('Kaydı sil', 'Delete recording')}>
                      <button
                        type="button"
                        onClick={() => requestDeleteTranscript(item)}
                        aria-label={trEn('Kaydı sil', 'Delete recording')}
                        className="opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 rounded-lg p-1 text-[var(--text-muted)] hover:text-chick-red hover:bg-chick-red/10 transition cursor-pointer"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </Tooltip>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed font-sans">
                    {item.text}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                  <span>{formatTime(item.duration)}</span>
                  <span>
                    {item.wordCount} {trEn('kelime', 'words')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFinalTranscript(item.text)
                      setFinalSegments(item.segments ?? [])
                      setFinalMediaUrl(item.mediaUrl)
                      window.scrollTo({ top: 380, behavior: 'smooth' })
                    }}
                    className="inline-flex items-center gap-1 font-sans font-bold text-chick-orange hover:underline cursor-pointer"
                  >
                    <span>{trEn('Görüntüle', 'View')}</span>
                    <ArrowRight className="size-3" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

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
