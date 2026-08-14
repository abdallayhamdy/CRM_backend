'use client'

import { motion } from 'framer-motion'
import type { Locale } from './landing-data'

interface PartnersSectionProps {
  content: {
    title: string;
  };
  locale: Locale;
}

const partners = [
  { name: 'Shopify', en: 'Shopify' },
  { name: 'Rootline', en: 'Rootline' },
  { name: 'GoDaddy', en: 'GoDaddy' },
  { name: 'Zapier', en: 'Zapier' },
  { name: 'Meta', en: 'Meta' },
  { name: 'Stripe', en: 'Stripe' },
  { name: 'Slack', en: 'Slack' },
  { name: 'Notion', en: 'Notion' },
]

export function PartnersSection({ content, locale }: PartnersSectionProps) {
  return (
    <section className="relative py-12 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
            {content.title}
          </p>
        </motion.div>

        {/* Logos marquee */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0a0a0f] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0a0a0f] to-transparent z-10 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-12 overflow-hidden"
          >
            <div className="flex items-center gap-12 animate-scroll">
              {[...partners, ...partners].map((partner, index) => (
                <div
                  key={`${partner.name}-${index}`}
                  className="flex items-center gap-2 shrink-0 opacity-40 hover:opacity-70 transition-opacity duration-300"
                >
                  <span className="text-sm font-medium text-white whitespace-nowrap">
                    {partner.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
