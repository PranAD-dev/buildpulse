'use client'

import { useEffect, useRef, type ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up'
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add a small delay before triggering animation
            setTimeout(() => {
              element.classList.add('scroll-reveal-visible')
            }, delay)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [delay])

  const getDirectionClass = () => {
    switch (direction) {
      case 'up':
        return 'scroll-reveal-up'
      case 'down':
        return 'scroll-reveal-down'
      case 'left':
        return 'scroll-reveal-left'
      case 'right':
        return 'scroll-reveal-right'
      case 'fade':
        return 'scroll-reveal-fade'
      default:
        return 'scroll-reveal-up'
    }
  }

  return (
    <div ref={ref} className={`scroll-reveal ${getDirectionClass()} ${className}`}>
      {children}
    </div>
  )
}
