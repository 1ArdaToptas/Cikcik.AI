import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react'

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<'button'> {
  shimmerColor?: string
  shimmerSize?: string
  borderRadius?: string
  shimmerDuration?: string
  background?: string
  className?: string
  children?: ReactNode
}

export function ShimmerButton({
  shimmerColor = '#FFE733',
  shimmerSize = '0.12em',
  borderRadius = '9999px',
  shimmerDuration = '2.5s',
  background,
  className = '',
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      style={
        {
          '--spread': '90deg',
          '--shimmer-color': shimmerColor,
          '--radius': borderRadius,
          '--speed': shimmerDuration,
          '--cut': shimmerSize,
          '--bg': background ?? 'var(--sidebar-bg)',
        } as CSSProperties
      }
      className={`group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-[var(--border-subtle)] px-6 py-3 font-bold text-[var(--text-main)] [background:var(--bg)] [border-radius:var(--radius)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:border-chick-yellow/60 shadow-sm ${className}`}
      {...props}
    >
      {/* Spark container */}
      <div className="pointer-events-none -z-30 blur-[2px] absolute inset-0 overflow-visible [container-type:size]">
        {/* Spark */}
        <div className="absolute inset-0 h-[100cqh] animate-border-beam [aspect-ratio:1]">
          <div
            className="h-full w-full"
            style={{
              background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 280deg, var(--shimmer-color) 360deg)`,
            }}
          />
        </div>
      </div>

      {/* Backdrop */}
      <div
        className="absolute [border-radius:var(--radius)] -z-20 transition-all duration-300 group-hover:opacity-95"
        style={{
          inset: '1.5px',
          background: 'var(--bg)',
        }}
      />

      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  )
}
