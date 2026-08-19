"use client"

import * as React from "react"
import { PageHeader } from "@/components/shared/PageHeader"

export function DashboardHeader() {
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <PageHeader
      title="Hi, VS Realstate agency"
      subtitle={currentDate}
    />
  )
}
