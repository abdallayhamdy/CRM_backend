"use client"

import * as React from "react"

export type DateRangeFilter = "all" | "today" | "this_week" | "this_month" | "last_30" | "last_90" | "custom"

export interface AdvancedFilter {
  id: string
  property: string
  operator: string
  value: string
}

export interface GenericCrmFilters {
  search: string
  properties: Record<string, string[]> // e.g., { owner: ["Sarah"], stage: ["New"] }
  dateRanges: Record<string, DateRangeFilter>
  numbers: Record<string, { min: string; max: string }>
  advancedFilters: AdvancedFilter[]
}

const DEFAULT_FILTERS: GenericCrmFilters = {
  search: "",
  properties: {},
  dateRanges: {},
  numbers: {},
  advancedFilters: [],
}

/**
 * A generic hook for managing CRM filter state natively across any data type.
 * It does not filter the data directly; instead, it provides the state and setters,
 * and the consuming component uses `filters` to filter its own `data` array.
 */
export function useCrmFilters(
  initialPinned: string[] = ["contactOwner", "createDate", "lastActivity", "leadStatus"],
  persistenceKey?: string,
  activeTabId: string = "all"
) {
  const [tabFilters, setTabFilters] = React.useState<Record<string, GenericCrmFilters>>({
    [activeTabId]: DEFAULT_FILTERS
  })
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  
  // Initialize with initialPinned, but override from localStorage in useEffect
  const [pinnedFilterIds, setPinnedFilterIds] = React.useState<string[]>(initialPinned)

  // Load from localStorage
  React.useEffect(() => {
    if (persistenceKey && typeof window !== 'undefined') {
      const savedPinned = localStorage.getItem(persistenceKey)
      if (savedPinned) {
        try {
          setPinnedFilterIds(JSON.parse(savedPinned))
        } catch (e) {
          console.error("Failed to parse pinned filters:", e)
        }
      }

      const savedData = localStorage.getItem(`${persistenceKey}_data`)
      if (savedData) {
        try {
          setTabFilters(JSON.parse(savedData))
        } catch (e) {
          console.error("Failed to parse tab filters data:", e)
        }
      }
    }
  }, [persistenceKey])

  // Save to localStorage
  React.useEffect(() => {
    if (persistenceKey && typeof window !== 'undefined') {
      localStorage.setItem(persistenceKey, JSON.stringify(pinnedFilterIds))
      localStorage.setItem(`${persistenceKey}_data`, JSON.stringify(tabFilters))
    }
  }, [pinnedFilterIds, tabFilters, persistenceKey])

  const filters = React.useMemo(() => {
    return tabFilters[activeTabId] || DEFAULT_FILTERS
  }, [tabFilters, activeTabId])

  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (filters.search) count++
    
    // Properties
    Object.values(filters.properties).forEach(arr => {
      if (arr && arr.length > 0) count++
    })
    
    // Date ranges
    Object.values(filters.dateRanges).forEach(range => {
      if (range && range !== "all") count++
    })
    
    // Numbers
    Object.values(filters.numbers).forEach(num => {
      if (num && (num.min || num.max)) count++
    })
    
    count += filters.advancedFilters.length
    return count
  }, [filters])

  const updateActiveFilters = (updater: (prev: GenericCrmFilters) => GenericCrmFilters) => {
    setTabFilters(prev => ({
      ...prev,
      [activeTabId]: updater(prev[activeTabId] || DEFAULT_FILTERS)
    }))
  }

  const updateSearch = (search: string) => {
    updateActiveFilters(prev => ({ ...prev, search }))
  }

  const toggleProperty = (property: string, value: string) => {
    updateActiveFilters(prev => {
      const current = prev.properties[property] || []
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      
      return {
        ...prev,
        properties: { ...prev.properties, [property]: updated }
      }
    })
  }

  const setProperty = (property: string, value: string[]) => {
    updateActiveFilters(prev => ({
      ...prev,
      properties: { ...prev.properties, [property]: value }
    }))
  }

  const updateDateRange = (property: string, range: DateRangeFilter) => {
    updateActiveFilters(prev => ({
      ...prev,
      dateRanges: { ...prev.dateRanges, [property]: range }
    }))
  }

  const updateNumber = (property: string, bound: "min" | "max", value: string) => {
    updateActiveFilters(prev => ({
      ...prev,
      numbers: {
        ...prev.numbers,
        [property]: {
          ...prev.numbers[property],
          [bound]: value
        }
      }
    }))
  }

  const clearAll = () => {
    updateActiveFilters(() => DEFAULT_FILTERS)
  }

  const removeAdvancedFilter = (id: string) => {
    updateActiveFilters(prev => ({
      ...prev,
      advancedFilters: prev.advancedFilters.filter(f => f.id !== id),
    }))
  }

  const addAdvancedFilter = (filter: Omit<AdvancedFilter, "id">) => {
    updateActiveFilters(prev => ({
      ...prev,
      advancedFilters: [
        ...prev.advancedFilters,
        { ...filter, id: Math.random().toString(36).slice(2) },
      ],
    }))
  }

  const addPinnedFilter = (id: string) => {
    if (pinnedFilterIds.includes(id)) return
    setPinnedFilterIds(prev => [...prev, id])
  }

  const removePinnedFilter = (id: string) => {
    setPinnedFilterIds(prev => prev.filter(p => p !== id))
  }

  return {
    filters,
    activeFilterCount,
    sidebarOpen,
    setSidebarOpen,
    pinnedFilterIds,
    updateSearch,
    toggleProperty,
    setProperty,
    updateDateRange,
    updateNumber,
    clearAll,
    removeAdvancedFilter,
    addAdvancedFilter,
    addPinnedFilter,
    removePinnedFilter,
  }
}
