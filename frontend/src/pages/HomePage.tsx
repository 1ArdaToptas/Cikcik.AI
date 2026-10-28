import {
  ArrowRight,
  AudioLines,
  BookOpen,
  CheckCircle2,
  Cpu,
  FileText,
  Headphones,
  Mic,
  Play,
  Radio,
  Sparkles,
  Users,
  Volume2,
  Wand2,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { CicikMascot } from '../components/CicikMascot'
import {
  AnimatedGradientText,
  BentoCard,
  BentoGrid,
  BorderBeam,
  Marquee,
  Meteors,
  Particles,
  ShimmerButton,
} from '../components/magicui'
import { BlurText, ClickSpark } from '../components/react-bits'
import { useLanguage } from '../context/LanguageContext'
import { useStudio } from '../context/StudioContext'
import { formatClock, formatRelativeTime } from '../lib/format'

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

export function HomePage() {
  const { generations, playGeneration, voiceById } = useStudio()
  const { locale, trEn } = useLanguage()
  const savedTranscripts = loadSavedTranscripts()

  const recentTranscripts = savedTranscripts.slice(0, 3)
  const recentGenerations = generations.slice(0, 3)

  const marqueePills = [
    { icon: '🎙️', tr: 'Whisper Large v3 Sıfır Gecikme', en: 'Whisper Large v3 Zero Latency' },
    { icon: '⚡', tr: '100.000 Harf Kesintisiz TTS', en: '100,000 Chars Seamless TTS' },
    { icon: '🧬', tr: 'XTTS v2 1-e-1 Ses Klonlama', en: 'XTTS v2 1-to-1 Voice Cloning' },
    { icon: '🇹🇷', tr: 'Doğal Türkçe Nöral Model', en: 'Natural Turkish Neural Model' },
    { icon: '🇬🇧', tr: 'Native English Fluent Studio', en: 'Native English Fluent Studio' },
    { icon: '🎨', tr: 'Renkli Konuşmacı Ayrımı', en: 'Colored Speaker Diarization' },
    { icon: '⏱️', tr: '3 Dakikalık Akıllı Bölümleme', en: '3-Minute Smart Chapters' },
    { icon: '📄', tr: 'SRT, JSON & TXT Dışa Aktarma', en: 'SRT, JSON & TXT Export' },
    { icon: '🔒', tr: '%100 Yerel Güvenli Mimari', en: '100% Local Secure Architecture' },
  ]

  return (
    <div className="space-y-12 animate-enter">
      {/* 1. MAGIC UI HERO SECTION (Particles, Meteors, BorderBeam, AnimatedGradientText, ShimmerButton) */}
      <section className="cambly-card relative overflow-hidden p-6 sm:p-10 lg:p-14 shadow-2xl transition-colors">
        {/* Floating Particles Canvas */}
        <Particles quantity={40} ease={60} size={1} className="opacity-60" />

        {/* Soft Background Meteors */}
        <Meteors number={12} className="opacity-40" />

        {/* Laser Border Beam on the Hero Container */}
        <BorderBeam duration={12} borderWidth={1.5} colorFrom="#FFE733" colorTo="#FF8071" />

        <div className="relative z-10 flex flex-col-reverse items-center justify-between gap-10 lg:flex-row">
          <div className="max-w-2xl text-center lg:text-left">
            {/* Live Model Badge with AnimatedGradientText */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-4 py-1.5 text-xs font-bold shadow-xs backdrop-blur-xs mb-5">
              <Sparkles className="size-3.5 text-chick-orange" aria-hidden="true" />
              <AnimatedGradientText>
                {trEn(
                  'Yeni Nesil AI Nöral Ses & Transkripsiyon Stüdyosu',
                  'Next-Gen AI Neural Voice & Transcription Studio',
                )}
              </AnimatedGradientText>
            </div>

            {/* Main Title with BlurText */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text-main)] font-display leading-[1.12]">
              <BlurText
                text={trEn(
                  'Sen konuş, Cicik yazsın. Metinlerin canlansın.',
                  'You speak, Cicik writes. Bring your texts to life.',
                )}
                delay={60}
                animateBy="words"
                direction="top"
              />
            </h1>

            {/* Description with High Contrast */}
            <p className="mt-5 text-base sm:text-lg text-[var(--text-muted)] leading-relaxed font-sans max-w-xl mx-auto lg:mx-0">
              {trEn(
                'Sıfır gecikmeli Whisper AI ile gerçek zamanlı konuşma transkripsiyonu, 100.000 karaktere kadar kesintisiz nöral seslendirme ve 1-e-1 ses klonlama stüdyosu tek bir çatı altında.',
                'Zero-latency Whisper AI real-time speech transcription, seamless neural text-to-speech up to 100,000 characters, and 1-to-1 voice cloning studio all under one roof.',
              )}
            </p>

            {/* Hero CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <Link to="/studio">
                <ShimmerButton
                  shimmerColor="#FFE733"
                  shimmerDuration="2.5s"
                  background="#FFE733"
                  className="text-black font-bold text-sm sm:text-base px-8 py-3.5 shadow-md animate-cambly-pulse"
                >
                  <Mic className="size-4.5 text-black" aria-hidden="true" />
                  <span className="text-black">{trEn('Canlı Stüdyoda Konuş', 'Speak in Live Studio')}</span>
                  <ArrowRight className="size-4 text-black ml-0.5" aria-hidden="true" />
                </ShimmerButton>
              </Link>

              <ClickSpark sparkColor="#FFE733" sparkCount={10}>
                <Link
                  to="/speech"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-7 py-3.5 text-sm sm:text-base font-bold text-[var(--text-main)] hover:border-chick-yellow hover:text-[var(--text-main)] transition-all cursor-pointer shadow-xs"
                >
                  <Volume2 className="size-4.5 text-chick-orange" aria-hidden="true" />
                  <span>{trEn('Metni Seslendir (TTS)', 'Text to Speech (TTS)')}</span>
                </Link>
              </ClickSpark>
            </div>
          </div>

          {/* Interactive Mascot Visual */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="relative">
              <CicikMascot
                mood="idle"
                size="xl"
                showSpeechBubble={true}
                customSpeech={trEn(
                  'Cik cik! Konuşmaya hazır mısın?',
                  'Chirp chirp! Ready to speak?',
                )}
              />
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] px-4 py-1.5 text-xs font-bold text-[var(--text-main)] font-mono shadow-xs">
              <Radio className="size-3 text-emerald-500 animate-pulse" aria-hidden="true" />
              <span>{trEn('Whisper Large v3 Canlı', 'Whisper Large v3 Live')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAGIC UI CONTINUOUS MARQUEE TICKER */}
      <section className="relative overflow-hidden py-1">
        <Marquee pauseOnHover className="[--duration:32s]">
          {marqueePills.map((pill, idx) => (
            <div
              key={idx}
              className="mx-2 flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg)] px-4 py-2 text-xs font-bold text-[var(--text-main)] shadow-xs transition hover:border-chick-yellow"
            >
              <span>{pill.icon}</span>
              <span>{trEn(pill.tr, pill.en)}</span>
            </div>
          ))}
        </Marquee>
        {/* Soft edge fade masks matching background */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--bg-main)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--bg-main)] to-transparent" />
      </section>

      {/* 3. MAGIC UI BENTO GRID FEATURE SHOWCASE */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-chick-yellow/40 bg-chick-yellow/15 px-3 py-1 text-xs font-bold text-[var(--text-main)] mb-2">
              <Zap className="size-3.5 text-chick-orange" />
              <span>{trEn('Yapay Zekâ Yetenekleri', 'AI Capabilities')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)] font-display">
              {trEn('Cicik İle Neler Yapabilirsin?', 'What Can You Do With Cicik?')}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)] font-sans">
              {trEn(
                'Akademik ders notlarından YouTube videolarına, sesli kitaplardan toplantı kayıtlarına tek tıkla çözüm.',
                'One-click solution for study notes, YouTube videos, audiobooks, and meeting minutes.',
              )}
            </p>
          </div>
          <Link
            to="/studio"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-chick-orange hover:underline shrink-0"
          >
            <span>{trEn('Tüm Stüdyoyu Keşfet', 'Explore Full Studio')}</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <BentoGrid>
          {/* Card 1: 100k Character TTS (Span 2 cols on desktop) */}
          <BentoCard
            name={trEn('100.000 Karakter Nöral TTS', '100,000 Chars Neural TTS')}
            className="md:col-span-2 relative"
            badge={trEn('Tek Tıkla Roman & Makale', 'Single-Click Long Read')}
            Icon={BookOpen}
            description={trEn(
              'Paralel parça sentezleme motoru sayesinde yüzlerce sayfalık PDF, makale veya ders notunu tek seferde akıcı ve doğal seslendirir. Tekleme veya takılma yaşanmaz.',
              'Parallel chunk synthesis engine smoothly narrates hundreds of pages of PDFs, articles, or study notes in one go without stuttering.',
            )}
            href="/speech"
            cta={trEn('Metin Seslendirmeye Başla', 'Start Text-to-Speech')}
            background={
              <div className="absolute right-0 top-0 size-full overflow-hidden opacity-30">
                <div className="absolute -right-10 -top-10 size-64 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 blur-3xl" />
              </div>
            }
          />

          {/* Card 2: Live Whisper STT */}
          <BentoCard
            name={trEn('Canlı Konuşma & STT', 'Live Speech & STT')}
            badge={trEn('Sıfır Gecikme', 'Zero Latency')}
            Icon={Mic}
            description={trEn(
              'Mikrofona konuşurken Whisper Large v3 sesi anında yakalar, kelime kelime ve noktalama işaretleriyle ekrana döker.',
              'As you speak, Whisper Large v3 instantly captures audio, transcribing word-by-word with punctuation.',
            )}
            href="/studio"
            cta={trEn('Canlı Stüdyoyu Aç', 'Open Live Studio')}
            background={
              <div className="absolute right-0 top-0 size-full overflow-hidden opacity-25">
                <div className="absolute -right-10 -top-10 size-48 rounded-full bg-sky-400 blur-3xl" />
              </div>
            }
          />

          {/* Card 3: 1-to-1 Voice Cloning */}
          <BentoCard
            name={trEn('1-e-1 Özel Ses Klonlama', '1-to-1 Voice Cloning')}
            badge={trEn('XTTS v2 Sıfır Hata', 'XTTS v2 Zero Defect')}
            Icon={Wand2}
            description={trEn(
              '10-30 saniyelik temiz bir ses kaydı yükle veya mikrofona konuş; yapay zekâ senin tını ve tonlamanla konuşsun.',
              'Upload a 10-30 second clean voice sample or speak into your mic; let AI speak in your exact timbre and tone.',
            )}
            href="/speech"
            cta={trEn('Kendi Sesini Klonla', 'Clone Your Voice')}
            background={
              <div className="absolute right-0 top-0 size-full overflow-hidden opacity-25">
                <div className="absolute -right-10 -top-10 size-48 rounded-full bg-purple-500 blur-3xl" />
              </div>
            }
          />

          {/* Card 4: Speaker Diarization & 3-Min Chapters (Span 2 cols on desktop) */}
          <BentoCard
            name={trEn('Renkli Konuşmacı Ayrımı & 3 Dk Bölümler', 'Colored Speakers & 3-Min Chapters')}
            className="md:col-span-2 relative"
            badge={trEn('Akıllı Toplantı & Panel', 'Smart Meeting & Panel')}
            Icon={Users}
            description={trEn(
              "2'li diyaloglar, 3'lü paneller ve kalabalık konuşmalarda her konuşmacıya özel pastel renk atanır. 3 dakikalık zaman damgalı bölümlere ayrılarak okumayı kolaylaştırır.",
              'Assigns dedicated pastel colors to speakers in 2-way dialogues, 3-way panels, and group meetings. Automatically splits into 3-minute timestamped chapters.',
            )}
            href="/studio"
            cta={trEn('Transkriptleri İncele', 'View Transcripts')}
            background={
              <div className="absolute right-0 top-0 size-full overflow-hidden opacity-30">
                <div className="absolute -right-10 -top-10 size-64 rounded-full bg-gradient-to-br from-emerald-400 to-sky-400 blur-3xl" />
              </div>
            }
          />
        </BentoGrid>
      </section>

      {/* 4. PERFORMANCE STATS & METRICS (High Contrast in all themes) */}
      <section className="cambly-card p-6 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-subtle)]">
          <div className="flex flex-col items-center text-center px-4">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[var(--text-main)]">
              {trEn('%99.8', '99.8%')}
            </span>
            <span className="mt-1 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider font-sans">
              {trEn('Whisper Tanıma Doğruluğu', 'Whisper Recognition Accuracy')}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] mt-1">
              {trEn('Türkçe & İngilizce nöral model', 'Turkish & English neural model')}
            </span>
          </div>

          <div className="flex flex-col items-center text-center px-4 pt-4 sm:pt-0">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[var(--text-main)]">
              {trEn('100.000', '100,000')}
            </span>
            <span className="mt-1 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider font-sans">
              {trEn('Maksimum Harf Kapasitesi', 'Max Character Capacity')}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] mt-1">
              {trEn('Paralel parça sentezleme', 'Parallel chunk synthesis')}
            </span>
          </div>

          <div className="flex flex-col items-center text-center px-4 pt-4 sm:pt-0">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[var(--text-main)]">
              0 ms
            </span>
            <span className="mt-1 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider font-sans">
              {trEn('Bulut Gizlilik Riski', 'Cloud Privacy Risk')}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] mt-1">
              {trEn('Yerel ve güvenli mimari', 'Local & secure architecture')}
            </span>
          </div>

          <div className="flex flex-col items-center text-center px-4 pt-4 sm:pt-0">
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-[var(--text-main)]">
              {trEn('1-e-1', '1-to-1')}
            </span>
            <span className="mt-1 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider font-sans">
              {trEn('Doğal Ses Tonu Klonu', 'Natural Voice Tone Clone')}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] mt-1">
              {trEn('XTTS v2 mimarisi', 'XTTS v2 architecture')}
            </span>
          </div>
        </div>
      </section>

      {/* 5. RECENT ACTIVITY PREVIEW */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transcripts */}
        <div className="cambly-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <FileText className="size-4.5 text-chick-orange" aria-hidden="true" />
                <h3 className="text-lg font-bold text-[var(--text-main)] font-display">
                  {trEn('Son Transkriptlerin', 'Recent Transcripts')}
                </h3>
              </div>
              <Link
                to="/transcripts"
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:underline"
              >
                <span>
                  {trEn('Tümünü Gör', 'View All')} ({savedTranscripts.length})
                </span>
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>

            {recentTranscripts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                {trEn(
                  'Henüz kayıtlı bir transkript yok. Canlı stüdyoda ilk kaydını alabilirsin.',
                  'No saved transcripts yet. Record your first clip in the live studio.',
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {recentTranscripts.map((t) => (
                  <Link
                    key={t.id}
                    to="/transcripts"
                    className="block rounded-xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-3.5 transition hover:border-chick-yellow"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--text-main)]">
                      <span className="flex items-center gap-1.5 line-clamp-1 font-display">
                        <AudioLines className="size-3.5 shrink-0 text-chick-orange" aria-hidden="true" />
                        <span className="truncate">{t.title}</span>
                      </span>
                      <span className="font-mono text-[11px] text-[var(--text-muted)] shrink-0">
                        {t.wordCount} {trEn('kelime', 'words')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                      {t.text}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-[var(--border-subtle)]">
            <Link
              to="/studio"
              className="inline-flex items-center justify-center gap-2 w-full rounded-full bg-chick-yellow py-2.5 text-xs font-bold text-black shadow-xs transition hover:scale-[1.01]"
            >
              <Mic className="size-3.5" aria-hidden="true" />
              <span>{trEn('Yeni Konuşma Kaydet', 'Record New Speech')}</span>
            </Link>
          </div>
        </div>

        {/* Recent Audio Generations */}
        <div className="cambly-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Headphones className="size-4.5 text-chick-orange" aria-hidden="true" />
                <h3 className="text-lg font-bold text-[var(--text-main)] font-display">
                  {trEn('Son Ses Üretimlerin', 'Recent Audio Generations')}
                </h3>
              </div>
              <Link
                to="/history"
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:underline"
              >
                <span>
                  {trEn('Tümünü Gör', 'View All')} ({generations.length})
                </span>
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>

            {recentGenerations.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                {trEn(
                  'Henüz üretilmiş bir ses kaydı yok. Metinden sese stüdyosunda ilk sesini üretebilirsin.',
                  'No generated audio yet. Create your first voice clip in the Text-to-Speech studio.',
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {recentGenerations.map((g) => {
                  const voice = voiceById(g.voiceId)
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => void playGeneration(g)}
                      className="w-full text-left rounded-xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-3.5 transition hover:border-chick-yellow cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs font-bold text-[var(--text-main)]">
                        <span className="flex items-center gap-1.5 line-clamp-1">
                          <Play className="size-3 shrink-0 fill-current text-chick-orange" aria-hidden="true" />
                          <span className="truncate">{voice?.name ?? g.voiceId}</span>
                        </span>
                        <span className="font-mono text-[11px] text-[var(--text-muted)] shrink-0">
                          {formatClock(g.duration)} · {formatRelativeTime(g.createdAt, locale)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        {g.text}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-[var(--border-subtle)]">
            <Link
              to="/speech"
              className="inline-flex items-center justify-center gap-2 w-full rounded-full border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] py-2.5 text-xs font-bold text-[var(--text-main)] transition hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Volume2 className="size-3.5" aria-hidden="true" />
              <span>{trEn('Metin Seslendir (TTS)', 'Text to Speech (TTS)')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. ARCHITECTURE & SECURITY BADGES */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-chick-yellow text-black font-bold">
            <Cpu className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--text-main)]">
              {trEn(
                'Yerel CPU Mimarisi & Üst Düzey Güvenlik',
                'Local CPU Architecture & Enterprise Security',
              )}
            </h4>
            <p className="text-xs text-[var(--text-muted)]">
              {trEn(
                'SSRF koruması, güvenli yükleme filtreleri ve bellek optimizasyonuyla güçlendirildi.',
                'Hardened with SSRF protection, safe upload filters, and memory optimization.',
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            {trEn('Strix Güvenli', 'Strix Secured')}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-chick-yellow/20 px-3 py-1 text-xs font-bold text-[var(--text-main)] border border-chick-yellow/40">
            <Zap className="size-3.5 text-chick-orange" aria-hidden="true" />
            {trEn('ONNX Hızlandırılmış', 'ONNX Accelerated')}
          </span>
        </div>
      </section>
    </div>
  )
}
