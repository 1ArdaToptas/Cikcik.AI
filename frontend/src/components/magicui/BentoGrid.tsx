import { ArrowRight } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface BentoGridProps {
  children: ReactNode
  className?: string
}

export function BentoGrid({ children, className = '' }: BentoGridProps) {
  return (
    <div
      className={`grid w-full auto-rows-[22rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${className}`}
    >
      {children}
    </div>
  )
}

export interface BentoCardProps {
  name: string
  className?: string
  background?: ReactNode
  Icon: ComponentType<{ className?: string }>
  description: string
  href: string
  cta: string
  badge?: string
}

export function BentoCard({
  name,
  className = '',
  background,
  Icon,
  description,
  href,
  cta,
  badge,
}: BentoCardProps) {
  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-6 shadow-sm transition-all duration-300 hover:border-chick-yellow/70 hover:shadow-xl hover:-translate-y-1 ${className}`}
    >
      {/* Background Graphic / Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 transition-transform duration-500 ease-out group-hover:scale-105 opacity-80">
        {background}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="grid size-12 place-items-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] text-[var(--text-main)] shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:border-chick-yellow/50">
            <Icon className="size-5 text-chick-orange" />
          </div>
          {badge && (
            <span className="rounded-full border border-chick-yellow/40 bg-chick-yellow/15 px-2.5 py-0.5 text-[11px] font-bold text-[var(--text-main)]">
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold tracking-tight text-[var(--text-main)] font-display">
          {name}
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-sans line-clamp-3">
          {description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
        <Link
          to={href}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-main)] group-hover:text-chick-orange transition-colors cursor-pointer"
        >
          <span>{cta}</span>
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}
