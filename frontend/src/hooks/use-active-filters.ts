"use client"

import * as React from "react"
import { GenericActiveFilter } from "@/components/crm/CrmFilterBar"
import { DateRangeFilter } from "@/hooks/use-crm-filters"
import { LEAD_STATUS_OPTIONS } from "@/lib/crm-constants"
import { Profile } from "@/lib/types/crm"
import { PropertyFromDB } from "@/hooks/use-properties"
import { fieldTypeToMoreFilterType, findProperty, propertyKey, stripPropertyPrefix } from "@/lib/crm-properties"

interface UseActiveFiltersParams {
  pinnedFilterIds: string[]
  filters: {
    properties: Record<string, string[]>
    dateRanges: Record<string, DateRangeFilter>
  }
  lifecycleStages: { id: string; name: string; color: string; is_active: boolean }[]
  owners: Profile[]
  properties: PropertyFromDB[]
  handleSetProperty: (id: string, values: string[]) => void
  handleToggleProperty: (id: string, value: string) => void
  updateDateRange: (id: string, val: DateRangeFilter) => void
}

function propertyOptions(prop: PropertyFromDB): string[] {
  const raw = prop.options || []
  return raw.map(o => typeof o === "string" ? o : (o.label || o.value || o.name || "")).filter(Boolean)
}

export function useActiveFilters({
  pinnedFilterIds,
  filters,
  lifecycleStages,
  owners,
  properties,
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

      // 2. Dynamic filters from real DB-backed properties (pinned ids use the
      // "custom_" prefix so the value stores to the real custom field and the
      // services route it to filter[...], i.e. it actually filters data).
      const propName = stripPropertyPrefix(id)
      const prop = findProperty(properties, propName)
      if (prop) {
        const key = propertyKey(prop)
        const ptype = fieldTypeToMoreFilterType(prop.field_type)
        if (ptype === "date") {
          return {
            id: key,
            label: prop.label || prop.name,
            type: "date",
            value: filters.dateRanges[key] || "all",
            onChange: (val: unknown) => updateDateRange(key, val as DateRangeFilter),
          }
        }
        if (ptype === "number") {
          return {
            id: key,
            label: prop.label || prop.name,
            type: "number",
            value: (filters.properties[key] ? (() => {
              try { return JSON.parse(filters.properties[key][0] || "null") || null } catch { return null }
            })() : null),
            onChange: (val: unknown) => handleSetProperty(key, [JSON.stringify(val)]),
          }
        }
        if (ptype === "check") {
          const options = propertyOptions(prop)
          const isBoolean = prop.field_type === "boolean_checkbox" || prop.field_type === "boolean"
          return {
            id: key,
            label: prop.label || prop.name,
            type: "simple-property",
            options: isBoolean ? ["Yes", "No"] : (options.length ? options : ["Option 1", "Option 2", "Option 3"]),
            value: filters.properties[key] || [],
            onChange: (val: unknown) => handleSetProperty(key, val as string[]),
          }
        }
        // text-type property → generic text filter
        return {
          id: key,
          label: prop.label || prop.name,
          type: "generic",
          value: filters.properties[key]?.[0] || "",
          onChange: (val: unknown) => handleToggleProperty(key, val as string),
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
  }, [pinnedFilterIds, filters.properties, filters.dateRanges, handleSetProperty, owners, lifecycleStages, properties, updateDateRange, handleToggleProperty])
}
