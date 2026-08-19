'use client'

import { useState, useEffect } from 'react'
import Footer4Col from './footer-column'
import { landingContent, type Locale } from './landing-data'
import { HeroSection } from './HeroSection'

import { FeaturesSection } from './FeaturesSection'
import { ServicesSection } from './ServicesSection'
import { HowWeWorkSection } from './HowWeWorkSection'
import { HowItWorksSection } from './HowItWorksSection'
import { FAQSection } from './FAQSection'
import { ContactSection } from './ContactSection'
import { CTASection } from './CTASection'
import { ProductPreviewSection } from './ProductPreviewSection'
import { Navbar } from './Navbar'

export function LandingPage() {
  const [locale, setLocale] = useState<Locale>('ar')

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

  const content = landingContent[locale]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Navbar locale={locale} onToggleLocale={toggleLocale} ctaText={content.nav.cta} />

      {/* Sections */}
      <HeroSection content={content.hero} locale={locale} />
      <ProductPreviewSection content={content.productPreview} locale={locale} />

      <FeaturesSection content={content.features} locale={locale} />
      <ServicesSection content={content.services} locale={locale} />
      <HowWeWorkSection content={content.howWeWork} locale={locale} />
      <HowItWorksSection content={content.howItWorks} locale={locale} />
      <FAQSection content={content.faq} locale={locale} />
      <ContactSection content={content.contact} locale={locale} />
      <CTASection content={content.cta} locale={locale} />

      {/* Footer */}
      <Footer4Col locale={locale} />
    </div>
  )
}
