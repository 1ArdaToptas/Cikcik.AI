type Props = {
  className?: string
  colorStops?: string[]
  amplitude?: number
  blend?: number
}

export function Aurora({
  className = '',
  colorStops = ['#FFE733', '#FF8071', '#38BDF8', '#84CE64'],
}: Props) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden opacity-30 dark:opacity-20 transition-opacity duration-700 ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute -inset-[30%] filter blur-[70px] animate-aurora"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, ${colorStops[0]} 0%, transparent 45%),
            radial-gradient(circle at 80% 20%, ${colorStops[1]} 0%, transparent 45%),
            radial-gradient(circle at 60% 80%, ${colorStops[2]} 0%, transparent 45%),
            radial-gradient(circle at 10% 70%, ${colorStops[3]} 0%, transparent 40%)
          `,
          willChange: 'transform',
        }}
      />
      <style>{`
        @keyframes aurora-flow {
          0% { transform: rotate(0deg) scale(1) translate(0, 0); }
          50% { transform: rotate(180deg) scale(1.15) translate(4%, 3%); }
          100% { transform: rotate(360deg) scale(1) translate(0, 0); }
        }
        .animate-aurora {
          animation: aurora-flow 24s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  )
}
