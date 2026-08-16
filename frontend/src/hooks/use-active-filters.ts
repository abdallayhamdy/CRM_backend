"use client"

import * as React from "react"
import { GenericActiveFilter } from "@/components/crm/CrmFilterBar"
import { DateRangeFilter } from "@/hooks/use-crm-filters"
import { MORE_FILTERS } from "@/lib/filter-data"
import { LEAD_STATUS_OPTIONS } from "@/lib/crm-constants"
import { Profile } from "@/lib/types/crm"

interface UseActiveFiltersParams {
  pinnedFilterIds: string[]
  filters: {
    properties: Record<string, string[]>
    dateRanges: Record<string, DateRangeFilter>
  }
  lifecycleStages: { id: string; name: string; color: string; is_active: boolean }[]
  owners: Profile[]
  handleSetProperty: (id: string, values: string[]) => void
  handleToggleProperty: (id: string, value: string) => void
  updateDateRange: (id: string, val: DateRangeFilter) => void
}

export function useActiveFilters({
  pinnedFilterIds,
  filters,
  lifecycleStages,
  owners,
  handleSetProperty,
  handleToggleProperty,
  updateDateRange,
}: UseActiveFiltersParams): GenericActiveFilter[] {
  return React.useMemo(() => {
    return pinnedFilterIds.map(id => {
      // 1. Check for standard filters with specialized UI
      switch (id) {
        case "lifecycle_stage":
          return {
            id: "lifecycle_stage",
            label: "Lifecycle stage",
            type: "simple-property",
            options: lifecycleStages.filter(s => s.is_active).map(s => ({
              value: s.id,
              label: s.name,
              color: s.color,
            })),
            value: filters.properties["lifecycle_stage"] || [],
            onChange: (val: unknown) => handleSetProperty("lifecycle_stage", val as string[]),
          }
        case "contactOwner":
          return {
            id: "contactOwner",
            label: "Contact owner",
            type: "simple-property",
            options: owners.map(o => ({
              value: o.clerk_user_id || o.id,
              label: `${o.first_name || ''} ${o.last_name || ''}`.trim()
            })).filter(opt => opt.label),
            value: (filters.properties["contactOwner"] || []) as string[],
            onChange: (val: unknown) => {
              // val is already an array of owner IDs (from option.value)
              handleSetProperty("contactOwner", val as string[])
            },
          }
        case "createDate":
        case "created_at":
          return {
            id: id,
            label: "Create date",
            type: "date",
            // Support both "createDate" and "created_at" as keys (COLUMN_MAP handles both → created_at)
            value: (filters.dateRanges[id] || filters.dateRanges["createDate"] || filters.dateRanges["created_at"] || "") as DateRangeFilter,
            onChange: (val: unknown) => updateDateRange(id, val as DateRangeFilter),
          }
        case "lastActivity":
          return {
            id: "lastActivity",
            label: "Last Activity...",
            type: "date",
            value: filters.dateRanges["lastActivity"] as DateRangeFilter || "all",
            onChange: (val: unknown) => updateDateRange("lastActivity", val as DateRangeFilter),
          }
        case "leadStatus":
          return {
            id: "leadStatus",
            label: "Lead Status",
            type: "simple-property",
            options: LEAD_STATUS_OPTIONS,
            value: filters.properties["leadStatus"] || [],
            onChange: (val: unknown) => handleSetProperty("leadStatus", val as string[]),
          }
      }

      // 2. Lookup in MORE_FILTERS for dynamic ones
      const flatItems = MORE_FILTERS.flatMap(g => g.items)
      const item = flatItems.find(i => i.id === id)

      if (item) {
        return {
          id: item.id,
          label: item.name,
          // Map internal types to generic bar types
          type: (item.type === "date" ? "date" :
            item.type === "number" ? "number" :
              item.type === "check" ? "simple-property" : "text") as GenericActiveFilter['type'],
          // For picklists, use defined options or fallback to standard ones
          options: item.type === "check" ? (item.options || ["Option 1", "Option 2", "Option 3"]) : undefined,
          value: item.type === "date" ? (filters.dateRanges[item.id] || "all") :
            item.type === "check" ? (filters.properties[item.id] || []) :
              (filters.properties[item.id] || ""),
          onChange: (val: string | string[] | DateRangeFilter) => {
            if (item.type === "date") {
              updateDateRange(item.id, val as DateRangeFilter)
            } else if (item.type === "check") {
              handleSetProperty(item.id, val as string[])
            } else {
              handleToggleProperty(item.id, val as string)
            }
          }
        }
      }

      // 3. Fallback
      return {
        id,
        label: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        type: "generic",
        value: "",
        onChange: () => { },
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinnedFilterIds, filters.properties, filters.dateRanges, handleSetProperty, owners, lifecycleStages, updateDateRange, handleToggleProperty])
}
