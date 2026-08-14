'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, MessageCircle } from 'lucide-react'
import type { Locale } from './about-data'

interface AboutFAQProps {
  content: {
    sectionTitle: string
    title: string
    subtitle: string
    cta: string
    contact: {
      title: string
      description: string
      phone: string
      email: string
    }
    items: readonly { question: string; answer: string }[]
  }
  locale: Locale
}

export function AboutFAQ({ content, locale }: AboutFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12">
          {/* Left: Header + Contact Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#00d4ff] mb-4">{content.sectionTitle}</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
              {content.title}
            </h2>
            <p className="text-sm text-white/40 mb-6">{content.subtitle}</p>
            <a href="/contact" className="inline-flex items-center gap-2 text-sm text-[#00d4ff] hover:text-[#00b8e6] transition-colors">
              {content.cta} →
            </a>

            {/* Contact Card */}
            <div className="mt-8 p-5 rounded-2xl border border-[#00d4ff]/30 bg-[#00d4ff]/[0.03]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#00d4ff]/10 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-[#00d4ff]" />
                </div>
                <span className="text-sm font-semibold text-white">{content.contact.title}</span>
              </div>
              <p className="text-xs text-white/40 mb-3">{content.contact.description}</p>
              <div className="space-y-1">
                <a href={`tel:${content.contact.phone}`} className="block text-xs text-[#00d4ff] hover:text-[#00b8e6] transition-colors">
                  {content.contact.phone}
                </a>
                <a href={`mailto:${content.contact.email}`} className="block text-xs text-[#00d4ff] hover:text-[#00b8e6] transition-colors">
                  {content.contact.email}
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right: Accordion */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-3"
          >
            {content.items.map((item, i) => {
              const isOpen = openIndex === i
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                  className={`rounded-2xl border transition-all duration-300 ${
                    isOpen
                      ? 'border-[#00d4ff]/30 bg-[#00d4ff]/[0.03]'
                      : 'border-[#00d4ff]/30 bg-[#00d4ff]/[0.02] hover:bg-[#00d4ff]/[0.05]'
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer"
                  >
                    <span className="text-xs text-white/30 font-mono w-6">{String(i + 1).padStart(2, '0')}</span>
                    <span className={`text-sm font-medium flex-1 transition-colors duration-300 ${isOpen ? 'text-white' : 'text-white/70'}`}>
                      {item.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className={`w-4 h-4 transition-colors duration-300 ${isOpen ? 'text-[#00d4ff]' : 'text-white/30'}`} />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 pl-14">
                          <p className="text-sm text-white/40 leading-relaxed">{item.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
