'use client'

import { Globe } from 'lucide-react'
import type { Locale } from './landing-data'

interface LanguageToggleProps {
  locale: Locale;
  onToggle: () => void;
}

export function LanguageToggle({ locale, onToggle }: LanguageToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-white/50 hover:text-white transition-all duration-300 cursor-pointer"
    >
      <Globe className="w-4 h-4" />
      <span>{locale === 'ar' ? 'EN' : 'عربي'}</span>
    </button>
  )
}
