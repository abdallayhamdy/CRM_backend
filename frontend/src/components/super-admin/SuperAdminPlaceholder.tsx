"use client"

import { LucideIcon } from "lucide-react"

interface SuperAdminPlaceholderProps {
  icon: LucideIcon
  title: string
}

export function SuperAdminPlaceholder({ icon: Icon, title }: SuperAdminPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/50 border border-border">
        <Icon className="w-8 h-8 text-muted-foreground/60" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">Coming soon</p>
      </div>
    </div>
  )
}
