'use client'

import { motion } from 'framer-motion'
import {
  Settings,
  Upload,
  GraduationCap,
  Users,
  Handshake,
  GitBranch,
  Zap,
  Bell,
  Mail,
  BarChart3,
  TrendingUp,
  Target,
} from 'lucide-react'
import type { Locale } from './landing-data'

const iconMap = {
  settings: Settings,
  upload: Upload,
  'graduation-cap': GraduationCap,
  users: Users,
  handshake: Handshake,
  'git-branch': GitBranch,
  zap: Zap,
  bell: Bell,
  mail: Mail,
  'bar-chart-3': BarChart3,
  'trending-up': TrendingUp,
  target: Target,
} as const

interface ServicesSectionProps {
  content: {
    sectionTitle: string;
    sectionSubtitle: string;
    description: string;
    groups: readonly {
      number: string;
      title: string;
      subtitle: string;
      items: readonly {
        title: string;
        description: string;
        icon: keyof typeof iconMap;
      }[];
    }[];
  };
  locale: Locale;
}

export function ServicesSection({ content, locale }: ServicesSectionProps) {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Divider */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-20"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#00d4ff] mb-4">
            {content.sectionTitle}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
              {content.sectionSubtitle}
            </h2>
            <p className="text-base text-white/40 leading-relaxed lg:pt-2">
              {content.description}
            </p>
          </div>
        </motion.div>

        {/* Service groups */}
        <div className="space-y-16">
          {content.groups.map((group, groupIndex) => (
            <motion.div
              key={group.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: groupIndex * 0.1 }}
            >
              {/* Group header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="shrink-0 w-10 h-10 rounded-full border border-[#00d4ff]/40 bg-[#00d4ff]/5 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#00d4ff]">{group.number}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{group.title}</h3>
                  <p className="text-sm text-white/40">{group.subtitle}</p>
                </div>
              </div>

              {/* Items grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-14">
                {group.items.map((item, itemIndex) => {
                  const Icon = iconMap[item.icon]
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: itemIndex * 0.08 }}
                      className="group p-5 rounded-2xl border border-[#00d4ff]/30 bg-[#00d4ff]/[0.03] hover:bg-[#00d4ff]/[0.06] hover:border-[#00d4ff]/50 transition-all duration-500"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/10 text-[#00d4ff] flex items-center justify-center mb-4 group-hover:bg-[#00d4ff]/15 transition-colors duration-300">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-2">{item.title}</h4>
                      <p className="text-xs text-white/40 leading-relaxed">{item.description}</p>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
