'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Users, GitBranch, BarChart3, CheckSquare, Settings, Workflow } from 'lucide-react'
import type { Locale } from './about-data'

const nodeIcons = [Users, GitBranch, CheckSquare, BarChart3, Workflow, Settings]

interface SystemSectionProps {
  content: {
    sectionTitle: string
    title: string
    highlight: string
    description: string
    subDescription: string
    cta: string
    nodes: readonly string[]
    features: readonly { title: string; description: string }[]
    footer: string
  }
  locale: Locale
}

export function SystemSection({ content, locale }: SystemSectionProps) {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#00d4ff] mb-4">{content.sectionTitle}</p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
              {content.title}{' '}
              <span className="text-[#00d4ff]">{content.highlight}</span>
            </h2>
            <p className="text-sm text-white/40 leading-relaxed mb-4">{content.description}</p>
            <p className="text-sm text-white/40 leading-relaxed mb-8">{content.subDescription}</p>
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#00d4ff] text-black text-sm font-semibold rounded-xl hover:bg-[#00b8e6] hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all duration-300"
            >
              {content.cta} →
            </a>
          </motion.div>

          {/* Right: Diagram */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative w-[380px] h-[380px]">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border border-[#00d4ff]/30" />

              {/* Middle ring */}
              <div className="absolute inset-[60px] rounded-full border border-[#00d4ff]/20" />

              {/* Center circle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-gradient-to-br from-[#00d4ff]/15 to-[#00d4ff]/5 border border-[#00d4ff]/30 flex items-center justify-center z-10 shadow-[0_0_40px_rgba(0,212,255,0.15)]">
                <div className="text-center">
                  <Zap className="w-7 h-7 text-[#00d4ff] mx-auto mb-1" />
                  <span className="text-[11px] font-bold text-[#00d4ff] block">Rootline CRM</span>
                  <span className="text-[9px] text-white/40">OS</span>
                </div>
              </div>

              {/* Nodes - positioned manually for perfect placement */}
              {/* Top */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-[#0a0a0f] border border-[#00d4ff]/30 flex items-center justify-center hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/[0.05] transition-all duration-300">
                  {React.createElement(nodeIcons[0], { className: 'w-5 h-5 text-white/60' })}
                </div>
                <span className="text-[10px] text-white/40">{content.nodes[0]}</span>
              </motion.div>

              {/* Top Right */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.38 }}
                className="absolute top-[52px] right-[18px] flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-[#0a0a0f] border border-[#00d4ff]/30 flex items-center justify-center hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/[0.05] transition-all duration-300">
                  {React.createElement(nodeIcons[1], { className: 'w-5 h-5 text-white/60' })}
                </div>
                <span className="text-[10px] text-white/40">{content.nodes[1]}</span>
              </motion.div>

              {/* Bottom Right */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.46 }}
                className="absolute bottom-[52px] right-[18px] flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-[#0a0a0f] border border-[#00d4ff]/30 flex items-center justify-center hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/[0.05] transition-all duration-300">
                  {React.createElement(nodeIcons[2], { className: 'w-5 h-5 text-white/60' })}
                </div>
                <span className="text-[10px] text-white/40">{content.nodes[2]}</span>
              </motion.div>

              {/* Bottom */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.54 }}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-[#0a0a0f] border border-[#00d4ff]/30 flex items-center justify-center hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/[0.05] transition-all duration-300">
                  {React.createElement(nodeIcons[3], { className: 'w-5 h-5 text-white/60' })}
                </div>
                <span className="text-[10px] text-white/40">{content.nodes[3]}</span>
              </motion.div>

              {/* Bottom Left */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.62 }}
                className="absolute bottom-[52px] left-[18px] flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-[#0a0a0f] border border-[#00d4ff]/30 flex items-center justify-center hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/[0.05] transition-all duration-300">
                  {React.createElement(nodeIcons[4], { className: 'w-5 h-5 text-white/60' })}
                </div>
                <span className="text-[10px] text-white/40">{content.nodes[4]}</span>
              </motion.div>

              {/* Top Left */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="absolute top-[52px] left-[18px] flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-[#0a0a0f] border border-[#00d4ff]/30 flex items-center justify-center hover:border-[#00d4ff]/30 hover:bg-[#00d4ff]/[0.05] transition-all duration-300">
                  {React.createElement(nodeIcons[5], { className: 'w-5 h-5 text-white/60' })}
                </div>
                <span className="text-[10px] text-white/40">{content.nodes[5]}</span>
              </motion.div>

              {/* Connection lines (SVG) */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 380 380">
                {/* Static lines */}
                <line x1="190" y1="190" x2="190" y2="60" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <line x1="190" y1="190" x2="310" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <line x1="190" y1="190" x2="310" y2="280" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <line x1="190" y1="190" x2="190" y2="320" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <line x1="190" y1="190" x2="70" y2="280" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <line x1="190" y1="190" x2="70" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

                {/* Animated paths (hidden, used for motion) - reversed direction */}
                <path id="path-top" d="M190,60 L190,190" fill="none" />
                <path id="path-topright" d="M310,100 L190,190" fill="none" />
                <path id="path-bottomright" d="M310,280 L190,190" fill="none" />
                <path id="path-bottom" d="M190,320 L190,190" fill="none" />
                <path id="path-bottomleft" d="M70,280 L190,190" fill="none" />
                <path id="path-topleft" d="M70,100 L190,190" fill="none" />

                {/* Animated dots - outward */}
                <circle r="3" fill="#00d4ff" opacity="0.8">
                  <animateMotion dur="2s" repeatCount="indefinite" begin="0s">
                    <mpath href="#path-top" />
                  </animateMotion>
                </circle>
                <circle r="3" fill="#00d4ff" opacity="0.8">
                  <animateMotion dur="2s" repeatCount="indefinite" begin="0.3s">
                    <mpath href="#path-topright" />
                  </animateMotion>
                </circle>
                <circle r="3" fill="#00d4ff" opacity="0.8">
                  <animateMotion dur="2s" repeatCount="indefinite" begin="0.6s">
                    <mpath href="#path-bottomright" />
                  </animateMotion>
                </circle>
                <circle r="3" fill="#00d4ff" opacity="0.8">
                  <animateMotion dur="2s" repeatCount="indefinite" begin="0.9s">
                    <mpath href="#path-bottom" />
                  </animateMotion>
                </circle>
                <circle r="3" fill="#00d4ff" opacity="0.8">
                  <animateMotion dur="2s" repeatCount="indefinite" begin="1.2s">
                    <mpath href="#path-bottomleft" />
                  </animateMotion>
                </circle>
                <circle r="3" fill="#00d4ff" opacity="0.8">
                  <animateMotion dur="2s" repeatCount="indefinite" begin="1.5s">
                    <mpath href="#path-topleft" />
                  </animateMotion>
                </circle>

                {/* Animated dots - inward (return) */}
                <circle r="2" fill="#00d4ff" opacity="0.5">
                  <animateMotion dur="2.5s" repeatCount="indefinite" begin="1s">
                    <mpath href="#path-top" />
                  </animateMotion>
                </circle>
                <circle r="2" fill="#00d4ff" opacity="0.5">
                  <animateMotion dur="2.5s" repeatCount="indefinite" begin="1.3s">
                    <mpath href="#path-topright" />
                  </animateMotion>
                </circle>
                <circle r="2" fill="#00d4ff" opacity="0.5">
                  <animateMotion dur="2.5s" repeatCount="indefinite" begin="1.6s">
                    <mpath href="#path-bottomright" />
                  </animateMotion>
                </circle>
                <circle r="2" fill="#00d4ff" opacity="0.5">
                  <animateMotion dur="2.5s" repeatCount="indefinite" begin="1.9s">
                    <mpath href="#path-bottom" />
                  </animateMotion>
                </circle>
                <circle r="2" fill="#00d4ff" opacity="0.5">
                  <animateMotion dur="2.5s" repeatCount="indefinite" begin="2.2s">
                    <mpath href="#path-bottomleft" />
                  </animateMotion>
                </circle>
                <circle r="2" fill="#00d4ff" opacity="0.5">
                  <animateMotion dur="2.5s" repeatCount="indefinite" begin="2.5s">
                    <mpath href="#path-topleft" />
                  </animateMotion>
                </circle>
              </svg>

              {/* Mini chart - top right */}
              <div className="absolute -top-2 -right-2 px-3 py-2 rounded-lg bg-[#00d4ff]/[0.03] border border-[#00d4ff]/30">
                <div className="flex items-end gap-1 h-5">
                  {[3, 5, 4, 6, 5, 7, 6].map((h, i) => (
                    <div key={i} className="w-1 bg-[#00d4ff]/40 rounded-t" style={{ height: `${h * 2}px` }} />
                  ))}
                </div>
              </div>

              {/* Mini chart - bottom left */}
              <div className="absolute -bottom-2 -left-2 px-3 py-2 rounded-lg bg-[#00d4ff]/[0.03] border border-[#00d4ff]/30">
                <div className="flex items-end gap-1 h-5">
                  {[4, 3, 5, 4, 6, 5, 7].map((h, i) => (
                    <div key={i} className="w-1 bg-[#22c55e]/40 rounded-t" style={{ height: `${h * 2}px` }} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-12"
        >
          {content.features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.06 }}
              className="flex items-start gap-3 p-4 rounded-2xl border border-[#00d4ff]/30 bg-[#00d4ff]/[0.03] hover:bg-[#00d4ff]/[0.06] hover:border-[#00d4ff]/50 transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">{feature.title}</h4>
                <p className="text-xs text-white/40 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 p-6 rounded-2xl border border-[#00d4ff]/30 bg-[#00d4ff]/[0.03] text-center"
        >
          <p className="text-sm text-white/50 leading-relaxed">
            {content.footer.split('.').map((part, i, arr) => {
              if (i === arr.length - 1 && part.trim()) {
                return <span key={i} className="text-[#00d4ff] font-semibold">{part}</span>
              }
              return <span key={i}>{part}{i < arr.length - 1 ? '.' : ''}</span>
            })}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
