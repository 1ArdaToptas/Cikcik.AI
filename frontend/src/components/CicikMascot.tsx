import { AlertCircle, CheckCircle2, Radio, Sparkles } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export type MascotMood =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'success'
  | 'error'
  | 'empty'
  | 'long'

type Props = {
  mood?: MascotMood
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showSpeechBubble?: boolean
  customSpeech?: string
}

export function CicikMascot({
  mood = 'idle',
  size = 'md',
  className = '',
  showSpeechBubble = false,
  customSpeech,
}: Props) {
  const { trEn } = useLanguage()

  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-44 h-44',
  }

  const roundedMap = {
    sm: 'rounded-xl',
    md: 'rounded-2xl',
    lg: 'rounded-3xl',
    xl: 'rounded-4xl',
  }

  // Mood speech texts
  const speechText =
    customSpeech ??
    (mood === 'listening'
      ? trEn('Dinliyorum...', 'Listening...')
      : mood === 'processing'
        ? trEn('Cicik yazıyor...', 'Cicik is writing...')
        : mood === 'success'
          ? trEn('Tamamlandı!', 'Completed!')
          : mood === 'error'
            ? trEn('Cik... bir sorun çıktı.', 'Chirp... something went wrong.')
            : mood === 'empty'
              ? trEn('Hazırım! Konuşmaya başla.', 'Ready! Start speaking.')
              : mood === 'long'
                ? trEn('Cicik hâlâ dinliyor', 'Cicik is still listening')
                : trEn('Cik cik! Konuş, yazayım.', 'Chirp! Speak and I will write.'))

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Dynamic Speech Bubble */}
      {showSpeechBubble && (
        <div className="relative mb-3 animate-enter z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-chick-yellow bg-[var(--card-bg)] px-4 py-1.5 text-xs font-bold text-[var(--text-main)] shadow-md whitespace-nowrap">
            {mood === 'listening' || mood === 'long' ? (
              <Radio className="size-3.5 text-sky-500 animate-pulse" aria-hidden="true" />
            ) : mood === 'success' ? (
              <CheckCircle2 className="size-3.5 text-chick-success" aria-hidden="true" />
            ) : mood === 'error' ? (
              <AlertCircle className="size-3.5 text-chick-red" aria-hidden="true" />
            ) : (
              <Sparkles className="size-3.5 text-chick-orange" aria-hidden="true" />
            )}
            <span>{speechText}</span>
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-2.5 rotate-45 border-b border-r border-chick-yellow bg-[var(--card-bg)]" />
        </div>
      )}

      <div className={`relative ${sizeMap[size]}`}>
        {/* Subtle Ambient Sound Rings (when listening or long) */}
        {(mood === 'listening' || mood === 'long') && (
          <>
            <span className="absolute -inset-3 rounded-full border-2 border-sky-400 animate-ping opacity-75" />
            <span className="absolute -inset-6 rounded-full border border-amber-400 animate-pulse opacity-50" />
          </>
        )}

        {mood === 'processing' && (
          <span className="absolute -inset-3 rounded-full border-2 border-dashed border-amber-500 animate-spin opacity-80" />
        )}

        {/* User's Original Logo (Pixel Mascot Art) */}
        <div
          className={`relative w-full h-full ${roundedMap[size]} overflow-hidden ring-3 ring-amber-400/60 shadow-xl shadow-amber-500/20 bg-amber-400 transition-all duration-300 ${
            mood === 'listening'
              ? 'animate-chirp-listen scale-105'
              : mood === 'processing'
                ? 'animate-pulse'
                : mood === 'success'
                  ? 'animate-bounce'
                  : mood === 'error'
                    ? 'rotate-6'
                    : 'animate-chirp-breathe hover:scale-105'
          }`}
        >
          <img
            src="/logo.jpg"
            alt={trEn('Cicik AI Maskot Logosu', 'Cicik AI Mascot Logo')}
            width={176}
            height={176}
            decoding="async"
            className="w-full h-full object-cover select-none pointer-events-none"
          />
        </div>

        {/* Live Audio Waves radiating from chick's beak */}
        {(mood === 'listening' || mood === 'long') && (
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex items-center gap-1" aria-hidden="true">
            <span className="w-1.5 h-4 rounded-full bg-sky-400 animate-pulse" />
            <span className="w-1.5 h-6 rounded-full bg-sky-400 animate-wave-bar" />
            <span className="w-1.5 h-8 rounded-full bg-sky-400 animate-pulse" />
          </div>
        )}

        {/* Success Badge */}
        {mood === 'success' && (
          <span
            className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-chick-success text-black shadow-md animate-bounce"
            aria-hidden="true"
          >
            <CheckCircle2 className="size-4" />
          </span>
        )}
      </div>
    </div>
  )
}
