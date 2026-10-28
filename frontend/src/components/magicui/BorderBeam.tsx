import type { CSSProperties } from 'react'

type BorderBeamProps = {
  className?: string
  size?: number
  duration?: number
  borderWidth?: number
  colorFrom?: string
  colorTo?: string
  delay?: number
}

export function BorderBeam({
  className = '',
  duration = 10,
  borderWidth = 1.5,
  colorFrom = '#FFE733',
  colorTo = '#FF8071',
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden ${className}`}
      style={
        {
          '--duration': `${duration}s`,
          '--border-width': `${borderWidth}px`,
          '--color-from': colorFrom,
          '--color-to': colorTo,
          '--delay': `-${delay}s`,
          padding: `${borderWidth}px`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
        } as CSSProperties
      }
    >
      <div
        className="absolute -inset-[100%] animate-border-beam [animation-delay:var(--delay)]"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 310deg, var(--color-to) 340deg, var(--color-from) 360deg)`,
        }}
      />
    </div>
  )
}
