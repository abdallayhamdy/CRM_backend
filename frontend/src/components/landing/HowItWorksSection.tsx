'use client'

import { motion } from 'framer-motion'
import { UserPlus, Users, Rocket } from 'lucide-react'
import type { Locale } from './landing-data'

const stepIcons = [UserPlus, Users, Rocket]

interface HowItWorksSectionProps {
  content: {
    sectionTitle: string;
    sectionSubtitle: string;
    steps: readonly { step: string; title: string; description: string }[];
  };
  locale: Locale;
}

export function HowItWorksSection({ content, locale }: HowItWorksSectionProps) {
  return (
    <section id="how-it-works" className="relative py-32 overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#7c3aed]/3 rounded-full blur-[200px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
            {content.sectionTitle}
          </h2>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            {content.sectionSubtitle}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-[#00d4ff]/10 via-[#00d4ff]/30 to-[#00d4ff]/10 -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {content.steps.map((step, index) => {
              const Icon = stepIcons[index]
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="relative text-center"
                >
                  {/* Step number with glow */}
                  <div className="relative inline-flex mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center relative z-10">
                      <Icon className="w-8 h-8 text-[#00d4ff]" />
                    </div>
                    {/* Glow behind */}
                    <div className="absolute inset-0 rounded-2xl bg-[#00d4ff]/10 blur-xl" />
                    {/* Step number badge */}
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#00d4ff] text-black text-xs font-bold flex items-center justify-center z-20">
                      {step.step}
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-white/40 leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
