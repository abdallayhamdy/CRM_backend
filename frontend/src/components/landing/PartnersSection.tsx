'use client'

import { motion } from 'framer-motion'
import type { Locale } from './landing-data'

interface PartnersSectionProps {
  content: {
    title: string;
  };
  locale: Locale;
}

const trustItems = {
  ar: ['بيانات آمنة', 'دعم فني متواصل', 'تحديثات مستمرة', 'واجهة سهلة الاستخدام'],
  en: ['Secure Data', 'Continuous Support', 'Regular Updates', 'Easy to Use'],
}

export function PartnersSection({ content, locale }: PartnersSectionProps) {
  const items = trustItems[locale]

  return (
    <section className="relative py-16 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
            {content.title}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-14"
        >
          {items.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-white/25 hover:text-white/45 transition-colors duration-300"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]/40" />
              <span className="text-sm font-medium whitespace-nowrap">
                {item}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
