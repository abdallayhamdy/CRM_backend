'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const origError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('Encountered a script tag') || args[0].includes('Scripts inside React components are never executed'))
    ) {
      return;
    }
    origError.apply(console, args);
  };
}

export const THEMES = [
  { id: 'crimson', name: 'Crimson', color: '0 50% 40%', icon: '🔴' },
  { id: 'coral', name: 'Coral', color: '10 50% 40%', icon: '🪸' },
  { id: 'rust', name: 'Rust', color: '15 50% 40%', icon: '🍂' },
  { id: 'copper', name: 'Copper', color: '18 35% 40%', icon: '🥉' },
  { id: 'peach', name: 'Peach', color: '20 50% 40%', icon: '🍑' },
  { id: 'sunset', name: 'Sunset', color: '25 55% 40%', icon: '🌅' },
  { id: 'amber', name: 'Amber', color: '40 55% 40%', icon: '🟡' },
  { id: 'gold', name: 'Gold', color: '45 50% 40%', icon: '🏆' },
  { id: 'champagne', name: 'Champagne', color: '45 40% 40%', icon: '🥂' },
  { id: 'olive', name: 'Olive', color: '80 30% 40%', icon: '🫒' },
  { id: 'sage', name: 'Sage', color: '100 35% 40%', icon: '🌿' },
  { id: 'forest', name: 'Forest', color: '150 45% 40%', icon: '🌲' },
  { id: 'emerald', name: 'Emerald', color: '160 45% 40%', icon: '💚' },
  { id: 'mint', name: 'Mint', color: '165 45% 40%', icon: '🌿' },
  { id: 'teal', name: 'Teal', color: '175 50% 40%', icon: '🐋' },
  { id: 'sky', name: 'Sky', color: '195 55% 40%', icon: '☁️' },
  { id: 'ocean', name: 'Ocean', color: '210 55% 40%', icon: '🌊' },
  { id: 'slate', name: 'Slate', color: '210 10% 40%', icon: '⚫' },
  { id: 'storm', name: 'Storm', color: '215 40% 40%', icon: '⛈️' },
  { id: 'midnight', name: 'Midnight', color: '220 40% 40%', icon: '🌙' },
  { id: 'rootline', name: 'Rootline CRM', color: '225 45% 35%', icon: '🔷' },
  { id: 'cobalt', name: 'Cobalt', color: '230 50% 40%', icon: '💎' },
  { id: 'indigo', name: 'Indigo', color: '235 50% 40%', icon: '💎' },
  { id: 'lavender', name: 'Lavender', color: '260 45% 40%', icon: '💜' },
  { id: 'violet', name: 'Violet', color: '265 50% 40%', icon: '💜' },
  { id: 'purple', name: 'Purple', color: '270 45% 40%', icon: '💜' },
  { id: 'lilac', name: 'Lilac', color: '280 45% 40%', icon: '💐' },
  { id: 'magenta', name: 'Magenta', color: '310 50% 40%', icon: '🎀' },
  { id: 'rose', name: 'Rose', color: '340 45% 40%', icon: '🌸' },
  { id: 'burgundy', name: 'Burgundy', color: '345 45% 40%', icon: '🍷' },
  { id: 'blush', name: 'Blush', color: '350 50% 40%', icon: '💗' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

export function applyColorTheme(themeId: string) {
  localStorage.setItem('app-color-theme', themeId)
  document.documentElement.setAttribute('data-theme', themeId)
}

export function useColorTheme() {
  const [colorTheme, setColorTheme] = React.useState<string>(() => {
    if (typeof window === 'undefined') return 'rootline'
    return localStorage.getItem('app-color-theme') || 'rootline'
  })

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme)
  }, [colorTheme])

  return colorTheme
}

export function ThemeProvider({ 
  children, 
  ...props 
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      themes={['light', 'dark']}
      attribute="class"
      defaultTheme="light"
      storageKey="app-mode"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
