"use client"

import { useObjectConfig, DisplayStyle } from "@/hooks/use-object-config"
import { ObjectType } from "@/lib/default-object-configs"
import { cn } from "@/lib/utils"
import {
  User, ArrowRight, Megaphone, Target, TrendingUp,
  Crown, Heart, HelpCircle, CheckCircle2, Star
} from "lucide-react"

const LIFECYCLE_ICONS: Record<string, React.ComponentType<any>> = {
  subscriber: User,
  lead: ArrowRight,
  marketing_qualified_lead: Megaphone,
  sales_qualified_lead: Target,
  opportunity: TrendingUp,
  customer: Crown,
  evangelist: Heart,
  other: HelpCircle,
}

const LIFECYCLE_DESCRIPTIONS: Record<string, string> = {
  subscriber: "Subscribed to newsletters and updates.",
  lead: "New potential customer identified.",
  marketing_qualified_lead: "Meets marketing criteria for outreach.",
  sales_qualified_lead: "Ready for sales engagement.",
  opportunity: "Active sales opportunity in pipeline.",
  customer: "Paying customer with active account.",
  evangelist: "Brand advocate promoting your product.",
  other: "Uncategorized lifecycle stage.",
}

interface LifecycleBadgeProps {
  stageId: string | null | undefined
  objectType: ObjectType
  displayStyle?: DisplayStyle
  className?: string
}

export function LifecycleBadge({ stageId, objectType, displayStyle: displayStyleProp, className }: LifecycleBadgeProps) {
  const hook = useObjectConfig(objectType)
  const displayStyle = displayStyleProp ?? hook.displayStyle
  const stages = hook.stages

  if (!stageId) {
    if (displayStyle === 'alert') {
      return (
        <div className={cn(
          "flex items-start gap-3 p-3.5 rounded-lg border bg-muted/30 border-border",
          className
        )}>
          <HelpCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">Unset</span>
            <span className="text-xs text-muted-foreground">No lifecycle stage assigned.</span>
          </div>
        </div>
      )
    }
    return <span className={cn("text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded", className)}>Unset</span>
  }

  const stage = stages.find(
    s => s.id === stageId || s.name.toLowerCase() === stageId.toLowerCase()
  )

  if (!stage) {
    return <span className={cn("text-sm", className)}>{stageId.replace(/_/g, ' ')}</span>
  }

  if (displayStyle === 'no_color') {
    return <span className={cn("text-sm", className)}>{stage.name}</span>
  }

  if (displayStyle === 'colored_dot') {
    return (
      <span className={cn("flex items-center gap-1.5 text-sm", className)}>
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: stage.color }}
        />
        {stage.name}
      </span>
    )
  }

  if (displayStyle === 'alert') {
    const Icon = LIFECYCLE_ICONS[stage.id] || Star
    const description = LIFECYCLE_DESCRIPTIONS[stage.id] || `${stage.name} stage.`

    return (
      <div
        className={cn(
          "flex items-start gap-3 p-3.5 rounded-lg border",
          className
        )}
        style={{
          backgroundColor: `color-mix(in srgb, ${stage.color} 8%, transparent)`,
          borderColor: `color-mix(in srgb, ${stage.color} 20%, transparent)`,
        }}
      >
        <Icon
          className="h-5 w-5 mt-0.5 shrink-0"
          style={{ color: stage.color }}
        />
        <div className="flex flex-col gap-0.5">
          <span
            className="text-sm font-semibold"
            style={{ color: stage.color }}
          >
            {stage.name}
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
      style={{ backgroundColor: stage.color }}
    >
      {stage.name}
    </span>
  )
}
