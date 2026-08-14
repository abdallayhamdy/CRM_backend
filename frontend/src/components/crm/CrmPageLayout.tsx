"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface CrmPageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

interface CrmPageHeaderProps {
  title: string;
  count?: number;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function CrmPageLayout({ children, className }: CrmPageLayoutProps) {
  return (
    <div className={cn(
      "flex flex-col h-full bg-background min-h-0",
      className
    )}>
      {children}
    </div>
  )
}

export function CrmPageHeader({ title, count, icon, actions, children, className }: CrmPageHeaderProps & { children?: React.ReactNode }) {
  return (
    <div className={cn(
      "flex flex-wrap items-center justify-between px-4 py-2 bg-background shrink-0 min-h-[52px] z-40 transition-all duration-300",
      className
    )}>
      <div className="flex items-center h-full gap-1 min-w-0">
        {/* Left Side: Title Dropdown */}
        <div className="flex items-center gap-2 h-full px-3 py-1.5 rounded-lg hover:bg-muted/60 cursor-pointer group transition-colors">
          {icon && <div className="text-primary group-hover:scale-110 transition-transform">{icon}</div>}
          <h1 className="text-[14px] font-semibold tracking-tight text-foreground whitespace-nowrap">
            {title}
          </h1>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>

        {/* Middle: Custom content (like Tabs) */}
        <div className="flex-1 flex items-center h-full min-w-0">
          {children}
        </div>
      </div>
      
      {/* Right Side: Actions */}
      <div className="flex items-center gap-2 h-full flex-wrap">
        {actions}
      </div>
    </div>
  )
}

export function CrmPageContent({ children, className, inlinePanel }: { children: React.ReactNode, className?: string, inlinePanel?: React.ReactNode }) {
  if (inlinePanel) {
    return (
      <div className={cn("relative flex flex-1 overflow-hidden min-h-0", className)}>
        <div className="flex-1 flex flex-col overflow-auto min-h-0 min-w-0 transition-all duration-300 ease-in-out">
          {children}
        </div>
        {inlinePanel}
      </div>
    )
  }
  return (
    <div className={cn(
      "flex flex-col flex-1 overflow-hidden relative min-h-0",
      className
    )}>
      {children}
    </div>
  )
}
