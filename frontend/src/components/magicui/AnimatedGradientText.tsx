import type { ReactNode } from 'react'

interface AnimatedGradientTextProps {
  children: ReactNode
  className?: string
}

export function AnimatedGradientText({
  children,
  className = '',
}: AnimatedGradientTextProps) {
  return (
    <span
      className={`inline-flex animate-gradient-x bg-gradient-to-r from-[var(--text-main)] via-amber-600 dark:via-chick-yellow to-chick-orange bg-[length:200%_auto] bg-clip-text font-display font-bold text-transparent ${className}`}
    >
      {children}
    </span>
  )
}
