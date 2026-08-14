import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, ChevronRight } from "lucide-react"

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[280px] overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
      <div className="p-1">
        {children}
      </div>
    </div>
  )
}

export function DropdownItem({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-foreground hover:bg-muted"
      )}
    >
      {children}
      {active && <Check className="h-3.5 w-3.5 ml-auto shrink-0" />}
    </button>
  )
}

export function SettingCard({
  label,
  value,
  icon,
  onClick,
}: {
  label: string
  value: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-border bg-background p-3 transition-all hover:bg-muted/50 hover:border-primary/30"
    >
      <div className="flex flex-col items-start gap-0.5">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold capitalize text-foreground">{value}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex h-8 w-8 items-center justify-center">
          {icon}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </button>
  )
}

export function ModeButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-all",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}
