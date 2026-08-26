"use client"

import { useState, useCallback } from "react"
import { TableSettings, loadTableSettings, saveTableSettings } from "@/components/crm/TableSettingsDialog"

export function useTableSettings() {
  const [tableSettings, setTableSettings] = useState<TableSettings>(() => loadTableSettings())

  const handleTableSettingsChange = useCallback((settings: TableSettings) => {
    setTableSettings(settings)
    saveTableSettings(settings)
  }, [])

  return {
    tableSettings,
    handleTableSettingsChange,
  }
}
