'use client'

import { motion } from 'framer-motion'
import { Users, Handshake, GitBranch, BarChart3, CheckSquare, Package } from 'lucide-react'
import type { Locale } from './landing-data'

const iconMap = {
  users: Users,
  handshake: Handshake,
  'git-branch': GitBranch,
  'bar-chart-3': BarChart3,
  'check-square': CheckSquare,
  package: Package,
} as const

interface FeaturesSectionProps {
  content: {
    sectionTitle: string;
    sectionSubtitle: string;
    description: string;
    items: readonly {
      title: string;
      description: string;
      icon: keyof typeof iconMap;
    }[];
  };
  locale: Locale;
}

export function FeaturesSection({ content, locale }: FeaturesSectionProps) {
  return (
    <section id="features" className="relative py-24 overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        {/* Section header - matching reference style */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight max-w-2xl" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
            {content.sectionTitle}. <span className="text-white/40">{content.sectionSubtitle}</span>
          </h2>
          <p className="text-base text-white/40 max-w-xl leading-relaxed mt-4">
            {content.description}
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {content.items.map((feature, index) => {
            const Icon = iconMap[feature.icon]
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group relative"
              >
                <div className="relative h-full p-5 rounded-2xl border border-[#00d4ff]/30 bg-[#00d4ff]/[0.03] hover:bg-[#00d4ff]/[0.06] hover:border-[#00d4ff]/50 transition-all duration-500">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-[#00d4ff]/10 text-[#00d4ff] flex items-center justify-center group-hover:bg-[#00d4ff]/15 transition-colors duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1.5">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-white/40 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
