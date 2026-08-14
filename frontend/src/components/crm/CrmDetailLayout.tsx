import * as React from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface CrmDetailLayoutProps {
  children: React.ReactNode
  backLine: string
  backHref: string
}

export function CrmDetailLayout({ children, backLine, backHref }: CrmDetailLayoutProps) {
  return (
    <div className="flex flex-col h-full min-h-0 bg-muted/50">
      {/* 3-Column Layout Container */}
      <div className="flex-1 flex min-h-0 w-full overflow-y-auto lg:overflow-hidden">
        <div className="flex flex-col lg:flex-row w-full gap-4 items-stretch p-4 min-h-0 lg:h-full">
          {children}
        </div>
      </div>
    </div>
  )
}

export function CrmDetailLeftPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4 h-auto lg:h-full lg:overflow-y-auto min-h-0 lg:pr-2">
      {children}
    </div>
  )
}

export function CrmDetailCenterPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col bg-background border border-border rounded shadow-sm lg:overflow-hidden min-h-0">
      <div className="flex-1 bg-background lg:overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

export function CrmDetailRightPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4 h-auto lg:h-full lg:overflow-y-auto min-h-0 lg:pr-2">
      {children}
    </div>
  )
}
