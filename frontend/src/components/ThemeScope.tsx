"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const EXEMPT_PATHS = ["/", "/login", "/register", "/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/auth-callback"]

export function ThemeScope() {
  const pathname = usePathname()

  useEffect(() => {
    const exempt = EXEMPT_PATHS.includes(pathname)
    if (exempt) {
      document.documentElement.setAttribute("data-theme", "none")
    } else {
      const savedColorTheme = localStorage.getItem("app-color-theme") || "rootline"
      document.documentElement.setAttribute("data-theme", savedColorTheme)
    }
  }, [pathname])

  return null
}
