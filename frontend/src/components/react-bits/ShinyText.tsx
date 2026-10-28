type Props = {
  text: string
  disabled?: boolean
  speed?: number
  className?: string
  shimmerColor?: string
}

export function ShinyText({
  text,
  disabled = false,
  speed = 5,
  className = '',
  shimmerColor = 'rgba(255, 255, 255, 0.95)',
}: Props) {
  const animationDuration = `${speed}s`

  return (
    <span
      className={`inline-block select-none ${className}`}
      style={
        disabled
          ? undefined
          : {
              backgroundImage: `linear-gradient(120deg, currentColor 0%, currentColor 38%, ${shimmerColor} 50%, currentColor 62%, currentColor 100%)`,
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: `shiny-sweep ${animationDuration} infinite linear`,
            }
      }
    >
      {text}
      <style>{`
        @keyframes shiny-sweep {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </span>
  )
}
