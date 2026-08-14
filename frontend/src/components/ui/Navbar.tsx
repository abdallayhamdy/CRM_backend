'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Users, Handshake, GitBranch, BarChart3, CheckSquare, Package, Settings, Upload, GraduationCap, Target, Eye, Heart } from 'lucide-react'
import { LanguageToggle } from '../landing/LanguageToggle'

type Position = { left: number; width: number; opacity: number }

export type NavItem = {
  id: number
  label: string
  link?: string
  subMenus?: {
    title: string
    items: { label: string; description: string; icon: React.ElementType }[]
  }[]
}

const NAV_ITEMS_AR: NavItem[] = [
  { id: 0, label: 'الرئيسية', link: '/' },
  {
    id: 1,
    label: 'المنتجات',
    subMenus: [
      {
        title: 'إدارة العلاقات',
        items: [
          { label: 'إدارة جهات الاتصال', description: 'تنظيم جميع بيانات العملاء في مكان واحد', icon: Users },
          { label: 'إدارة الصفقات', description: 'تتبع الصفقات من التأهيل إلى الإغلاق', icon: Handshake },
          { label: 'عرض pipeline', description: 'إنشاء خطوط أنابيب مخصصة لتتبع كل صفقة', icon: GitBranch },
        ],
      },
      {
        title: 'الأدوات',
        items: [
          { label: 'التقارير والتحليلات', description: 'رؤى عميقة حول أدائك مع تقارير قابلة للتخصيص', icon: BarChart3 },
          { label: 'إدارة المهام', description: 'نظّم مهامك وتذكيراتك وتتبع تقدم فريقك', icon: CheckSquare },
          { label: 'إدارة الطلبات', description: 'تتبع الطلبات من الاستلام إلى التسليم', icon: Package },
        ],
      },
    ],
  },
  {
    id: 2,
    label: 'الخدمات',
    subMenus: [
      {
        title: 'الإعداد',
        items: [
          { label: 'إعداد النظام', description: 'تخصيص Rootline CRM لاحتياجات عملك', icon: Settings },
          { label: 'استيراد البيانات', description: 'نقل بيانات عملائك بأمان من Excel أو أي نظام آخر', icon: Upload },
          { label: 'تدريب الفريق', description: 'جلسات تدريب شاملة لضمان استخدام الفريق للنظام بكفاءة', icon: GraduationCap },
        ],
      },
    ],
  },
  { id: 5, label: 'عن المنصة', link: '/about' },
  { id: 6, label: 'التسعير', link: '/pricing' },
  { id: 4, label: 'تواصل معنا', link: '/contact' },
]

const NAV_ITEMS_EN: NavItem[] = [
  { id: 0, label: 'Home', link: '/' },
  {
    id: 1,
    label: 'Products',
    subMenus: [
      {
        title: 'CRM',
        items: [
          { label: 'Contact Management', description: 'Organize all customer data in one place', icon: Users },
          { label: 'Deal Management', description: 'Track deals from qualification to closing', icon: Handshake },
          { label: 'Pipeline Views', description: 'Create custom pipelines to track deals', icon: GitBranch },
        ],
      },
      {
        title: 'Tools',
        items: [
          { label: 'Reports & Analytics', description: 'Deep insights with customizable reports', icon: BarChart3 },
          { label: 'Task Management', description: 'Organize tasks and track team progress', icon: CheckSquare },
          { label: 'Order Management', description: 'Track orders from receipt to delivery', icon: Package },
        ],
      },
    ],
  },
  {
    id: 2,
    label: 'Services',
    subMenus: [
      {
        title: 'Setup',
        items: [
          { label: 'System Setup', description: 'Customize Rootline CRM for your business', icon: Settings },
          { label: 'Data Import', description: 'Migrate data from Excel or other systems', icon: Upload },
          { label: 'Team Training', description: 'Comprehensive training for your team', icon: GraduationCap },
        ],
      },
    ],
  },
  { id: 5, label: 'About', link: '/about' },
  { id: 6, label: 'Pricing', link: '/pricing' },
  { id: 4, label: 'Contact', link: '/contact' },
]

export function Navbar({ locale, onToggleLocale, ctaText }: { locale: 'ar' | 'en'; onToggleLocale: () => void; ctaText: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const NAV_ITEMS = locale === 'ar' ? NAV_ITEMS_AR : NAV_ITEMS_EN

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 px-4 h-14 rounded-full bg-[#0a0a0f]/50 backdrop-blur-md border border-[#00d4ff]/20">
          <Image src="/logo-vector-white-2.png" alt="Rootline CRM" width={64} height={64} className="h-12 w-auto" />
          <span className="text-lg font-bold text-white hidden sm:block" style={{ fontFamily: 'var(--font-lexend), var(--font-sans)' }}>
            Rootline CRM
          </span>
        </Link>

        <div className="hidden md:flex flex-1 justify-center">
          <NavTabs items={NAV_ITEMS} locale={locale} onToggleLocale={onToggleLocale} ctaText={ctaText} />
        </div>

        <div className="hidden md:block w-[180px] shrink-0" />

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white/60 hover:text-white ml-auto"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#00d4ff]/30 bg-[#0a0a0f]/95 backdrop-blur-xl">
          <div className="px-6 py-4 space-y-3">
            {NAV_ITEMS.map((item) =>
              item.link ? (
                <Link key={item.id} href={item.link} className="block text-sm text-white/60 hover:text-white transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                  {item.label}
                </Link>
              ) : (
                <div key={item.id}>
                  <p className="text-sm text-white/80 font-medium py-2">{item.label}</p>
                  {item.subMenus?.map((sub) => (
                    <div key={sub.title} className="pl-4 space-y-2">
                      <p className="text-xs text-white/40 uppercase tracking-wider">{sub.title}</p>
                      {sub.items.map((subItem) => (
                        <Link key={subItem.label} href="#" className="block text-sm text-white/50 hover:text-white transition-colors py-1" onClick={() => setMobileMenuOpen(false)}>
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )
            )}
            <LanguageToggle locale={locale} onToggle={onToggleLocale} />
            <Link href="/login" className="block w-full px-5 py-2 bg-[#00d4ff] text-black text-sm font-semibold rounded-lg text-center" onClick={() => setMobileMenuOpen(false)}>
              {ctaText}
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

function NavTabs({ items, locale, onToggleLocale, ctaText }: { items: NavItem[]; locale: 'ar' | 'en'; onToggleLocale: () => void; ctaText: string }) {
  const [position, setPosition] = useState<Position>({ left: 0, width: 0, opacity: 0 })
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  return (
    <ul
      className="relative mx-auto flex w-fit items-center rounded-full border border-[#00d4ff]/20 bg-[#0a0a0f]/50 backdrop-blur-md p-1"
      onMouseLeave={() => {
        setPosition((pv) => ({ ...pv, opacity: 0 }))
        setOpenMenu(null)
      }}
    >
      {items.map((item) => (
        <NavTabItem
          key={item.id}
          item={item}
          setPosition={setPosition}
          isOpen={openMenu === item.label}
          onToggle={() => setOpenMenu(openMenu === item.label ? null : item.label)}
        />
      ))}

      <li className="relative z-10 flex items-center px-2">
        <LanguageToggle locale={locale} onToggle={onToggleLocale} />
      </li>

      <li className="relative z-10">
        <Link
          href="/login"
          className="px-5 py-2 bg-[#00d4ff] text-black text-sm font-semibold rounded-full hover:bg-[#00b8e6] transition-all duration-300"
        >
          {ctaText}
        </Link>
      </li>

      <Cursor position={position} />

      <AnimatePresence>
        {items.map((item) =>
          item.subMenus && openMenu === item.label ? (
            <div key={item.id} className="absolute left-0 top-full w-auto pt-2 z-10">
              <motion.div
                className="w-max border border-[#00d4ff]/30 bg-[#0a0a0f] p-4"
                style={{ borderRadius: 16 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex w-fit shrink-0 space-x-9 overflow-hidden">
                  {item.subMenus.map((sub) => (
                    <div className="w-full" key={sub.title}>
                      <h3 className="mb-4 text-sm font-medium capitalize text-white/50">{sub.title}</h3>
                      <ul className="space-y-6">
                        {sub.items.map((subItem) => {
                          const Icon = subItem.icon
                          return (
                            <li key={subItem.label}>
                              <a href="#" className="flex items-start space-x-3 group">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-[#00d4ff]/30 text-white transition-colors duration-300 group-hover:bg-[#00d4ff] group-hover:text-black">
                                  <Icon className="h-5 w-5 flex-none" />
                                </div>
                                <div className="w-max leading-5">
                                  <p className="shrink-0 text-sm font-medium text-white">{subItem.label}</p>
                                  <p className="shrink-0 text-xs text-white/50 transition-colors duration-300 group-hover:text-white">{subItem.description}</p>
                                </div>
                              </a>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : null
        )}
      </AnimatePresence>
    </ul>
  )
}

function NavTabItem({
  item,
  setPosition,
  isOpen,
  onToggle,
}: {
  item: NavItem
  setPosition: (pos: Position) => void
  isOpen: boolean
  onToggle: () => void
}) {
  const ref = useRef<HTMLLIElement>(null)

  const handleClick = () => {
    if (item.link) {
      window.location.href = item.link
    } else {
      onToggle()
    }
  }

  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref.current) return
        const { width } = ref.current.getBoundingClientRect()
        setPosition({ width, opacity: 1, left: ref.current.offsetLeft })
      }}
      onClick={handleClick}
      className="relative z-10 flex items-center gap-1 cursor-pointer px-4 py-2 text-sm text-white/50 transition-colors duration-300 hover:text-white md:px-5 md:py-2.5"
    >
      <span>{item.label}</span>
      {item.subMenus && (
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      )}
    </li>
  )
}

function Cursor({ position }: { position: Position }) {
  return (
    <motion.li
      animate={position}
      className="absolute z-0 h-9 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20 md:h-10"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    />
  )
}
