"use client"

import { useState, useCallback } from "react"
import { ColumnItem } from "@/components/crm/CrmColumnEditor"

export type ColumnVisibilityOptions = {
  storageKey: string
  defaultColumns: string[]
  migrate?: (cols: string[]) => string[] // optional migration function
}

export function useColumnVisibility({
  storageKey,
  defaultColumns,
  migrate,
}: ColumnVisibilityOptions) {
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          let cols: string[] = JSON.parse(saved)
          if (migrate) cols = migrate(cols)
          return [...new Set(cols)]
        } catch {
          return defaultColumns
        }
      }
    }
    return defaultColumns
  })

  const [frozenCount, setFrozenCount] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${storageKey}_frozen`)
      return saved ? parseInt(saved) : 0
    }
    return 0
  })

  const [columnVersion, setColumnVersion] = useState(0)

  const handleColumnSave = useCallback((updatedColumns: ColumnItem[], newFrozenCount?: number) => {
    setVisibleColumnIds(updatedColumns.map(c => c.id))
    setColumnVersion(v => v + 1)
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedColumns.map(c => c.id)))
      if (newFrozenCount !== undefined) {
        setFrozenCount(newFrozenCount)
        localStorage.setItem(`${storageKey}_frozen`, String(newFrozenCount))
      }
    } catch { /* localStorage may be full */ }
  }, [storageKey])

  return {
    visibleColumnIds,
    frozenCount,
    columnVersion,
    handleColumnSave,
  }
}
