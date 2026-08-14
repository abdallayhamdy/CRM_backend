"use client"

import { GenericActiveFilter } from "@/components/crm/CrmFilterBar"
import { DateRangeFilter } from "@/hooks/use-crm-filters"
import { DEAL_MORE_FILTERS } from "@/lib/filter-data"
import { DEAL_STAGES } from "@/lib/types/crm"
import { Profile } from "@/lib/types/crm"

interface UseDealsActiveFiltersParams {
  pinnedFilterIds: string[]
  filters: {
    properties: Record<string, string[]>
    dateRanges: Record<string, DateRangeFilter>
  }
  owners: Profile[]
  allOwners: string[]
  toggleProperty: (id: string, value: string) => void
  updateDateRange: (id: string, val: DateRangeFilter) => void
  handleSetProperty: (id: string, values: string[]) => void
  handleToggleProperty: (id: string, value: string) => void
}

// Helper: look up a filter config from DEAL_MORE_FILTERS by id
function getDealFilterConfig(id: string) {
  for (const category of DEAL_MORE_FILTERS) {
    const item = category.items.find(i => i.id === id)
    if (item) return item
  }
  return null
}

export function useDealsActiveFilters({
  pinnedFilterIds,
  filters,
  owners,
  allOwners,
  toggleProperty,
  updateDateRange,
  handleSetProperty,
  handleToggleProperty,
}: UseDealsActiveFiltersParams): GenericActiveFilter[] {
  // NOTE: No useMemo - matches the original inline implementation.
  // The original code was: pinnedFilterIds.map(...).filter(Boolean)
  // without React.useMemo, so this hook preserves that exact behavior.

  return pinnedFilterIds.map(id => {
    if (id === "owner") {
      return { id: "owner", label: "Deal owner", type: "searchable-property", options: allOwners, value: filters.properties["owner"] || [], onChange: (val: string) => toggleProperty("owner", val) }
    }
    if (id === "stage") {
      return { id: "stage", label: "Deal stage", type: "simple-property", options: [...DEAL_STAGES], value: filters.properties["stage"] || [], onChange: (val: string) => toggleProperty("stage", val) }
    }
    if (id === "closeDate") {
      return { id: "closeDate", label: "Close date", type: "date", value: filters.dateRanges["closeDate"] || "all", onChange: (val: string) => updateDateRange("closeDate", val as any) }
    }

    const config = getDealFilterConfig(id)
    if (!config) return null

    let type: GenericActiveFilter["type"] = "generic"
    if (config.type === "text" || config.type === "link") type = "text"
    else if (config.type === "date") type = "date"
    else if (config.type === "number") type = "number"
    else if (config.type === "check" || config.type === "property") type = "simple-property"

    return {
      id,
      label: config.name,
      type,
      options: config.type === "check" ? [] as string[] : [] as string[],
      value: type === "date" ? filters.dateRanges[id] || "all"
           : type === "number" ? (filters.properties[id] ? JSON.parse(filters.properties[id][0] || "null") : null)
           : type === "text" ? (filters.properties[id]?.[0] || "")
           : id === "owner" || id === "deal-owner" 
             ? (filters.properties[id] || []).map(oid => {
                 const p = owners.find(o => o.id === oid)
                 return p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : oid
               })
             : filters.properties[id] || [],
      onChange: (val: any) => {
        if (type === "date") updateDateRange(id, val)
        else if (type === "number") handleSetProperty(id, [JSON.stringify(val)])
        else if (type === "text") handleSetProperty(id, val ? [val] : [])
        else handleToggleProperty(id, val)
      }
    }
  }).filter(Boolean) as GenericActiveFilter[]
}
