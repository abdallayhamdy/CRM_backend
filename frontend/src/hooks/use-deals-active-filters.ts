"use client"

import { GenericActiveFilter } from "@/components/crm/CrmFilterBar"
import { DateRangeFilter } from "@/hooks/use-crm-filters"
import { DEAL_STAGES } from "@/lib/types/crm"
import { Profile } from "@/lib/types/crm"
import { PropertyFromDB } from "@/hooks/use-properties"
import { fieldTypeToMoreFilterType, findProperty, propertyKey, stripPropertyPrefix } from "@/lib/crm-properties"

interface UseDealsActiveFiltersParams {
  pinnedFilterIds: string[]
  filters: {
    properties: Record<string, string[]>
    dateRanges: Record<string, DateRangeFilter>
  }
  owners: Profile[]
  allOwners: string[]
  properties: PropertyFromDB[]
  toggleProperty: (id: string, value: string) => void
  updateDateRange: (id: string, val: DateRangeFilter) => void
  handleSetProperty: (id: string, values: string[]) => void
  handleToggleProperty: (id: string, value: string) => void
}

function propertyOptions(prop: PropertyFromDB): string[] {
  const raw = prop.options || []
  return raw.map(o => typeof o === "string" ? o : (o.label || o.value || o.name || "")).filter(Boolean)
}

export function useDealsActiveFilters({
  pinnedFilterIds,
  filters,
  owners,
  allOwners,
  properties,
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
      return { id: "owner", label: "Deal owner", type: "searchable-property", options: allOwners, value: filters.properties["owner"] || [], onChange: (val: any) => handleSetProperty("owner", Array.isArray(val) ? val : [val]) }
    }
    if (id === "stage") {
      return { id: "stage", label: "Deal stage", type: "simple-property", options: [...DEAL_STAGES], value: filters.properties["stage"] || [], onChange: (val: any) => handleSetProperty("stage", Array.isArray(val) ? val : [val]) }
    }
    if (id === "closeDate") {
      return { id: "closeDate", label: "Close date", type: "date", value: filters.dateRanges["closeDate"] || "all", onChange: (val: string) => updateDateRange("closeDate", val as any) }
    }

    // Dynamic filters from real DB-backed properties (custom_ prefixed)
    const prop = findProperty(properties, stripPropertyPrefix(id))
    if (prop) {
      const key = propertyKey(prop)
      const ptype = fieldTypeToMoreFilterType(prop.field_type)
      if (ptype === "date") {
        return { id: key, label: prop.label || prop.name, type: "date", value: filters.dateRanges[key] || "all", onChange: (val: string) => updateDateRange(key, val as any) }
      }
      if (ptype === "number") {
        return {
          id: key,
          label: prop.label || prop.name,
          type: "number",
          value: (filters.properties[key] ? (() => { try { return JSON.parse(filters.properties[key][0] || "null") || null } catch { return null } })() : null),
          onChange: (val: any) => handleSetProperty(key, [JSON.stringify(val)]),
        }
      }
      if (ptype === "check") {
        const isBoolean = prop.field_type === "boolean_checkbox" || prop.field_type === "boolean"
        const options = propertyOptions(prop)
        return { id: key, label: prop.label || prop.name, type: "simple-property", options: isBoolean ? ["Yes", "No"] : (options.length ? options : []), value: filters.properties[key] || [], onChange: (val: any) => handleSetProperty(key, Array.isArray(val) ? val : [val]) }
      }
      return { id: key, label: prop.label || prop.name, type: "generic", value: filters.properties[key]?.[0] || "", onChange: (val: any) => handleToggleProperty(key, val) }
    }

    return null
  }).filter(Boolean) as GenericActiveFilter[]
}
