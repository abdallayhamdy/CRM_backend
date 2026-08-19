'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'
import type { Locale } from './landing-data'

interface ProductPreviewSectionProps {
  content: {
    title: string;
    subtitle: string;
    tabs: readonly { label: string; image: string; alt: string }[];
  };
  locale: Locale;
}

export function ProductPreviewSection({ content, locale }: ProductPreviewSectionProps) {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}
          >
            {content.title}
          </h2>
          <p className="text-base text-white/40 max-w-xl mx-auto leading-relaxed">
            {content.subtitle}
          </p>
        </motion.div>

        {/* Tab buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-center gap-2 mb-10"
        >
          {content.tabs.map((tab, index) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(index)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 cursor-pointer ${
                activeTab === index
                  ? 'bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30'
                  : 'text-white/40 hover:text-white/60 border border-transparent hover:border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Screenshot display */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative rounded-2xl border border-[#00d4ff]/20 bg-[#00d4ff]/[0.02] overflow-hidden"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#00d4ff]/10 bg-[#0a0a0f]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <div className="w-3 h-3 rounded-full bg-white/10" />
            </div>
            <div className="flex-1 mx-4">
              <div className="h-6 rounded-md bg-white/5 border border-white/5 flex items-center px-3">
                <span className="text-[11px] text-white/20">rootline-crm.example.com</span>
              </div>
            </div>
          </div>

          {/* Screenshot image */}
          <div className="relative bg-[#0a0a0f] p-2">
            {content.tabs.map((tab, index) => (
              <div
                key={tab.label}
                className={`transition-opacity duration-500 ${
                  activeTab === index ? 'opacity-100 block' : 'opacity-0 hidden'
                }`}
              >
                <Image
                  src={tab.image}
                  alt={tab.alt}
                  width={1920}
                  height={1080}
                  className="w-full h-auto rounded-lg"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
