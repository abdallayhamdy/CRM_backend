"use client"

import React from "react"
import { SuperAdminSidebar } from "./SuperAdminSidebar"

interface SuperAdminLayoutProps {
  children: React.ReactNode
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return (
    <div className="flex h-full bg-background text-foreground font-['Lexend_Deca',_sans-serif]">
      <SuperAdminSidebar />
      <div className="flex-1 overflow-y-auto h-full crm-scrollbar w-full min-w-0">
        {children}
      </div>
    </div>
  )
}
