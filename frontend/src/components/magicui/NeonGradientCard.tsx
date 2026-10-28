import type { CSSProperties, ReactNode } from 'react'

interface NeonGradientCardProps {
  children: ReactNode
  className?: string
  borderSize?: number
  borderRadius?: number
  neonColors?: {
    firstColor: string
    secondColor: string
  }
}

export function NeonGradientCard({
  children,
  className = '',
  borderSize = 2,
  borderRadius = 24,
  neonColors = {
    firstColor: '#FFE733',
    secondColor: '#FF8071',
  },
}: NeonGradientCardProps) {
  return (
    <div
      style={
        {
          '--border-size': `${borderSize}px`,
          '--border-radius': `${borderRadius}px`,
          '--neon-first-color': neonColors.firstColor,
          '--neon-second-color': neonColors.secondColor,
        } as CSSProperties
      }
      className={`relative z-10 rounded-[var(--border-radius)] ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-[1px] -z-10 rounded-[calc(var(--border-radius)+1px)] bg-gradient-to-r from-[var(--neon-first-color)] to-[var(--neon-second-color)] opacity-40 blur-md transition-opacity duration-500 group-hover:opacity-80"
        aria-hidden="true"
      />
      <div
        className="relative z-10 size-full rounded-[var(--border-radius)] border border-[var(--border-subtle)] bg-[var(--card-bg)] text-[var(--text-main)] shadow-xl"
      >
        {children}
      </div>
    </div>
  )
}
