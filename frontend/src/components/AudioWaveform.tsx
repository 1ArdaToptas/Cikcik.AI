import { useLanguage } from '../context/LanguageContext'

type Props = {
  isRecording?: boolean
  audioLevel?: number // 0 to 1
  barCount?: number
  className?: string
  colorTheme?: 'yellow' | 'blue' | 'gradient'
}

export function AudioWaveform({
  isRecording = false,
  audioLevel = 0.5,
  barCount = 28,
  className = '',
  colorTheme = 'gradient',
}: Props) {
  const { trEn } = useLanguage()

  // Deterministic heights pattern for resting waveform
  const baseHeights = [
    12, 18, 30, 48, 62, 85, 96, 74, 52, 38, 26, 44, 68, 88, 92, 70, 48, 32, 20, 36,
    58, 80, 64, 42, 28, 20, 14, 10,
  ]

  return (
    <div
      className={`flex items-center justify-center gap-1.5 h-16 w-full max-w-lg select-none px-4 ${className}`}
      role="img"
      aria-label={
        isRecording
          ? trEn('Canlı ses dalgası', 'Live audio waveform')
          : trEn('Ses dalgası', 'Audio waveform')
      }
    >
      {Array.from({ length: barCount }).map((_, index) => {
        const baseH = baseHeights[index % baseHeights.length]
        // If recording, jitter height based on audioLevel and pseudo-random variance
        const heightPct = isRecording
          ? Math.max(12, Math.min(100, baseH * (0.4 + audioLevel * 1.1)))
          : Math.max(8, baseH * 0.3)

        // Animation delay for wave progression
        const delay = (index * 45) % 800

        return (
          <div
            key={index}
            className="flex-1 max-w-[5px] h-full flex items-center justify-center"
          >
            <div
              className={`w-full rounded-full transition-all duration-150 ${
                isRecording ? 'animate-sound-wave' : 'opacity-40'
              } ${
                colorTheme === 'gradient'
                  ? 'bg-gradient-to-t from-chick-orange via-chick-yellow to-chick-chirp'
                  : colorTheme === 'yellow'
                    ? 'bg-chick-yellow'
                    : 'bg-chick-chirp'
              }`}
              style={{
                height: `${heightPct}%`,
                animationDelay: `${delay}ms`,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
