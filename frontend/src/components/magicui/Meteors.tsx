interface MeteorsProps {
  number?: number
  className?: string
}

export function Meteors({ number = 16, className = '' }: MeteorsProps) {
  // Deterministic pseudo-random generation based on index to satisfy React purity
  const meteorStyles = Array.from({ length: number }).map((_, i) => {
    const pseudo1 = ((i * 9301 + 49297) % 233280) / 233280
    const pseudo2 = (((i + 5) * 9301 + 49297) % 233280) / 233280
    const pseudo3 = (((i + 11) * 9301 + 49297) % 233280) / 233280
    const pseudo4 = (((i + 17) * 9301 + 49297) % 233280) / 233280

    return {
      top: `${Math.floor(pseudo1 * 80)}%`,
      left: `${Math.floor(pseudo2 * 90)}%`,
      animationDelay: `${(pseudo3 * 1.5 + 0.2).toFixed(2)}s`,
      animationDuration: `${Math.floor(pseudo4 * 6 + 3)}s`,
    }
  })

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {meteorStyles.map((style, idx) => (
        <span
          key={idx}
          className="animate-meteor absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-[9999px] bg-chick-yellow shadow-[0_0_0_1px_#ffffff10] rotate-[215deg] before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-1/2 before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-chick-yellow before:to-transparent"
          style={style}
        />
      ))}
    </div>
  )
}
