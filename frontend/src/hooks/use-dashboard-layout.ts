"use client"

import { useState, useCallback } from "react"

const STORAGE_KEY = "dashboard_visibility"

const DEFAULTS: Record<string, boolean> = {
  overview: true,
  overdue: true,
  integrations: true,
  recentActivity: true,
  phoneCalls: true,
}

function loadVisibility(): Record<string, boolean> {
  if (typeof window === "undefined") return DEFAULTS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULTS, ...parsed }
    }
  } catch {}
  return DEFAULTS
}

function saveVisibility(visibility: Record<string, boolean>) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility))
}

export const DASHBOARD_CARDS = [
  { id: "overview", label: "Overview Stats", description: "Contacts, companies, deals, tasks & tickets counts" },
  { id: "overdue", label: "Overdue Tasks", description: "Tasks past their due date" },
  { id: "integrations", label: "Quick Tasks", description: "Create tasks and manage to-dos" },
  { id: "recentActivity", label: "Recent Activity", description: "Latest changes across your CRM" },
  { id: "phoneCalls", label: "Phone Calls", description: "Call activity breakdown" },
] as const

export function useDashboardLayout() {
  const [visibility, setVisibility] = useState<Record<string, boolean>>(loadVisibility)

  const isVisible = useCallback((cardId: string) => visibility[cardId] !== false, [visibility])

  const toggleCard = useCallback((cardId: string) => {
    setVisibility((prev) => {
      const next = { ...prev, [cardId]: !prev[cardId] }
      saveVisibility(next)
      return next
    })
  }, [])

  const resetAll = useCallback(() => {
    saveVisibility(DEFAULTS)
    setVisibility({ ...DEFAULTS })
  }, [])

  return { visibility, isVisible, toggleCard, resetAll }
}
