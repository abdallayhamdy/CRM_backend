"use client"

import { useState, useCallback } from "react"

export type SortStateOptions = {
  storageKey?: string
  defaultField?: string
  defaultDir?: "asc" | "desc"
  migrateFrom?: string // old field name to migrate from
}

export function useSortState({
  storageKey = "crm_sort",
  defaultField = "",
  defaultDir = "desc",
  migrateFrom,
}: SortStateOptions = {}) {
  const [sortBy, setSortBy] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey)
      if (migrateFrom && saved === migrateFrom) {
        const newField = defaultField || saved
        localStorage.setItem(storageKey, newField)
        return newField
      }
      return saved || defaultField
    }
    return defaultField
  })

  const [sortDir, setSortDir] = useState<"asc" | "desc">(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(`${storageKey}_dir`) as "asc" | "desc") || defaultDir
    }
    return defaultDir
  })

  const handleSortChange = useCallback((field: string, dir: "asc" | "desc") => {
    setSortBy(field)
    setSortDir(dir)
    try {
      localStorage.setItem(storageKey, field)
      localStorage.setItem(`${storageKey}_dir`, dir)
    } catch { /* localStorage may be full */ }
  }, [storageKey])

  return {
    sortBy,
    sortDir,
    handleSortChange,
  }
}
