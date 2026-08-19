"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { getBadgeClasses, getBadgeCssVar, type BadgeStyle } from "@/lib/badge-colors"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border text-foreground",
        ghost: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
)

type DisplayStyle = "colored_badge" | "colored_dot" | "alert" | "no_color"

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement>,
  VariantProps<typeof badgeVariants> {
  label?: string
  icon?: React.ReactNode
  dot?: boolean
  displayStyle?: DisplayStyle
  description?: string
  statusType?: string
  statusValue?: string
  badgeStyle?: BadgeStyle
  color?: string
}

function getStatusColor(statusType: string, statusValue: string): string {
  return getBadgeCssVar(statusType, statusValue)
}

export function StatusBadge({
  label,
  icon,
  dot = false,
  displayStyle = "colored_badge",
  description,
  className,
  variant = "secondary",
  statusType,
  statusValue,
  badgeStyle = "tinted",
  color,
  ...spanProps
}: StatusBadgeProps) {
  const displayLabel = label ?? (statusValue?.replace(/_/g, ' ') ?? 'Unset')

  const resolvedColor = (statusType && statusValue)
    ? getStatusColor(statusType, statusValue)
    : color

  if (displayStyle === "alert") {
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-3.5 rounded-lg border",
          !resolvedColor && "bg-muted/30 border-border",
          className
        )}
        style={resolvedColor ? {
          backgroundColor: `color-mix(in srgb, ${resolvedColor} 8%, transparent)`,
          borderColor: `color-mix(in srgb, ${resolvedColor} 20%, transparent)`,
        } : undefined}
      >
        {icon && (
          <span
            className="h-5 w-5 mt-0.5 shrink-0"
            style={resolvedColor ? { color: resolvedColor } : undefined}
          >
            {icon}
          </span>
        )}
        <div className="flex flex-col gap-0.5">
          <span
            className="text-sm font-semibold"
            style={resolvedColor ? { color: resolvedColor } : undefined}
          >
            {displayLabel}
          </span>
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      </div>
    )
  }

  if (displayStyle === "no_color") {
    return (
      <span className={cn("text-sm", className)} {...spanProps}>
        {displayLabel}
      </span>
    )
  }

  if (displayStyle === "colored_dot") {
    return (
      <span className={cn("flex items-center gap-1.5 text-sm", className)} {...spanProps}>
        {resolvedColor && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: resolvedColor }}
          />
        )}
        {displayLabel}
      </span>
    )
  }

  if (resolvedColor) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-white",
          className
        )}
        style={{ backgroundColor: resolvedColor }}
        {...spanProps}
      >
        {icon}
        {dot && <span className="w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />}
        {displayLabel}
      </span>
    )
  }

  const resolvedClassName = (statusType && statusValue)
    ? cn(badgeVariants({ variant }), getBadgeClasses(statusType, statusValue, badgeStyle), className)
    : cn(badgeVariants({ variant }), className)

  return (
    <span className={resolvedClassName} {...spanProps}>
      {icon}
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current/40 flex-shrink-0" />}
      {displayLabel}
    </span>
  )
}
