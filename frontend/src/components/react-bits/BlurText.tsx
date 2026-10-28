import { useEffect, useRef, useState } from 'react'

type Props = {
  text: string
  delay?: number
  className?: string
  animateBy?: 'words' | 'letters'
  direction?: 'top' | 'bottom'
  threshold?: number
}

export function BlurText({
  text,
  delay = 80,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
}: Props) {
  const elements = animateBy === 'words' ? text.split(' ') : text.split('')
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  const initialY = direction === 'top' ? -18 : 18

  return (
    <p ref={ref} className={`inline-flex flex-wrap items-center ${className}`}>
      {elements.map((el, index) => (
        <span
          key={index}
          style={{
            transition: `opacity 0.65s cubic-bezier(0.2, 0.65, 0.3, 0.9), transform 0.65s cubic-bezier(0.2, 0.65, 0.3, 0.9), filter 0.65s ease`,
            transitionDelay: `${index * delay}ms`,
            opacity: inView ? 1 : 0,
            transform: inView ? 'translateY(0px)' : `translateY(${initialY}px)`,
            filter: inView ? 'blur(0px)' : 'blur(10px)',
            display: 'inline-block',
            willChange: 'transform, opacity, filter',
          }}
          className={animateBy === 'words' ? 'mr-[0.28em] last:mr-0' : ''}
        >
          {el === ' ' ? '\u00A0' : el}
        </span>
      ))}
    </p>
  )
}
