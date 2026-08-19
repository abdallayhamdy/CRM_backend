'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { Locale } from './landing-data'

const ShootingStarsGrid = dynamic(
  () => import('@/components/landing/shooting-stars-grid').then((m) => ({ default: m.ShootingStarsGrid })),
  { ssr: false }
)

interface CTASectionProps {
  content: {
    title: string;
    subtitle: string;
    button: string;
  };
  locale: Locale;
}

export function CTASection({ content, locale }: CTASectionProps) {
  return (
    <section className="relative min-h-[520px] overflow-hidden bg-[#0a0a0f]">
      <ShootingStarsGrid
        starCount={50}
        shootingStarCount={8}
        gridSize={44}
        speed="normal"
        glow
        className="absolute inset-0"
      />
      <div className="relative z-10 flex min-h-[520px] items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-5xl mx-auto"
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Decorative line */}
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/50 to-transparent mx-auto mb-12" />

          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
            {content.title}
          </h2>
          <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto">
            {content.subtitle}
          </p>

          <Link
            href="/login"
            className="group relative inline-flex items-center gap-3 px-10 py-5 bg-[#00d4ff] text-black font-semibold text-lg rounded-xl hover:bg-[#00b8e6] transition-all duration-300 shadow-[0_0_40px_rgba(0,212,255,0.3)] hover:shadow-[0_0_60px_rgba(0,212,255,0.5)]"
          >
            <Zap className="w-5 h-5" />
            <span>{content.button}</span>
            <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${locale === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
