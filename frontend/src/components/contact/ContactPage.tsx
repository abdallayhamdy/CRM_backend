'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, MessageCircle, Send } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Footer4Col from '../landing/footer-column'
import Link from 'next/link'
import { contactContent, type Locale } from './contact-data'
import { Navbar } from '../landing/Navbar'

export function ContactPage() {
  const [locale, setLocale] = useState<Locale>('ar')
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)
  const [interestedIn, setInterestedIn] = useState('')
  const [timeline, setTimeline] = useState('')

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

  const content = contactContent[locale]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar locale={locale} onToggleLocale={toggleLocale} ctaText={content.nav.cta} />

      {/* Hero */}
      <section className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00d4ff]/[0.03] to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-2 text-xs text-white/30 mb-4">
              <Link href="/" className="hover:text-white/60 transition-colors">الرئيسية</Link>
              <span>/</span>
              <span className="text-white/60">تواصل معنا</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
              {content.hero.title}
            </h1>
            <p className="text-base text-white/40 max-w-xl leading-relaxed">
              {content.hero.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="relative py-12">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-6 md:p-8 rounded-2xl border border-[#00d4ff]/30 bg-[#00d4ff]/[0.03]"
          >
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-white">{content.smart.form.title}</h3>
            </div>
            <p className="text-xs text-white/30 mb-6">{content.smart.form.replyNote}</p>

            <div className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-2">{content.smart.form.fullName}</label>
                  <input
                    type="text"
                    placeholder={content.smart.form.fullNamePlaceholder}
                    className="w-full px-4 py-3 rounded-lg bg-[#00d4ff]/[0.03] border border-[#00d4ff]/30 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00d4ff]/50 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-2">{content.smart.form.email}</label>
                  <input
                    type="email"
                    placeholder={content.smart.form.emailPlaceholder}
                    className="w-full px-4 py-3 rounded-lg bg-[#00d4ff]/[0.03] border border-[#00d4ff]/30 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00d4ff]/50 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-2">{content.smart.form.phone}</label>
                  <input
                    type="tel"
                    placeholder={content.smart.form.phonePlaceholder}
                    className="w-full px-4 py-3 rounded-lg bg-[#00d4ff]/[0.03] border border-[#00d4ff]/30 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00d4ff]/50 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-2">{content.smart.form.company}</label>
                  <input
                    type="text"
                    placeholder={content.smart.form.companyPlaceholder}
                    className="w-full px-4 py-3 rounded-lg bg-[#00d4ff]/[0.03] border border-[#00d4ff]/30 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00d4ff]/50 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-2">{content.smart.form.interestedIn}</label>
                  <Select value={interestedIn} onValueChange={setInterestedIn}>
                    <SelectTrigger className="w-full px-4 py-3 rounded-lg bg-[#00d4ff]/[0.03] border border-[#00d4ff]/30 text-white text-sm focus:outline-none focus:border-[#00d4ff]/50 transition-all duration-300 appearance-none cursor-pointer">
                      <SelectValue placeholder={content.smart.form.interestedInPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {content.smart.form.interestedInOptions.map((opt, i) => (
                        <SelectItem key={i} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-2">{content.smart.form.timeline}</label>
                  <Select value={timeline} onValueChange={setTimeline}>
                    <SelectTrigger className="w-full px-4 py-3 rounded-lg bg-[#00d4ff]/[0.03] border border-[#00d4ff]/30 text-white text-sm focus:outline-none focus:border-[#00d4ff]/50 transition-all duration-300 appearance-none cursor-pointer">
                      <SelectValue placeholder={content.smart.form.timelinePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {content.smart.form.timelineOptions.map((opt, i) => (
                        <SelectItem key={i} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Goals */}
              <div>
                <label className="block text-xs text-white/50 mb-2">{content.smart.form.goals}</label>
                <textarea
                  placeholder={content.smart.form.goalsPlaceholder}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-[#00d4ff]/[0.03] border border-[#00d4ff]/30 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00d4ff]/50 transition-all duration-300 resize-none"
                />
                <p className="text-[10px] text-white/20 text-right mt-1">0 / 2000</p>
              </div>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-[10px] text-white/20 max-w-md">{content.smart.form.submitNote}</p>
                <button
                  type="button"
                  className="px-6 py-3 bg-[#00d4ff] text-black text-sm font-semibold rounded-xl hover:bg-[#00b8e6] hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all duration-300 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {content.smart.form.submit}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-24">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-[#00d4ff] mb-4">{content.faq.sectionTitle}</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
                {content.faq.title}
              </h2>
              <p className="text-sm text-white/40 mb-6">{content.faq.subtitle}</p>
              <a href="#form" className="inline-flex items-center gap-2 text-sm text-[#00d4ff] hover:text-[#00b8e6] transition-colors">
                {content.faq.cta} →
              </a>
              <div className="mt-8 p-5 rounded-2xl border border-[#00d4ff]/30 bg-[#00d4ff]/[0.03]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-[#00d4ff]/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-[#00d4ff]" />
                  </div>
                  <span className="text-sm font-semibold text-white">{content.faq.contact.title}</span>
                </div>
                <p className="text-xs text-white/40 mb-3">{content.faq.contact.description}</p>
                <div className="space-y-1">
                  <a href={`tel:${content.faq.contact.phone}`} className="block text-xs text-[#00d4ff] hover:text-[#00b8e6] transition-colors">
                    {content.faq.contact.phone}
                  </a>
                  <a href={`mailto:${content.faq.contact.email}`} className="block text-xs text-[#00d4ff] hover:text-[#00b8e6] transition-colors">
                    {content.faq.contact.email}
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Right - Accordion */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-3"
            >
              {content.faq.items.map((item, i) => {
                const isOpen = openFaqIndex === i
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
                      onClick={() => setOpenFaqIndex(isOpen ? null : i)}
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
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 pl-14">
                          <p className="text-sm text-white/40 leading-relaxed">{item.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer4Col locale={locale} />
    </div>
  )
}
