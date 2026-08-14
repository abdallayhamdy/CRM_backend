"use client"

import { useEffect } from "react"

/**
 * Restores saved appearance settings from localStorage on every page load.
 * This ensures theme changes apply across the entire app, not just the appearance page.
 */
const DEFAULT_APPEARANCE = {
  style: "nova", baseColor: "taupe",
  chartColor1: "blue", chartColor2: "emerald", chartColor3: "violet",
  chartColor4: "amber", chartColor5: "rose", radius: "medium",
  headingFont: "inter", bodyFont: "inter"
}

export function ThemeInitializer(): null {
  useEffect(() => {
    let saved = localStorage.getItem("app-appearance")
    if (!saved) {
      localStorage.setItem("app-appearance", JSON.stringify(DEFAULT_APPEARANCE))
      saved = JSON.stringify(DEFAULT_APPEARANCE)
    }
    const el = document.documentElement
    const parsed = JSON.parse(saved)
    el.setAttribute("data-style", parsed.style || DEFAULT_APPEARANCE.style)
    el.setAttribute("data-base", parsed.baseColor || DEFAULT_APPEARANCE.baseColor)
    el.setAttribute("data-chart-1", parsed.chartColor1 || DEFAULT_APPEARANCE.chartColor1)
    el.setAttribute("data-chart-2", parsed.chartColor2 || DEFAULT_APPEARANCE.chartColor2)
    el.setAttribute("data-chart-3", parsed.chartColor3 || DEFAULT_APPEARANCE.chartColor3)
    el.setAttribute("data-chart-4", parsed.chartColor4 || DEFAULT_APPEARANCE.chartColor4)
    el.setAttribute("data-chart-5", parsed.chartColor5 || DEFAULT_APPEARANCE.chartColor5)
    el.setAttribute("data-radius", parsed.radius || DEFAULT_APPEARANCE.radius)
    el.setAttribute("data-heading-font", parsed.headingFont || DEFAULT_APPEARANCE.headingFont)
    el.setAttribute("data-body-font", parsed.bodyFont || DEFAULT_APPEARANCE.bodyFont)

    const savedColorTheme = localStorage.getItem("app-color-theme") || "rootline"
    const path = window.location.pathname
    const isExempt = ["/", "/login", "/register", "/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/auth-callback"].includes(path)
    document.documentElement.setAttribute("data-theme", isExempt ? "none" : savedColorTheme)
  }, [])

  return null
}
