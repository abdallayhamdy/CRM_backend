"use client"

import * as React from "react"
import { Settings } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { useAuth } from "@/hooks/use-auth"

export function DashboardHeader() {
  const { user } = useAuth()
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const displayName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'User' : 'User'
  
  return (
    <PageHeader 
      title={`Hi, ${displayName}`}
      subtitle={currentDate}
      actions={
        <button className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="h-4 w-4" />
          Customize
        </button>
      }
    />
  )
}
