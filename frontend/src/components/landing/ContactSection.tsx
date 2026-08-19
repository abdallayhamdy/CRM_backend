'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Send, Circle, Zap } from 'lucide-react'
import type { Locale } from './landing-data'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const STAR_COLORS = ["#FFFFFF", "#FFFFAA", "#AAAAFF", "#FFAAAA", "#AAFFAA", "#FFAAFF", "#AAFFFF"] as const;

function PixelStarsBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const backgroundStarsRef = useRef<{ x: number; y: number; color: string; opacity: number }[]>([]);

  const initStars = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.offsetWidth;
    canvas.height = parent.offsetHeight;
    backgroundStarsRef.current = [];
    const numStars = Math.floor((canvas.width * canvas.height) * 0.00004);
    for (let i = 0; i < numStars; i++) {
      backgroundStarsRef.current.push({
        x: Math.floor(Math.random() * (canvas.width / 3)) * 3,
        y: Math.floor(Math.random() * (canvas.height / 3)) * 3,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]!,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }
  }, []);

  const animate = useCallback((timestamp: number) => {
    if (!canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    backgroundStarsRef.current.forEach((star) => {
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.opacity * (0.6 + Math.sin(timestamp / 1500 + star.x) * 0.4);
      ctx.fillRect(star.x, star.y, 3, 3);
    });
    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    initStars();
    animationFrameRef.current = requestAnimationFrame(animate);
    const handleResize = () => initStars();
    window.addEventListener("resize", handleResize);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [initStars, animate]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

interface ContactSectionProps {
  content: {
    sectionTitle: string
    sectionSubtitle: string
    description: string
    pipeline: {
      company: string
      pipelineLabel: string
      stages: readonly { name: string; status: string }[]
      note: string
    }
    nextSteps: {
      title: string
      items: readonly {
        number: string
        title: string
        description: string
      }[]
    }
    form: {
      fullName: string
      fullNamePlaceholder: string
      phone: string
      phonePlaceholder: string
      email: string
      emailPlaceholder: string
      lookingFor: string
      lookingForPlaceholder: string
      lookingForOptions: readonly string[]
      companyName: string
      companyNamePlaceholder: string
      heardAbout: string
      heardAboutPlaceholder: string
      heardAboutOptions: readonly string[]
      goals: string
      goalsPlaceholder: string
      submit: string
      responseNote: string
    }
  }
  locale: Locale
}

const CARD = 'rounded-2xl border border-[#00d4ff]/30 bg-[#00d4ff]/[0.03] p-6'
const INPUT = 'w-full px-3 py-2.5 rounded-lg bg-[#00d4ff]/[0.03] border border-[#00d4ff]/30 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#00d4ff]/50 transition-all duration-300'

export function ContactSection({ content, locale }: ContactSectionProps) {
  const [lookingFor, setLookingFor] = useState('')
  const [heardAbout, setHeardAbout] = useState('')
  return (
    <section className="relative py-24 overflow-hidden">
      <PixelStarsBackground />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#00d4ff] mb-4">{content.sectionTitle}</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
            {content.sectionSubtitle}
          </h2>
          <p className="text-base text-white/40 max-w-xl leading-relaxed">{content.description}</p>
        </motion.div>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Pipeline + Next Steps */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Pipeline Card */}
            <div className={CARD}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#00d4ff]" />
                  </div>
                  <span className="text-sm font-semibold text-white">{content.pipeline.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-2 h-2 fill-[#22c55e] text-[#22c55e]" />
                  <span className="text-[10px] uppercase tracking-wider text-[#22c55e]">Active</span>
                </div>
              </div>

              <p className="text-[10px] uppercase tracking-[0.15em] text-white/30 mb-4">{content.pipeline.pipelineLabel}</p>

              <div className="space-y-3">
                {content.pipeline.stages.map((stage, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.3 + i * 0.08 }}
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#00d4ff]/[0.03] border border-[#00d4ff]/30"
                  >
                    <span className="text-sm text-white/70">{stage.name}</span>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                      stage.status === 'ACTIVE'
                        ? 'bg-[#22c55e]/10 text-[#22c55e]'
                        : 'bg-[#00d4ff]/10 text-[#00d4ff]'
                    }`}>
                      {stage.status}
                    </span>
                  </motion.div>
                ))}
              </div>

              <p className="text-xs text-white/30 text-center mt-4">{content.pipeline.note}</p>
            </div>

            {/* What Happens Next */}
            <div className={CARD}>
              <h3 className="text-lg font-bold text-white mb-6">{content.nextSteps.title}</h3>
              <div className="space-y-4">
                {content.nextSteps.items.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#00d4ff]/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#00d4ff]">{item.number}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
                      <p className="text-xs text-white/40 leading-relaxed">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <form className={`${CARD} space-y-5`}>
              {/* Row 1: Full Name + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-2">{content.form.fullName} *</label>
                  <input type="text" placeholder={content.form.fullNamePlaceholder} className={INPUT} />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-2">{content.form.phone} *</label>
                  <div className="flex min-w-0">
                    <div className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-l-lg bg-[#00d4ff]/[0.03] border border-r-0 border-[#00d4ff]/30 shrink-0">
                      <span className="text-base">🇪🇬</span>
                      <span className="text-[11px] text-white/40">+20</span>
                    </div>
                    <input type="tel" placeholder={content.form.phonePlaceholder} className={`${INPUT} flex-1 min-w-0 rounded-l-none`} />
                  </div>
                </div>
              </div>

              {/* Row 2: Email + Looking For */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-2">{content.form.email} *</label>
                  <input type="email" placeholder={content.form.emailPlaceholder} className={INPUT} />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-2">{content.form.lookingFor} *</label>
                  <Select value={lookingFor} onValueChange={setLookingFor}>
                    <SelectTrigger className={`${INPUT} appearance-none cursor-pointer`}>
                      <SelectValue placeholder={content.form.lookingForPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {content.form.lookingForOptions.map((opt, i) => (
                        <SelectItem key={i} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Company + Heard About */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-2">{content.form.companyName}</label>
                  <input type="text" placeholder={content.form.companyNamePlaceholder} className={INPUT} />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-2">{content.form.heardAbout}</label>
                  <Select value={heardAbout} onValueChange={setHeardAbout}>
                    <SelectTrigger className={`${INPUT} appearance-none cursor-pointer`}>
                      <SelectValue placeholder={content.form.heardAboutPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {content.form.heardAboutOptions.map((opt, i) => (
                        <SelectItem key={i} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Goals */}
              <div>
                <label className="block text-xs text-white/50 mb-2">{content.form.goals}</label>
                <textarea placeholder={content.form.goalsPlaceholder} rows={4} className={`${INPUT} resize-none`} />
              </div>

              {/* Submit */}
              <button type="button" className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#00d4ff] border border-[#00d4ff] text-black text-sm font-semibold rounded-lg hover:bg-[#00b8e6] transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(0,212,255,0.2)] hover:shadow-[0_0_30px_rgba(0,212,255,0.4)]">
                {content.form.submit}
                <Send className="w-4 h-4" />
              </button>

              {/* Note */}
              <p className="text-xs text-white/25 text-center">{content.form.responseNote}</p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
