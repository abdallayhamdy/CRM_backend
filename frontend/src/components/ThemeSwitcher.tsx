"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { THEMES, type ThemeId, applyColorTheme } from "@/components/ThemeProvider"
import { Sun, Moon, Monitor, Palette } from "lucide-react"
import { CHART_COLORS, RADII, THEME_COLOR_MAP, type Style, type BaseColor, type ChartColor, type Radius } from "./theme-switcher-constants"
import { DropdownMenu, DropdownItem, SettingCard, ModeButton } from "./theme-switcher-ui"
import { ChartColorSetting } from "./ChartColorSetting"

function applyAttributes(values: {
  style?: Style
  baseColor?: BaseColor
  chartColor1?: ChartColor
  chartColor2?: ChartColor
  chartColor3?: ChartColor
  chartColor4?: ChartColor
  chartColor5?: ChartColor
  radius?: Radius
}, fallbacks: { style: Style; baseColor: BaseColor; chartColor1: ChartColor; chartColor2: ChartColor; chartColor3: ChartColor; chartColor4: ChartColor; chartColor5: ChartColor; radius: Radius }) {
  const el = document.documentElement
  if (values.style)        el.setAttribute("data-style", values.style)
  if (values.baseColor)    el.setAttribute("data-base", values.baseColor)
  if (values.chartColor1)  el.setAttribute("data-chart-1", values.chartColor1)
  if (values.chartColor2)  el.setAttribute("data-chart-2", values.chartColor2)
  if (values.chartColor3)  el.setAttribute("data-chart-3", values.chartColor3)
  if (values.chartColor4)  el.setAttribute("data-chart-4", values.chartColor4)
  if (values.chartColor5)  el.setAttribute("data-chart-5", values.chartColor5)
  if (values.radius)       el.setAttribute("data-radius", values.radius)
  el.setAttribute("data-heading-font", "inter")
  el.setAttribute("data-body-font", "inter")

  localStorage.setItem("app-appearance", JSON.stringify({
    style: values.style || fallbacks.style,
    baseColor: values.baseColor || fallbacks.baseColor,
    chartColor1: values.chartColor1 || fallbacks.chartColor1,
    chartColor2: values.chartColor2 || fallbacks.chartColor2,
    chartColor3: values.chartColor3 || fallbacks.chartColor3,
    chartColor4: values.chartColor4 || fallbacks.chartColor4,
    chartColor5: values.chartColor5 || fallbacks.chartColor5,
    radius: values.radius || fallbacks.radius,
    headingFont: "inter",
    bodyFont: "inter",
  }))
}

const getThemeName = (name: string) => name

function readAppearance() {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem("app-appearance")
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [colorThemeState, setColorThemeState] = React.useState<string>(() => {
    if (typeof window === 'undefined') return 'rootline'
    return localStorage.getItem('app-color-theme') || 'rootline'
  })
  const [mounted, setMounted] = React.useState(false)
  const [style, setStyle] = React.useState<Style>(() => readAppearance()?.style ?? "nova")
  const [baseColor, setBaseColor] = React.useState<BaseColor>(() => readAppearance()?.baseColor ?? "taupe")
  const [chartColor1, setChartColor1] = React.useState<ChartColor>(() => readAppearance()?.chartColor1 ?? "blue")
  const [chartColor2, setChartColor2] = React.useState<ChartColor>(() => readAppearance()?.chartColor2 ?? "emerald")
  const [chartColor3, setChartColor3] = React.useState<ChartColor>(() => readAppearance()?.chartColor3 ?? "violet")
  const [chartColor4, setChartColor4] = React.useState<ChartColor>(() => readAppearance()?.chartColor4 ?? "amber")
  const [chartColor5, setChartColor5] = React.useState<ChartColor>(() => readAppearance()?.chartColor5 ?? "rose")
  const [radius, setRadius] = React.useState<Radius>(() => readAppearance()?.radius ?? "medium")
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    document.documentElement.setAttribute('data-theme', colorThemeState)

    const defaults = { style: "nova" as Style, baseColor: "taupe" as BaseColor, chartColor1: "blue" as ChartColor, chartColor2: "emerald" as ChartColor, chartColor3: "violet" as ChartColor, chartColor4: "amber" as ChartColor, chartColor5: "rose" as ChartColor, radius: "medium" as Radius }
    const values = { style, baseColor, chartColor1, chartColor2, chartColor3, chartColor4, chartColor5, radius }
    applyAttributes(values, defaults)
  }, [])

  // Sync isDarkMode when theme changes from external source (e.g., navbar ThemeToggle)
  React.useEffect(() => {
    if (!mounted) return
    const shouldBeDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    setIsDarkMode(shouldBeDark)
  }, [theme, mounted])

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest("[data-dropdown]")) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!mounted) return null

  const currentTheme = colorThemeState as ThemeId
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  const currentThemeName = THEMES.find(t => t.id === currentTheme)?.name || currentTheme

  function handleChartColor1(v: ChartColor) { setChartColor1(v); applyAttributes({ chartColor1: v }, { style, baseColor, chartColor1: v, chartColor2, chartColor3, chartColor4, chartColor5, radius }) }
  function handleChartColor2(v: ChartColor) { setChartColor2(v); applyAttributes({ chartColor2: v }, { style, baseColor, chartColor1, chartColor2: v, chartColor3, chartColor4, chartColor5, radius }) }
  function handleChartColor3(v: ChartColor) { setChartColor3(v); applyAttributes({ chartColor3: v }, { style, baseColor, chartColor1, chartColor2, chartColor3: v, chartColor4, chartColor5, radius }) }
  function handleChartColor4(v: ChartColor) { setChartColor4(v); applyAttributes({ chartColor4: v }, { style, baseColor, chartColor1, chartColor2, chartColor3, chartColor4: v, chartColor5, radius }) }
  function handleChartColor5(v: ChartColor) { setChartColor5(v); applyAttributes({ chartColor5: v }, { style, baseColor, chartColor1, chartColor2, chartColor3, chartColor4, chartColor5: v, radius }) }
  function handleRadius(v: Radius) { setRadius(v); applyAttributes({ radius: v }, { style, baseColor, chartColor1, chartColor2, chartColor3, chartColor4, chartColor5, radius: v }) }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Palette className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
      </div>

      <div className="p-3 space-y-3 relative">

        {/* ── 1. MODE — always first ── */}
        <div>
          <h3 className="text-[11px] text-muted-foreground mb-1.5">Mode</h3>
          <div className="grid grid-cols-3 gap-1.5">
            <ModeButton
              icon={<Sun className="h-4 w-4 text-amber-500" />}
              label="Light"
              active={theme !== "system" && !isDark}
              onClick={() => {
                setTheme("light")
            setIsDarkMode(false)
              }}
            />
            <ModeButton
              icon={<Moon className="h-4 w-4" />}
              label="Dark"
              active={theme !== "system" && isDark}
              onClick={() => {
                setTheme("dark")
                setIsDarkMode(true)
              }}
            />
            <ModeButton
              icon={<Monitor className="h-4 w-4" />}
              label="System"
              active={theme === "system"}
              onClick={() => {
                setTheme("system")
                setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches)
              }}
            />
          </div>
        </div>

        {/* ── 2. THEME — with dark prefix on names ── */}
        <div className="relative" data-dropdown>
          <SettingCard
            label="Theme"
            value={getThemeName(currentThemeName)}
            icon={
              <span
                className="h-6 w-6 rounded-full"
                style={{ backgroundColor: THEME_COLOR_MAP[currentTheme] || "hsl(190 82% 36%)" }}
              />
            }
            onClick={() => setOpenDropdown(openDropdown === "theme" ? null : "theme")}
          />
          {openDropdown === "theme" && (
            <DropdownMenu>
              {THEMES.map((t) => (
                <DropdownItem
                  key={t.id}
                  active={currentTheme === t.id}
                  onClick={() => {
                    applyColorTheme(t.id)
                    setColorThemeState(t.id)
                    setOpenDropdown(null)
                  }}
                >
                  <span
                    className="h-4 w-4 rounded-full shrink-0"
                    style={{ backgroundColor: `hsl(${t.color})` }}
                  />
                  <span>{getThemeName(t.name)}</span>
                </DropdownItem>
              ))}
            </DropdownMenu>
          )}
        </div>

        {/* ── 4. CHART COLOR 1 (Primary) ── */}
        <ChartColorSetting label="Chart Color 1" value={chartColor1} onSelect={handleChartColor1} dropdownId="chartColor1" openDropdown={openDropdown} onOpenDropdown={setOpenDropdown} />

        {/* ── 5. CHART COLOR 2 (Accent) ── */}
        <ChartColorSetting label="Chart Color 2" value={chartColor2} onSelect={handleChartColor2} dropdownId="chartColor2" openDropdown={openDropdown} onOpenDropdown={setOpenDropdown} />

        {/* ── 6. CHART COLOR 3 ── */}
        <ChartColorSetting label="Chart Color 3" value={chartColor3} onSelect={handleChartColor3} dropdownId="chartColor3" openDropdown={openDropdown} onOpenDropdown={setOpenDropdown} />

        {/* ── 7. CHART COLOR 4 ── */}
        <ChartColorSetting label="Chart Color 4" value={chartColor4} onSelect={handleChartColor4} dropdownId="chartColor4" openDropdown={openDropdown} onOpenDropdown={setOpenDropdown} />

        {/* ── 8. CHART COLOR 5 ── */}
        <ChartColorSetting label="Chart Color 5" value={chartColor5} onSelect={handleChartColor5} dropdownId="chartColor5" openDropdown={openDropdown} onOpenDropdown={setOpenDropdown} />

        {/* ── Separator ── */}
        <div className="border-t border-border" />

        {/* ── 6. RADIUS ── */}
        <div className="relative" data-dropdown>
          <SettingCard
            label="Radius"
            value={radius}
            icon={
              <div className="flex items-center justify-center h-6 w-6">
                <div
                  className="h-4 w-4 border-2 border-foreground"
                  style={{ borderRadius: radius === "none" ? "0" : radius === "small" ? "2px" : radius === "medium" ? "4px" : "6px" }}
                />
              </div>
            }
            onClick={() => setOpenDropdown(openDropdown === "radius" ? null : "radius")}
          />
          {openDropdown === "radius" && (
            <DropdownMenu>
              {RADII.map((r) => (
                <DropdownItem
                  key={r}
                  active={radius === r}
                  onClick={() => { handleRadius(r); setOpenDropdown(null) }}
                >
                  <div
                    className="h-4 w-4 border-2 border-current shrink-0"
                    style={{ borderRadius: r === "none" ? "0" : r === "small" ? "2px" : r === "medium" ? "4px" : "6px" }}
                  />
                  <span className="capitalize">{r}</span>
                </DropdownItem>
              ))}
            </DropdownMenu>
          )}
        </div>

        {/* ── Separator ── */}
        <div className="border-t border-border" />

        {/* ── 7. RESET BUTTON — always last ── */}
        <button
          type="button"
          onClick={() => {
            const defaults = { style: "nova" as Style, baseColor: "taupe" as BaseColor, chartColor1: "blue" as ChartColor, chartColor2: "emerald" as ChartColor, chartColor3: "violet" as ChartColor, chartColor4: "amber" as ChartColor, chartColor5: "rose" as ChartColor, radius: "medium" as Radius }
            setStyle(defaults.style)
            setBaseColor(defaults.baseColor)
            setChartColor1(defaults.chartColor1)
            setChartColor2(defaults.chartColor2)
            setChartColor3(defaults.chartColor3)
            setChartColor4(defaults.chartColor4)
            setChartColor5(defaults.chartColor5)
            setRadius(defaults.radius)
            applyColorTheme("rootline")
            setColorThemeState("rootline")
            setTheme("light")
            applyAttributes(defaults, defaults)
            setIsDarkMode(false)
          }}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Reset to Default
        </button>
      </div>
    </div>
  )
}
