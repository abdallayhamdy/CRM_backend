'use client'

import { useCallback, useState, useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import Link from 'next/link'
import Footer4Col from '@/components/ui/footer-column'
import { Navbar } from '@/components/ui/Navbar'

type Locale = 'ar' | 'en'

const LOCALE_STORAGE_KEY = 'landing-locale'

function readStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null
  const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY)
  return saved === 'ar' || saved === 'en' ? saved : null
}

function subscribeLocale() {
  return () => {}
}

const pricingContent = {
  ar: {
    hero: {
      badge: 'تسعير بسيط وشفاف',
      title: 'خطط تناسب كل فريق',
      subtitle: 'ابدأ مجاناً وترقّي حسب نموّك. لا رسوم مخفية، لا عقود معقدة.',
    },
    tiers: [
      {
        name: 'Starter',
        nameAr: 'الأساسية',
        description: 'للفرق الصغيرة التي تبدأ رحلة إدارة العلاقات',
        descriptionAr: 'للفرق الصغيرة التي تبدأ رحلة إدارة العلاقات',
        features: [
          'إدارة حتى 500 جهة اتصال',
          'صفحة عرض pipeline واحدة',
          'تقارير أساسية',
          'دعم عبر البريد الإلكتروني',
        ],
        cta: 'ابدأ مجاناً',
      },
      {
        name: 'Growth',
        nameAr: 'النمو',
        description: 'للفرق المتنامية التي تحتاج أدوات متقدمة',
        descriptionAr: 'للفرق المتنامية التي تحتاج أدوات متقدمة',
        features: [
          'جهات اتصال غير محدودة',
          'pipelines متعددة',
          'تقارير وتحليلات متقدمة',
          'أتمتة المهام',
          'دعم أولوية',
        ],
        cta: 'تواصل مع المبيعات',
        featured: true,
      },
      {
        name: 'Enterprise',
        nameAr: 'المؤسسات',
        description: 'للشركات الكبيرة مع احتياجات مخصصة',
        descriptionAr: 'للشركات الكبيرة مع احتياجات مخصصة',
        features: [
          'كل مميزات Growth',
          'تخصيص كامل للنظام',
          'تكاملات API',
          'مدير حساب مخصص',
          'دعم على مدار الساعة',
        ],
        cta: 'تواصل مع المبيعات',
      },
    ],
    cta: {
      title: 'هل تحتاج خطة مخصصة؟',
      subtitle: 'فريقنا جاهز لتصميم حل يناسب احتياجات شركتك بالضبط.',
      button: 'احجز عرضاً تجريبياً',
    },
  },
  en: {
    hero: {
      badge: 'Simple, transparent pricing',
      title: 'Plans that grow with you',
      subtitle: 'Start free, upgrade as you scale. No hidden fees, no long-term contracts.',
    },
    tiers: [
      {
        name: 'Starter',
        nameAr: 'Starter',
        description: 'For small teams getting started with CRM',
        descriptionAr: 'For small teams getting started with CRM',
        features: [
          'Up to 500 contacts',
          'Single pipeline view',
          'Basic reports',
          'Email support',
        ],
        cta: 'Start Free',
      },
      {
        name: 'Growth',
        nameAr: 'Growth',
        description: 'For growing teams that need advanced tools',
        descriptionAr: 'For growing teams that need advanced tools',
        features: [
          'Unlimited contacts',
          'Multiple pipelines',
          'Advanced reports & analytics',
          'Task automation',
          'Priority support',
        ],
        cta: 'Contact Sales',
        featured: true,
      },
      {
        name: 'Enterprise',
        nameAr: 'Enterprise',
        description: 'For large companies with custom needs',
        descriptionAr: 'For large companies with custom needs',
        features: [
          'Everything in Growth',
          'Full system customization',
          'API integrations',
          'Dedicated account manager',
          '24/7 support',
        ],
        cta: 'Contact Sales',
      },
    ],
    cta: {
      title: 'Need a custom plan?',
      subtitle: 'Our team is ready to design a solution that fits your business perfectly.',
      button: 'Book a Demo',
    },
  },
}

export default function PricingPage() {
  const storedLocale = useSyncExternalStore(subscribeLocale, readStoredLocale, () => null)
  const [localeOverride, setLocaleOverride] = useState<Locale | null>(null)
  const locale = localeOverride ?? storedLocale ?? 'en'
  const isAr = locale === 'ar'

  const toggleLocale = useCallback(() => {
    const next = locale === 'ar' ? 'en' : 'ar'
    setLocaleOverride(next)
    localStorage.setItem(LOCALE_STORAGE_KEY, next)
  }, [locale])

  const content = pricingContent[locale]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" dir={isAr ? 'rtl' : 'ltr'}>
      <Navbar locale={locale} onToggleLocale={toggleLocale} ctaText={isAr ? 'ابدأ الآن' : 'Get Started'} />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00d4ff]/[0.03] to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff] text-xs font-medium mb-6"
          >
            {content.hero.badge}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}
          >
            {content.hero.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg text-white/60 max-w-2xl mx-auto"
          >
            {content.hero.subtitle}
          </motion.p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {content.tiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  tier.featured
                    ? 'border-[#00d4ff]/50 bg-[#00d4ff]/[0.05]'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#00d4ff] text-black text-xs font-bold rounded-full">
                    {isAr ? 'الأكثر شيوعاً' : 'Most Popular'}
                  </div>
                )}
                <h3 className="text-xl font-bold">{isAr ? tier.nameAr : tier.name}</h3>
                <p className="mt-2 text-sm text-white/50">{isAr ? tier.descriptionAr : tier.description}</p>

                {/* PLACEHOLDER COPY — replace with real price before launch */}
                <div className="mt-6 mb-6">
                  <span className="text-3xl font-bold text-white/30">
                    {isAr ? 'تواصل مع المبيعات' : 'Contact Sales'}
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-white/70">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-[#00d4ff]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/contact"
                  className={`block w-full py-3 rounded-lg text-center text-sm font-semibold transition-all duration-300 ${
                    tier.featured
                      ? 'bg-[#00d4ff] text-black hover:bg-[#00b8e6]'
                      : 'border border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  {tier.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-[#00d4ff]/20 bg-[#00d4ff]/[0.03] p-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold">{content.cta.title}</h2>
            <p className="mt-4 text-white/60 max-w-xl mx-auto">{content.cta.subtitle}</p>
            <Link
              href="/contact"
              className="inline-block mt-8 px-8 py-3 bg-[#00d4ff] text-black font-semibold rounded-lg hover:bg-[#00b8e6] transition-all duration-300"
            >
              {content.cta.button}
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer4Col locale={locale} />
    </div>
  )
}
