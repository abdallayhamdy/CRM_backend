"use client"

import { cn } from "@/lib/utils"
import { LEAD_STATUS_OPTIONS } from "@/lib/crm-constants"
import {
  Sparkles, Circle, Clock, TrendingUp,
  XCircle, Phone, CheckCircle2, AlertTriangle
} from "lucide-react"

const LEAD_STATUS_ICONS: Record<string, React.ComponentType<any>> = {
  New: Sparkles,
  Open: Circle,
  "In progress": Clock,
  "Open deal": TrendingUp,
  Unqualified: XCircle,
  "Attempted to contact": Phone,
  Connected: CheckCircle2,
  "Bad timing": AlertTriangle,
}

const LEAD_STATUS_DESCRIPTIONS: Record<string, string> = {
  New: "New lead just entered the system.",
  Open: "Lead is open for engagement.",
  "In progress": "Actively working this lead.",
  "Open deal": "Deal is being negotiated.",
  Unqualified: "Does not meet qualification criteria.",
  "Attempted to contact": "Reached out but no response yet.",
  Connected: "Successfully connected with lead.",
  "Bad timing": "Lead not ready at this time.",
}

interface LeadStatusBadgeProps {
  value: string | null | undefined
  displayStyle?: "colored_badge" | "alert"
  className?: string
}

export function LeadStatusBadge({ value, displayStyle = "colored_badge", className }: LeadStatusBadgeProps) {
  if (!value) {
    if (displayStyle === 'alert') {
      return (
        <div className={cn(
          "flex items-start gap-3 p-3.5 rounded-lg border bg-muted/30 border-border",
          className
        )}>
          <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">Unset</span>
            <span className="text-xs text-muted-foreground">No lead status assigned.</span>
          </div>
        </div>
      )
    }
    return <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Unset</span>
  }

  const option = LEAD_STATUS_OPTIONS.find(o => o.value === value || o.label === value)

  if (!option) {
    return <span className={cn("text-sm", className)}>{value}</span>
  }

  if (displayStyle === 'alert') {
    const Icon = LEAD_STATUS_ICONS[option.value] || Sparkles
    const description = LEAD_STATUS_DESCRIPTIONS[option.value] || `${option.label} status.`

    return (
      <div
        className={cn(
          "flex items-start gap-3 p-3.5 rounded-lg border",
          className
        )}
        style={{
          backgroundColor: `color-mix(in srgb, ${option.color} 8%, transparent)`,
          borderColor: `color-mix(in srgb, ${option.color} 20%, transparent)`,
        }}
      >
        <Icon
          className="h-5 w-5 mt-0.5 shrink-0"
          style={{ color: option.color }}
        />
        <div className="flex flex-col gap-0.5">
          <span
            className="text-sm font-semibold"
            style={{ color: option.color }}
          >
            {option.label}
          </span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </div>
    )
  }

  // colored_badge (default)
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white",
        className
      )}
      style={{ backgroundColor: option.color }}
    >
      {option.label}
    </span>
  )
}
