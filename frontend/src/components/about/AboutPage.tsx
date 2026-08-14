'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, Target, Eye, Heart, Maximize2, BarChart3 } from 'lucide-react'
import Footer4Col from '../ui/footer-column'
import Link from 'next/link'
import { aboutContent, type Locale } from './about-data'
import { SystemSection } from './SystemSection'
import { AboutFAQ } from './AboutFAQ'
import { Navbar } from '../ui/Navbar'

const valueIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  target: Target,
  zap: Zap,
  eye: Eye,
  heart: Heart,
  'maximize-2': Maximize2,
  'bar-chart-3': BarChart3,
}

export function AboutPage() {
  const [locale, setLocale] = useState<Locale>('ar')

  useEffect(() => {
    const saved = localStorage.getItem('landing-locale') as Locale | null
    if (saved === 'ar' || saved === 'en') {
      setLocale(saved)
    }
  }, [])

  const toggleLocale = () => {
    const next = locale === 'ar' ? 'en' : 'ar'
    setLocale(next)
    localStorage.setItem('landing-locale', next)
  }

  const content = aboutContent[locale]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar locale={locale} onToggleLocale={toggleLocale} ctaText={locale === 'ar' ? 'ابدأ الآن' : 'Get Started'} />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00d4ff]/[0.03] to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}
          >
            {content.hero.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-base md:text-lg text-white/40 max-w-2xl mx-auto leading-relaxed"
          >
            {content.hero.subtitle}
          </motion.p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative py-12">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {content.stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center p-6 rounded-2xl border border-[#00d4ff]/30 bg-[#00d4ff]/[0.03] backdrop-blur-sm"
              >
                <div className="text-3xl md:text-4xl font-bold text-[#00d4ff] mb-2" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
                  {stat.value}
                </div>
                <div className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="relative py-24">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#00d4ff] mb-4">{content.values.sectionTitle}</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
              {content.values.sectionSubtitle}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.values.items.map((item, i) => {
              const Icon = valueIcons[item.icon] || Zap
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="p-6 rounded-2xl border border-[#00d4ff]/30 bg-[#00d4ff]/[0.03] backdrop-blur-sm hover:bg-[#00d4ff]/[0.06] hover:border-[#00d4ff]/50 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#00d4ff]/10 flex items-center justify-center mb-4 group-hover:bg-[#00d4ff]/15 transition-colors duration-300">
                    <Icon className="w-5 h-5 text-[#00d4ff]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{item.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative py-24">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#00d4ff] mb-4">{content.timeline.sectionTitle}</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
              {content.timeline.sectionSubtitle}
            </h2>
          </motion.div>

          <div className="relative">
            {/* Center line */}
            <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-[#00d4ff]/20" />

            {content.timeline.milestones.map((m, i) => {
              const isLeft = i % 2 === 0
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`relative flex items-center mb-12 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`w-1/2 ${isLeft ? 'pr-12 text-right' : 'pl-12 text-left'}`}>
                    <span className="text-xs text-[#00d4ff] font-bold">{m.year}</span>
                    <h3 className="text-lg font-bold text-white mt-1 mb-2">{m.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{m.description}</p>
                  </div>

                  {/* Dot */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#0a0a0f] border-2 border-[#00d4ff] z-10" />

                  <div className="w-1/2" />
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="relative py-24">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#00d4ff] mb-4">{content.team.sectionTitle}</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
              {content.team.sectionSubtitle}
            </h2>
            <p className="text-base text-white/40 max-w-2xl mx-auto leading-relaxed">
              {content.team.description}
            </p>
          </motion.div>

          {/* Placeholder for team photos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="aspect-square rounded-2xl border border-[#00d4ff]/30 bg-[#00d4ff]/[0.03] flex items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full bg-[#00d4ff]/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#00d4ff]/30">0{i}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Clients */}
      <section className="relative py-24">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#00d4ff] mb-4">{content.clients.title}</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
              {content.clients.subtitle}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
          >
            {['Client 01', 'Client 02', 'Client 03', 'Client 04', 'Client 05', 'Client 06'].map((name, i) => (
              <div key={i} className="px-6 py-3 rounded-2xl border border-[#00d4ff]/30 bg-[#00d4ff]/[0.03]">
                <span className="text-sm text-white/40 font-medium">{name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* System Section */}
      <SystemSection content={content.system} locale={locale} />

      {/* FAQ Section */}
      <AboutFAQ content={content.faq} locale={locale} />

      {/* CTA */}
      <section className="relative py-24">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
              {content.cta.title}
            </h2>
            <p className="text-base text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed">
              {content.cta.subtitle}
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link
                href="/register"
                className="px-8 py-3.5 bg-[#00d4ff] text-black text-sm font-semibold rounded-xl hover:bg-[#00b8e6] hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all duration-300"
              >
                {content.cta.primaryButton}
              </Link>
              <Link
                href="/about"
                className="px-8 py-3.5 border border-[#00d4ff]/30 text-white text-sm font-semibold rounded-xl hover:bg-[#00d4ff]/[0.06] hover:border-[#00d4ff]/50 transition-all duration-300"
              >
                {content.cta.secondaryButton}
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              {content.cta.badges.map((badge, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-4 h-4 rounded-full border border-[#00d4ff]/40 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
                  </div>
                  <span className="text-xs text-white/40">{badge}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer4Col locale={locale} />
    </div>
  )
}
