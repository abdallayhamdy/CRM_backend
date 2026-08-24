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
