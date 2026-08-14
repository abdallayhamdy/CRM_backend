"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
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
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  
  // Get dynamic stages if objectType is provided
  const { stages: dynamicStages } = useObjectConfig(objectType || 'contact')
  
  // Build stages list from dynamic data or fallback to static
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
  
  // Handle clicks outside to close dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selected = stages.find(s => s.value === value) ?? stages[0]

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          "w-full rounded-sm border border-border px-3 flex items-center justify-between bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition cursor-pointer",
          size === "sm" ? "h-8" : "h-10"
        )}
      >
        <span
          className="px-2 py-0.5 rounded font-bold uppercase tracking-tight text-white"
          style={{ backgroundColor: selected?.color }}
        >
          {selected?.label || value}
        </span>
        <ChevronDown className={cn("text-muted-foreground", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[100] bg-background border border-border rounded-sm shadow-lg overflow-hidden max-h-60 overflow-y-auto">
          {stages.map(stage => (
            <button
              key={stage.value}
              type="button"
              onClick={() => { onChange(stage.value); setOpen(false) }}
              className={cn(
                "w-full flex items-center px-3 py-2 hover:bg-accent transition text-left",
                stage.value === value ? "bg-muted" : ""
              )}
            >
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight text-white"
                style={{ backgroundColor: stage.color }}
              >
                {stage.label}
              </span>
            </button>
          ))}
        </div>
      )}
      <input type="hidden" value={value ?? ''} />
    </div>
  )
}
