'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { Locale } from './landing-data'

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260202)

const PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  key: i,
  left: `${rand() * 100}%`,
  top: `${rand() * 100}%`,
  duration: 3 + rand() * 4,
  delay: rand() * 3,
}))

const OrbitingCirclesGlobe = dynamic(() => import('@/components/ui/orbiting-circles-02'), {
  ssr: false,
  loading: () => <div className="absolute inset-0" />,
})

const CircuitBoardBackground = dynamic(
  () => import('@/components/ui/circuit-board').then((m) => ({ default: m.CircuitBoardBackground })),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0" />,
  }
)

interface HeroSectionProps {
  content: {
    badge: string;
    title: string;
    subtitle: string;
    cta: string;
  };
  locale: Locale;
}

export function HeroSection({ content, locale }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen pt-20 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        {/* Circuit board background */}
        <CircuitBoardBackground />

        {/* Orbiting circles */}
        <div className="absolute inset-0 flex items-end justify-center">
          <OrbitingCirclesGlobe />
        </div>

        {/* Floating particles */}
        {PARTICLES.map((p) => (
          <motion.div
            key={p.key}
            className="absolute w-1 h-1 bg-[#00d4ff]/30 rounded-full"
            style={{
              left: p.left,
              top: p.top,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full h-full" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-start pt-8 md:pt-16">
          {/* Text content - left side, clear of orbiting circles */}
          <div className="max-w-xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] text-sm mb-6"
            >
              <Zap className="w-4 h-4" />
              <span>{content.badge}</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1]"
              style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}
            >
              {content.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg text-white/50 max-w-lg mb-8 leading-relaxed"
            >
              {content.subtitle}
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-[#00d4ff] text-black font-semibold rounded-xl hover:bg-[#00b8e6] transition-all duration-300 shadow-[0_0_30px_rgba(0,212,255,0.3)] hover:shadow-[0_0_50px_rgba(0,212,255,0.5)]"
              >
                <span>{content.cta}</span>
                <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${locale === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
