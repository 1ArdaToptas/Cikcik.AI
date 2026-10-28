import { type ReactNode, useRef, useState } from 'react'

type Spark = {
  id: number
  x: number
  y: number
  angle: number
}

type Props = {
  children: ReactNode
  sparkColor?: string
  sparkSize?: number
  sparkCount?: number
  duration?: number
  className?: string
}

export function ClickSpark({
  children,
  sparkColor = '#FFE733',
  sparkSize = 12,
  sparkCount = 8,
  duration = 500,
  className = '',
}: Props) {
  const [sparks, setSparks] = useState<Spark[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const now = Date.now()
    const newSparks: Spark[] = Array.from({ length: sparkCount }).map((_, i) => ({
      id: now + i,
      x,
      y,
      angle: (i * (360 / sparkCount) * Math.PI) / 180,
    }))

    setSparks((prev) => [...prev, ...newSparks])

    setTimeout(() => {
      setSparks((prev) => prev.filter((s) => !newSparks.some((ns) => ns.id === s.id)))
    }, duration)
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={`relative ${className}`}
    >
      {children}

      {/* Render Active Sparks */}
      <svg
        className="pointer-events-none absolute inset-0 size-full overflow-visible z-50"
        aria-hidden="true"
      >
        {sparks.map((spark) => {
          const distance = sparkSize * 2.2
          const x2 = spark.x + Math.cos(spark.angle) * distance
          const y2 = spark.y + Math.sin(spark.angle) * distance

          return (
            <line
              key={spark.id}
              x1={spark.x}
              y1={spark.y}
              x2={x2}
              y2={y2}
              stroke={sparkColor}
              strokeWidth={2}
              strokeLinecap="round"
              className="animate-spark"
              style={{
                animationDuration: `${duration}ms`,
              }}
            />
          )
        })}
      </svg>
      <style>{`
        @keyframes spark-fade {
          0% {
            stroke-dasharray: 0 100;
            stroke-dashoffset: 0;
            opacity: 1;
          }
          50% {
            stroke-dasharray: 20 100;
            stroke-dashoffset: -10;
            opacity: 0.9;
          }
          100% {
            stroke-dasharray: 0 100;
            stroke-dashoffset: -35;
            opacity: 0;
          }
        }
        .animate-spark {
          animation: spark-fade 500ms ease-out forwards;
        }
      `}</style>
    </div>
  )
}
