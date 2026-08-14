'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Lightbulb, Rocket, BarChart3, Maximize2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { Locale } from './landing-data'

const ShootingStarsGrid = dynamic(
  () => import('@/components/ui/shooting-stars-grid').then((m) => ({ default: m.ShootingStarsGrid })),
  { ssr: false }
)

const stageIcons = {
  discover: Search,
  strategize: Lightbulb,
  execute: Rocket,
  optimize: BarChart3,
  scale: Maximize2,
}

interface HowWeWorkSectionProps {
  content: {
    sectionTitle: string
    sectionSubtitle: string
    description: string
    cta: string
    stages: readonly {
      id: string
      number: string
      label: string
      title: string
      description: string
      deliverables: readonly string[]
    }[]
  }
  locale: Locale
}

export function HowWeWorkSection({ content, locale }: HowWeWorkSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeStage = content.stages[activeIndex]

  return (
    <div className="relative bg-[#0a1628] overflow-hidden">
      <ShootingStarsGrid
        starCount={50}
        shootingStarCount={8}
        gridSize={44}
        speed="normal"
        glow
        className="absolute inset-0"
      />
      <section className="relative z-10 py-24 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#00d4ff] mb-4">
            {content.sectionTitle}
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
                {content.sectionSubtitle}
              </h2>
              <p className="text-base text-white/40 max-w-xl leading-relaxed">
                {content.description}
              </p>
            </div>
            <a href="/login" className="text-sm text-[#00d4ff] hover:text-[#00b8e6] transition-colors whitespace-nowrap">
              {content.cta} →
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative mb-6 h-1">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/10 rounded-full" />
            <motion.div
              className="absolute inset-y-0 left-0 h-0.5 bg-[#00d4ff] rounded-full"
              initial={false}
              animate={{ width: `${((activeIndex + 1) / content.stages.length) * 100}%` }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            />
          </div>

          <div className="relative grid grid-cols-5 gap-2">
            {content.stages.map((stage, index) => {
              const Icon = stageIcons[stage.id as keyof typeof stageIcons]
              const isActive = index === activeIndex
              const isCompleted = index < activeIndex
              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveIndex(index)}
                  className={`relative flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#00d4ff]/10 border-[#00d4ff]/30 text-white shadow-[0_0_20px_rgba(0,212,255,0.15)]'
                      : isCompleted
                        ? 'bg-[#00d4ff]/5 border-[#00d4ff]/30 text-white/70'
                        : 'bg-[#00d4ff]/[0.03] border-[#00d4ff]/30 text-white/50 hover:bg-[#00d4ff]/[0.05] hover:text-white/70'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 ${
                    isActive
                      ? 'bg-[#00d4ff]/20 text-[#00d4ff]'
                      : isCompleted
                        ? 'bg-[#00d4ff]/10 text-[#00d4ff]/60'
                        : 'bg-white/5 text-white/40'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-white/30 block">{stage.number}</span>
                    <span className="text-sm font-medium">{stage.label}</span>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#00d4ff] rounded-full"
                      transition={{ duration: 0.15, ease: 'easeInOut' }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage.id}
            initial={{ opacity: 0, y: 15, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="rounded-2xl border border-[#00d4ff]/30 bg-[#00d4ff]/[0.03] p-8 backdrop-blur-sm"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <motion.span
                    key={activeStage.number}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15, type: 'spring', stiffness: 300 }}
                    className="text-5xl font-bold text-white/10"
                  >
                    {activeStage.number}
                  </motion.span>
                  <div>
                    <motion.span
                      key={`label-${activeStage.id}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs uppercase tracking-wider text-[#00d4ff]"
                    >
                      {activeStage.label}
                    </motion.span>
                    <motion.h3
                      key={`title-${activeStage.id}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.03 }}
                      className="text-xl font-bold text-white"
                    >
                      {activeStage.title}
                    </motion.h3>
                  </div>
                </div>
                <motion.p
                  key={`desc-${activeStage.id}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                  className="text-sm text-white/40 leading-relaxed"
                >
                  {activeStage.description}
                </motion.p>
              </motion.div>

              <div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                  className="text-xs uppercase tracking-wider text-white/30 mb-4"
                >
                  {locale === 'ar' ? 'المخرجات الرئيسية' : 'Key Deliverables'}
                </motion.p>
                <div className="space-y-2">
                  {activeStage.deliverables.map((item, i) => (
                    <motion.div
                      key={`${activeStage.id}-${i}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.05 + i * 0.04 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#00d4ff]/[0.03] border border-[#00d4ff]/30 hover:bg-[#00d4ff]/[0.06] hover:border-[#00d4ff]/50 transition-colors duration-300"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.15, delay: 0.08 + i * 0.04, type: 'spring', stiffness: 400 }}
                        className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]"
                      />
                      <span className="text-sm text-white/70">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}
