"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SummaryStat<T = unknown> {
  key: string
  label: string
  color?: string
  filterFn: (item: T) => boolean
  displayValue?: (data: T[]) => string
}

interface SummaryStatsBarProps<T> {
  data: T[]
  stats: SummaryStat<T>[]
  activeFilter: string | null
  onFilterChange: (key: string | null) => void
  className?: string
}

export function SummaryStatsBar<T>({
  data,
  stats,
  activeFilter,
  onFilterChange,
  className,
}: SummaryStatsBarProps<T>) {
  const statValues = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const stat of stats) {
      const count = data.filter(stat.filterFn).length
      map.set(stat.key, stat.displayValue ? stat.displayValue(data) : String(count))
    }
    return map
  }, [data, stats])

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 bg-background border-b border-border overflow-x-auto",
        className
      )}
    >
      {stats.map((stat, i) => {
        const isActive = activeFilter === stat.key
        const value = statValues.get(stat.key) ?? "0"
        const hasWarning = stat.color === "text-badge-warning-text"
        const hasDanger = stat.color === "text-destructive"

        return (
          <React.Fragment key={stat.key}>
            {i > 0 && <span className="w-px h-4 bg-border shrink-0" />}
            <button
              onClick={() => onFilterChange(isActive ? null : stat.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-all shrink-0 cursor-pointer border",
                isActive
                  ? "bg-primary/10 text-primary border-primary/30"
                  : hasWarning
                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
                    : hasDanger
                      ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
                      : "bg-muted/50 text-foreground border-border hover:bg-muted dark:bg-white/5 dark:border-white/10 dark:text-white/80"
              )}
            >
              <span
                className={cn(
                  "font-bold text-sm",
                  isActive
                    ? "text-primary"
                    : hasWarning
                      ? "text-amber-600 dark:text-amber-400"
                      : hasDanger
                        ? "text-red-500 dark:text-red-400"
                        : "text-foreground dark:text-white"
                )}
              >
                {value}
              </span>
              <span className="opacity-60">{stat.label}</span>
            </button>
          </React.Fragment>
        )
      })}
    </div>
  )
}
