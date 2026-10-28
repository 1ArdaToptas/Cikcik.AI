import { useEffect, useRef } from 'react'

interface ParticlesProps {
  className?: string
  quantity?: number
  staticity?: number
  ease?: number
  size?: number
  refresh?: boolean
  color?: string
  vx?: number
  vy?: number
}

function hexToRgb(hex: string): number[] {
  let clean = hex.replace('#', '')
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const num = parseInt(clean, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

export function Particles({
  className = '',
  quantity = 35,
  staticity = 50,
  ease = 50,
  size = 0.8,
  refresh = false,
  color,
  vx = 0,
  vy = 0,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const animFrameIdRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvasContainerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const mouse = { x: 0, y: 0 }
    const canvasSize = { w: 0, h: 0 }

    type Circle = {
      x: number
      y: number
      translateX: number
      translateY: number
      size: number
      alpha: number
      targetAlpha: number
      dx: number
      dy: number
      magnetism: number
    }

    const circles: Circle[] = []

    function createCircle(): Circle {
      return {
        x: Math.floor(Math.random() * canvasSize.w),
        y: Math.floor(Math.random() * canvasSize.h),
        translateX: 0,
        translateY: 0,
        size: Math.floor(Math.random() * 2) + size,
        alpha: 0,
        targetAlpha: parseFloat((Math.random() * 0.5 + 0.1).toFixed(2)),
        dx: (Math.random() - 0.5) * 0.15 + vx,
        dy: (Math.random() - 0.5) * 0.15 + vy,
        magnetism: 0.1 + Math.random() * 4,
      }
    }

    function resizeCanvas() {
      if (!container || !canvas || !ctx) return
      circles.length = 0
      canvasSize.w = container.offsetWidth
      canvasSize.h = container.offsetHeight
      canvas.width = canvasSize.w * dpr
      canvas.height = canvasSize.h * dpr
      canvas.style.width = `${canvasSize.w}px`
      canvas.style.height = `${canvasSize.h}px`
      ctx.scale(dpr, dpr)

      for (let i = 0; i < quantity; i++) {
        circles.push(createCircle())
      }
    }

    function drawCircle(circle: Circle) {
      if (!ctx) return
      ctx.translate(circle.translateX, circle.translateY)
      ctx.beginPath()
      ctx.arc(circle.x, circle.y, circle.size, 0, 2 * Math.PI)

      let rgb = [255, 231, 51]
      if (color) {
        rgb = hexToRgb(color)
      } else {
        const isDark = document.documentElement.classList.contains('dark')
        const isSakura = document.documentElement.classList.contains('sakura')
        if (isSakura) {
          rgb = [219, 39, 119]
        } else if (!isDark) {
          rgb = [140, 130, 115]
        }
      }

      ctx.fillStyle = `rgba(${rgb.join(', ')}, ${circle.alpha})`
      ctx.fill()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function render() {
      if (!ctx) return
      ctx.clearRect(0, 0, canvasSize.w, canvasSize.h)

      circles.forEach((circle, i) => {
        const edge = [
          circle.x + circle.translateX - circle.size,
          canvasSize.w - circle.x - circle.translateX - circle.size,
          circle.y + circle.translateY - circle.size,
          canvasSize.h - circle.y - circle.translateY - circle.size,
        ]
        const closestEdge = edge.reduce((a, b) => Math.min(a, b))
        if (closestEdge <= 20) {
          circle.alpha = (closestEdge / 20) * circle.targetAlpha
        } else {
          circle.alpha = circle.targetAlpha
        }

        circle.x += circle.dx
        circle.y += circle.dy
        circle.translateX += (mouse.x / (staticity / circle.magnetism) - circle.translateX) / ease
        circle.translateY += (mouse.y / (staticity / circle.magnetism) - circle.translateY) / ease

        if (
          circle.x < -circle.size ||
          circle.x > canvasSize.w + circle.size ||
          circle.y < -circle.size ||
          circle.y > canvasSize.h + circle.size
        ) {
          circles[i] = createCircle()
        } else {
          drawCircle(circle)
        }
      })

      animFrameIdRef.current = window.requestAnimationFrame(render)
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left - canvasSize.w / 2
      mouse.y = e.clientY - rect.top - canvasSize.h / 2
    }

    resizeCanvas()
    animFrameIdRef.current = window.requestAnimationFrame(render)

    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('mousemove', onMouseMove)
      if (animFrameIdRef.current) {
        window.cancelAnimationFrame(animFrameIdRef.current)
      }
    }
  }, [color, ease, quantity, refresh, size, staticity, vx, vy])

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      ref={canvasContainerRef}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="size-full" />
    </div>
  )
}
