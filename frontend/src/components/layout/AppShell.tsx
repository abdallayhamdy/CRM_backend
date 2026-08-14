"use client"

import React from 'react'
import { useRouter, usePathname } from "next/navigation"
import { Sidebar, MobileSidebar } from "@/components/Sidebar"
import { TopNav } from "@/components/Topnav"
import { LAYOUT_CONSTANTS } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"
import { useSidebar } from "./SidebarContext"
import { useAuth } from "@/hooks/use-auth"
import { isImpersonating } from "@/lib/laravel-api"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isSuperAdmin, loading } = useAuth()
  const { isCollapsed } = useSidebar()
  const [isMobile, setIsMobile] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    const check = () => { setIsMobile(window.innerWidth < 768) }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const isFullScreenPage = pathname === '/' || pathname === '/about' || pathname === '/contact' || pathname?.match(/^\/(login|register|sign-in|sign-up|create-workspace|forgot-password|reset-password|auth-callback|accept-invite|super-admin|settings\/properties\/create|(companies|deals|products|orders|tickets)\/settings\/form|(companies|deals|tickets)\/[^\/]+\/settings|contacts\/[^\/]+\/settings(\/form)?|contacts\/settings(\/[^\/]+)?|contacts\/settings\/form)/)
  const [shouldRedirect, setShouldRedirect] = React.useState(false)

  React.useEffect(() => {
    if (isFullScreenPage) {
      return
    }

    if (!loading && isSuperAdmin && !isImpersonating()) {
      setShouldRedirect(true)
      router.replace('/super-admin')
    }
  }, [loading, isSuperAdmin, router, isFullScreenPage])

  if (isFullScreenPage) {
    return <>{children}</>
  }

  if (shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const sidebarWidth = isCollapsed ? 64 : LAYOUT_CONSTANTS.SIDEBAR_WIDTH

  return (
    <div className="h-screen bg-background relative flex flex-col">
      <TopNav onMobileMenuOpen={() => setMobileOpen(true)} />
      {isMobile && <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />}
      <Sidebar />

      <div
        style={{ paddingLeft: isMobile ? 0 : `${sidebarWidth}px` }}
        className="flex-1 flex flex-col min-h-0 transition-[padding-left] duration-200 ease-in-out"
      >
        {/* Spacer to push content below the fixed TopNav */}
        <div
          style={{ height: `${LAYOUT_CONSTANTS.TOPNAV_HEIGHT}px` }}
          className="shrink-0"
        />

        <main id="main-content" className={cn(
          "flex flex-col flex-1 h-full min-h-0 bg-background/80 relative overflow-hidden border-l border-border",
          "transition-[background-color] duration-500 ease-in-out",
          "m-0 p-0"
        )}>
          {children}
        </main>
      </div>
    </div>
  )
}
