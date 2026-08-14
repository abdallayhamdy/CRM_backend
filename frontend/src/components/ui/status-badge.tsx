import { getBadgeCssVar } from "@/lib/badge-colors"

/**
 * Renders a status badge using CSS custom properties from globals.css.
 * Colors are resolved from the centralized badge-colors.ts config.
 */
export function StatusBadge({ value, label }: { value: string; label?: string }) {
  const cssVar = getBadgeCssVar("lifecycle", value)
    || getBadgeCssVar("lead_status", value)
    || getBadgeCssVar("task_status", value)
    || getBadgeCssVar("ticket_status", value)

  // If no match found in any category, use fallback
  const hasMatch = cssVar !== "hsl(var(--stage-slate))"

  if (!hasMatch) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-muted text-muted-foreground">
        {label ?? value?.replace(/_/g, ' ') ?? 'Unset'}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap text-white/90 border border-white/20 dark:border-white/10"
      style={{ backgroundColor: cssVar } as React.CSSProperties}
    >
      {label ?? value?.replace(/_/g, ' ') ?? 'Unset'}
    </span>
  )
}
