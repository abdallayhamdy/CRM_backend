'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import type { Locale } from './landing-data'

interface FAQSectionProps {
  content: {
    sectionTitle: string;
    sectionSubtitle: string;
    items: readonly { question: string; answer: string }[];
  };
  locale: Locale;
}

export function FAQSection({ content, locale }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="relative py-32 overflow-hidden">
      {/* Divider */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto px-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
            {content.sectionTitle}
          </h2>
          <p className="text-lg text-white/50 max-w-xl mx-auto">
            {content.sectionSubtitle}
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {content.items.map((item, index) => (
            <motion.div
              key={item.question}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  openIndex === index
                    ? 'bg-white/[0.04] border-[#00d4ff]/30'
                    : 'bg-[#00d4ff]/[0.03] border-[#00d4ff]/30 hover:bg-[#00d4ff]/[0.05] hover:border-[#00d4ff]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-white text-sm md:text-base">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-white/40 shrink-0 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180 text-[#00d4ff]' : ''
                    }`}
                  />
                </div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-2 text-sm text-white/40 leading-relaxed">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
