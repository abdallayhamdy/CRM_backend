"use client"

import * as React from "react"
import { PageHeader } from "@/components/shared/PageHeader"
import { useAuth } from "@/hooks/use-auth"

export function DashboardHeader() {
  const { user, activeWorkspace } = useAuth()
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : activeWorkspace?.name ?? "there"

  return (
    <PageHeader
      title={`Hi, ${displayName}`}
      subtitle={currentDate}
    />
  )
}
