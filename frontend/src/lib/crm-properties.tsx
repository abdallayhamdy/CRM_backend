"use client"

export interface CrmProperty {
  id: string
  label: string
  rootlineKey?: string
  type: "text" | "email" | "tel" | "select" | "lifecycle" | "date" | "number" | "enumeration"
  description?: string
}

export interface CrmPropertyGroup {
  title: string
  items: CrmProperty[]
}

export const PROPERTY_GROUPS_CONFIG: CrmPropertyGroup[] = [
  {
    title: "CONTACT INFORMATION",
    items: [
      { id: "first_name", label: "First Name", type: "text" },
      { id: "last_name", label: "Last Name", type: "text" },
      { id: "email", label: "Email", type: "email" },
      { id: "phone", label: "Phone Number", type: "tel" },
      { id: "mobile_phone", label: "Mobile Phone Number", type: "tel" },
      { id: "company_name", label: "Company Name", type: "text" },
      { id: "job_title", label: "Job Title", type: "text" },
      { id: "city", label: "City", type: "text" },
      { id: "country", label: "Country/Region", type: "text" },
      { id: "website", label: "Website URL", type: "text" },
    ]
  },
  {
    title: "SALES PROPERTIES",
    items: [
      { id: "owner", label: "Contact owner", type: "select" },
      { id: "lead_status", label: "Lead status", type: "select" },
    ]
  },
  {
    title: "SOCIAL MEDIA INFORMATION",
    items: [
      { id: "linkedin_url", label: "LinkedIn URL", type: "text" },
    ]
  },
  {
    title: "CONTACT ACTIVITY",
    items: [
      { id: "act_status", label: "Status", type: "select" },
      { id: "act_message", label: "Message", type: "text" },
    ]
  },
]

export const getModulePropertyGroups = (_module: string) => {
  return PROPERTY_GROUPS_CONFIG
}

// --- DB-backed converters ---

import { PropertyFromDB } from "@/hooks/use-properties"
import type { ColumnDef } from "@tanstack/react-table"
import type { SidebarFilterConfig } from "@/components/crm/CrmFilterSidebar"

function fieldTypeToColumnType(fieldType: string): CrmProperty["type"] {
  if (["number", "currency", "percent"].includes(fieldType)) return "number"
  if (fieldType === "email") return "email"
  if (fieldType === "phone_number") return "tel"
  if (["dropdown_select", "radio_select"].includes(fieldType)) return "select"
  if (["date_picker", "date_time_picker"].includes(fieldType)) return "date"
  if (fieldType === "owner") return "select"
  return "text"
}

export function propertiesToGroups(properties: PropertyFromDB[]): CrmPropertyGroup[] {
  const groupMap = new Map<string, CrmProperty[]>()

  properties.forEach(prop => {
    const group = prop.group_name || "Other"
    if (!groupMap.has(group)) groupMap.set(group, [])
    groupMap.get(group)!.push({
      id: prop.name,
      label: prop.label,
      type: fieldTypeToColumnType(prop.field_type),
    })
  })

  return Array.from(groupMap.entries()).map(([title, items]) => ({
    title: title.toUpperCase(),
    items
  }))
}

export type MoreFilterType =
  | "text" | "date" | "number" | "check" | "link" | "arrows" | "fx" | "code"

export interface MoreFilterItem {
  id: string
  name: string
  type: MoreFilterType
}

export interface MoreFilterCategory {
  category: string
  items: MoreFilterItem[]
}

// Custom properties are stored in custom_fields JSON on the record and filtered
// through the services' "custom_" prefix convention. Helpers below centralize
// that convention for the "+ More" quick filters and the Advanced-filters sidebar.
export function propertyKey(prop: PropertyFromDB): string {
  return `custom_${prop.name}`
}

export function stripPropertyPrefix(key: string): string {
  return key.startsWith("custom_") ? key.slice("custom_".length) : key
}

export function isCustomPropertyKey(key: string): boolean {
  return key.startsWith("custom_")
}

// Map a backend property field_type to the more-filter item type used by the
// "+ More" quick-filter popover and the active-filter chips.
export function fieldTypeToMoreFilterType(fieldType: string): MoreFilterType {
  if (["date_picker", "date_time_picker", "datetime"].includes(fieldType)) return "date"
  if (["number", "currency", "percent"].includes(fieldType)) return "number"
  if (["dropdown_select", "radio_select", "enumeration", "multi_checkbox", "multiple_checkboxes", "multi_select", "boolean_checkbox", "boolean"].includes(fieldType)) return "check"
  return "text"
}

// Group real DB-backed properties into categories suitable for the "+ More"
// quick-filter popover. Only non-archived, displayable properties are listed so
// every entry maps to a real, filterable field. `excludeNames` removes property
// names that have dedicated (special) filter handling on the page.
export function propertiesToMoreFilters(properties: PropertyFromDB[], excludeNames: string[] = []): MoreFilterCategory[] {
  const exclude = new Set(excludeNames)
  const groupMap = new Map<string, MoreFilterItem[]>()

  properties
    .filter(p => !p.is_archived && !exclude.has(p.name))
    .forEach(prop => {
      const group = prop.group_name || "Other"
      if (!groupMap.has(group)) groupMap.set(group, [])
      groupMap.get(group)!.push({
        id: propertyKey(prop),
        name: prop.label || prop.name,
        type: fieldTypeToMoreFilterType(prop.field_type),
      })
    })

  return Array.from(groupMap.entries()).map(([category, items]) => ({ category, items }))
}

export function findProperty(properties: PropertyFromDB[], name: string): PropertyFromDB | undefined {
  return properties.find(p => p.name === name || p.id === name)
}

// Build a categorized Advanced-filters sidebar config from real DB-backed
// properties. Item ids use the "custom_" prefix so filters map 1:1 to actual
// stored custom field data through the services' routing convention.
export function propertiesToSidebarCategories(properties: PropertyFromDB[]): { category: string; items: SidebarFilterConfig[] }[] {
  return propertiesToMoreFilters(properties).map(group => ({
    category: group.category,
    items: group.items.map(item => {
      const prop = findProperty(properties, stripPropertyPrefix(item.id))
      const options = prop?.options
        ? prop.options.map(o => typeof o === "string" ? o : (o.label || o.value || o.name || "")).filter(Boolean)
        : undefined
      const isBoolean = prop?.field_type === "boolean_checkbox" || prop?.field_type === "boolean"
      if (item.type === "check") {
        return { id: item.id, label: item.name, type: "property", options: isBoolean ? ["Yes", "No"] : (options && options.length ? options : undefined) }
      }
      if (item.type === "number") return { id: item.id, label: item.name, type: "number" }
      if (item.type === "date") return { id: item.id, label: item.name, type: "date" }
      return { id: item.id, label: item.name, type: "text" }
    }),
  }))
}

export function propertiesToColumnDefs<TData>(
  properties: PropertyFromDB[]
): ColumnDef<TData, unknown>[] {
  return properties.map(prop => ({
    id: prop.name,
    accessorFn: (row: any) => {
      const topVal = row[prop.name]
      if (topVal !== undefined && topVal !== null) return topVal
      return row.custom_fields?.[prop.name]
    },
    header: prop.label,
    cell: ({ getValue }) => {
      const value = getValue()
      if (value === null || value === undefined)
        return <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Empty</span>
      if (prop.field_type === "number" || prop.field_type === "currency")
        return <span>{Number(value).toLocaleString()}</span>
      return <span>{String(value)}</span>
    }
  }))
}
