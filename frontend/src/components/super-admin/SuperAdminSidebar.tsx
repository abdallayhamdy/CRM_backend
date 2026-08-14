"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  CreditCard,
  Users,
  BarChart3,
  HeartPulse,
  Shield,
  HeadphonesIcon,
  Settings2,
  X,
  Menu,
  ShieldCheck,
  LogOut,
  Search,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

const NAV_ITEMS = [
  {
    group: "Management",
    items: [
      { label: "Tenants", href: "/super-admin/tenants", icon: Building2 },
      { label: "Billing & Subscriptions", href: "/super-admin/billing", icon: CreditCard },
      { label: "Users", href: "/super-admin/users", icon: Users },
    ],
  },
  {
    group: "Monitoring",
    items: [
      { label: "Usage & Analytics", href: "/super-admin/usage", icon: BarChart3 },
      { label: "System Health", href: "/super-admin/health", icon: HeartPulse },
    ],
  },
  {
    group: "Administration",
    items: [
      { label: "Platform Owners", href: "/super-admin/platform-owners", icon: ShieldCheck },
      { label: "Security", href: "/super-admin/security", icon: Shield },
      { label: "Support", href: "/super-admin/support", icon: HeadphonesIcon },
      { label: "Settings", href: "/super-admin/settings", icon: Settings2 },
    ],
  },
]

export function SuperAdminSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const sidebarContent = (
    <div className="flex-none w-[260px] max-w-[85vw] h-full bg-background border-r border-border shadow-[var(--shadow-sidebar)] overflow-y-auto crm-scrollbar">
      <div className="p-5 bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Super Admin</h2>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search admin panel"
            className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-[13px] placeholder:text-muted-foreground transition-all"
          />
        </div>
      </div>

      <div className="pb-8">
        {NAV_ITEMS.map((group, idx) => (
          <div key={idx} className="mb-6">
            <div className="px-5 py-2 font-bold text-foreground text-[11px] uppercase tracking-wider opacity-60">
              {group.group}
            </div>
            <div className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 py-2 px-3 rounded-md text-[13px] transition-all group ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-muted-foreground"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-background border-t border-border p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-foreground truncate">
              {user?.email}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 left-4 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Open admin menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden lg:block">{sidebarContent}</div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  )
}
