export const STYLES = ["vega", "nova", "maia", "lyra", "mira", "luma", "sera", "rhea"] as const
export const BASE_COLORS = ["neutral", "stone", "zinc", "mauve", "olive", "mist", "taupe"] as const
export const CHART_COLORS = [
  "amber", "blue", "cyan", "emerald", "fuchsia", "green",
  "indigo", "lime", "orange", "pink", "purple", "red",
  "rose", "sky", "teal", "violet", "yellow",
] as const
export const RADII = ["none", "small", "medium", "large"] as const

export type Style = (typeof STYLES)[number]
export type BaseColor = (typeof BASE_COLORS)[number]
export type ChartColor = (typeof CHART_COLORS)[number]
export type Radius = (typeof RADII)[number]

export const BASE_COLOR_MAP: Record<BaseColor, { light: string; dark: string }> = {
  neutral: { light: "hsl(0 0% 70%)", dark: "hsl(0 0% 50%)" },
  stone:   { light: "hsl(24 10% 50%)", dark: "hsl(24 10% 50%)" },
  zinc:    { light: "hsl(240 6% 50%)", dark: "hsl(240 6% 50%)" },
  mauve:   { light: "hsl(310 8% 50%)", dark: "hsl(310 8% 50%)" },
  olive:   { light: "hsl(90 5% 50%)", dark: "hsl(90 5% 50%)" },
  mist:    { light: "hsl(205 10% 50%)", dark: "hsl(205 10% 50%)" },
  taupe:   { light: "hsl(35 10% 50%)", dark: "hsl(35 10% 50%)" },
}

export const CHART_COLOR_MAP: Record<ChartColor, string> = {
  amber:   "hsl(38 92% 50%)",
  blue:    "hsl(217 91% 60%)",
  cyan:    "hsl(186 94% 41%)",
  emerald: "hsl(152 76% 40%)",
  fuchsia: "hsl(292 84% 61%)",
  green:   "hsl(142 71% 45%)",
  indigo:  "hsl(239 84% 67%)",
  lime:    "hsl(84 85% 45%)",
  orange:  "hsl(25 95% 53%)",
  pink:    "hsl(330 81% 60%)",
  purple:  "hsl(271 81% 56%)",
  red:     "hsl(0 84% 60%)",
  rose:    "hsl(347 77% 50%)",
  sky:     "hsl(199 89% 48%)",
  teal:    "hsl(173 80% 40%)",
  violet:  "hsl(258 90% 66%)",
  yellow:  "hsl(48 96% 53%)",
}

export const THEME_COLOR_MAP: Record<string, string> = {
  rootline: "hsl(225 45% 35%)",
  ocean:    "hsl(210 55% 40%)",
  forest:   "hsl(150 45% 40%)",
  sunset:   "hsl(25 55% 40%)",
  rose:     "hsl(340 45% 40%)",
  purple:   "hsl(270 45% 40%)",
  midnight: "hsl(220 40% 40%)",
  lavender: "hsl(260 45% 40%)",
  emerald:  "hsl(160 45% 40%)",
  amber:    "hsl(40 55% 40%)",
  slate:    "hsl(210 10% 40%)",
  crimson:  "hsl(0 50% 40%)",
  coral:    "hsl(10 50% 40%)",
  mint:     "hsl(165 45% 40%)",
  indigo:   "hsl(235 50% 40%)",
  peach:    "hsl(20 50% 40%)",
  teal:     "hsl(175 50% 40%)",
  magenta:  "hsl(310 50% 40%)",
  olive:    "hsl(80 30% 40%)",
  sky:      "hsl(195 55% 40%)",
  copper:   "hsl(18 35% 40%)",
  lilac:    "hsl(280 45% 40%)",
  charcoal: "hsl(210 5% 40%)",
  gold:     "hsl(45 50% 40%)",
  cobalt:   "hsl(230 50% 40%)",
  blush:    "hsl(350 50% 40%)",
  burgundy: "hsl(345 45% 40%)",
  rust:     "hsl(15 50% 40%)",
  sage:     "hsl(100 35% 40%)",
  violet:   "hsl(265 50% 40%)",
  champagne:"hsl(45 40% 40%)",
  storm:    "hsl(215 40% 40%)",
}
