"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { LIFECYCLE_STAGE_OPTIONS } from "@/lib/crm-constants"
import { cn } from "@/lib/utils"
import { useObjectConfig } from "@/hooks/use-object-config"
import { ObjectType } from "@/lib/default-object-configs"

interface LifecycleDropdownProps {
  value: string | null
  onChange: (value: string) => void
  className?: string
  size?: "sm" | "md"
  objectType?: ObjectType
}

export function LifecycleDropdown({
  value,
  onChange,
  className,
  size = "md",
  objectType
}: LifecycleDropdownProps) {
  const { stages: dynamicStages } = useObjectConfig(objectType || 'contact')
  
  const stages = React.useMemo(() => {
    if (dynamicStages?.length) {
      return dynamicStages.map(s => ({
        value: s.id,
        label: s.name,
        color: s.color,
        badgeColor: 'text-white'
      }))
    }
    return LIFECYCLE_STAGE_OPTIONS
  }, [dynamicStages])

  const selected = stages.find(s => s.value === value) ?? stages[0]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full rounded-sm border border-border px-3 flex items-center justify-between bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition cursor-pointer",
            size === "sm" ? "h-8" : "h-10"
          )}
        >
          {selected?.color ? (
            <StatusBadge
              label={selected.label || String(value)}
              color={selected.color}
            />
          ) : (
            <span className="text-sm font-medium">{selected?.label || value}</span>
          )}
          <ChevronDown className={cn("text-muted-foreground", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]">
        <div className="max-h-60 overflow-y-auto">
          {stages.map(stage => (
            <button
              key={stage.value}
              type="button"
              onClick={() => onChange(stage.value)}
              className={cn(
                "w-full flex items-center px-3 py-2 hover:bg-accent transition text-left",
                stage.value === value ? "bg-muted" : ""
              )}
            >
              {stage.color ? (
                <StatusBadge
                  label={stage.label}
                  color={stage.color}
                />
              ) : (
                <span className="text-sm font-medium">{stage.label}</span>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
      <input type="hidden" value={value ?? ''} />
    </Popover>
  )
}
