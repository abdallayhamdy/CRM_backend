'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import type { Locale } from './landing-data'

interface StatsSectionProps {
  content: {
    items: readonly { value: string; label: string }[];
  };
  locale: Locale;
}

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (!isInView) return
    const duration = 2000
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [isInView, target])

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  )
}

function parseValue(value: string): { num: number; suffix: string } {
  const match = value.match(/^([\d,]+)(.*)$/)
  if (match) {
    return { num: parseInt(match[1].replace(/,/g, ''), 10), suffix: match[2] }
  }
  return { num: 0, suffix: value }
}

export function StatsSection({ content, locale }: StatsSectionProps) {
  return (
    <section className="relative py-8 overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto px-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center gap-8 md:gap-16"
        >
          {content.items.map((stat, index) => {
            const { num, suffix } = parseValue(stat.value)
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl md:text-3xl font-bold text-white">
                  <AnimatedCounter target={num} suffix={suffix} />
                </div>
                <div className="text-xs text-white/40 mt-1">{stat.label}</div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
