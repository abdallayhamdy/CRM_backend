"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

export type TabItem = {
  id: string
  label: string
  closable: boolean
  color?: string
}

export type TabConfigOptions = {
  storageKey: string
  defaultTabs: TabItem[]
}

export function useTabConfig({ storageKey, defaultTabs }: TabConfigOptions) {
  const [tabsConfig, setTabsConfig] = useState<TabItem[]>(() => {
    if (typeof window === 'undefined') return defaultTabs
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : defaultTabs
    } catch {
      return defaultTabs
    }
  })

  const [activeTab, setActiveTab] = useState("all")

  const persist = useCallback((tabs: TabItem[]) => {
    setTabsConfig(tabs)
    try {
      localStorage.setItem(storageKey, JSON.stringify(tabs))
    } catch { /* localStorage may be full */ }
  }, [storageKey])

  const handleTabClose = useCallback((id: string) => {
    const newTabs = tabsConfig.filter(t => t.id !== id)
    persist(newTabs)
    if (activeTab === id) setActiveTab("all")
  }, [tabsConfig, activeTab, persist])

  const handleTabReorder = useCallback((newTabs: { id: string; label: string; closable?: boolean; color?: string }[]) => {
    const persisted = newTabs.map(({ id, label, closable, color }) => ({
      id,
      label,
      closable: closable ?? false,
      color
    }))
    persist(persisted)
  }, [persist])

  const handleTabRename = useCallback((id: string, newName: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, label: newName } : t)
    persist(newTabs)
    toast.success(`View renamed to "${newName}"`)
  }, [tabsConfig, persist])

  const handleTabColorChange = useCallback((id: string, color: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, color: color || undefined } : t)
    persist(newTabs)
    toast.success("Color updated")
  }, [tabsConfig, persist])

  const handleAddTab = useCallback((name?: string) => {
    const tabName = name ?? prompt("Enter view name:")
    if (!tabName) return
    const id = tabName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const newTabs = [...tabsConfig, { id, label: tabName, closable: true }]
    persist(newTabs)
    setActiveTab(id)
  }, [tabsConfig, persist])

  return {
    tabsConfig,
    activeTab,
    setActiveTab,
    handleTabClose,
    handleTabReorder,
    handleTabRename,
    handleTabColorChange,
    handleAddTab,
  }
}
