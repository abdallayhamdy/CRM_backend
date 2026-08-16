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
    title: "CONTACT ACTIVITY",
    items: [
      { id: "act_membership_notes", label: "Membership notes", type: "text" },
      { id: "act_message", label: "Message", type: "text" },
      { id: "act_status", label: "Status", type: "select" },
    ]
  },
  {
    title: "CONTACT INFORMATION",
    items: [
      { id: "annual_revenue", label: "Annual Revenue", type: "number" },
      { id: "chat_iql_date", label: "Chat Assistant IQL Date", type: "date" },
      { id: "chat_source", label: "Chat Assistant Source", type: "text" },
      { id: "chat_summary", label: "Chat Assistant: Summary", type: "text" },
      { id: "city", label: "City", type: "text" },
      { id: "company_name", label: "Company Name", type: "text" },
      { id: "country", label: "Country/Region", type: "text" },
      { id: "country_code", label: "Country/Region Code", type: "text" },
      { id: "email", label: "Email", type: "email" },
      { id: "employment_role", label: "Employment Role", type: "text" },
      { id: "employment_seniority", label: "Employment Seniority", type: "text" },
      { id: "employment_sub_role", label: "Employment Sub Role", type: "text" },
      { id: "fav_topics", label: "Favorite Content Topics", type: "text" },
      { id: "fax", label: "Fax Number", type: "tel" },
      { id: "first_name", label: "First Name", type: "text" },
      { id: "full_name", label: "Full Name", type: "text" },
      { id: "industry", label: "Industry", type: "select" },
      { id: "inferred_langs", label: "Inferred Language Codes", type: "text" },
      { id: "job_title", label: "Job Title", type: "text" },
      { id: "last_name", label: "Last Name", type: "text" },
      { id: "lifecycle_stage", label: "Lifecycle Stage", type: "lifecycle" },
      { id: "member_email", label: "Member email", type: "email" },
      { id: "mobile_phone", label: "Mobile Phone Number", type: "tel" },
      { id: "num_employees", label: "Number of Employees", type: "number" },
      { id: "persona", label: "Persona", type: "select" },
      { id: "phone", label: "Phone Number", type: "tel" },
      { id: "postal_code", label: "Postal Code", type: "text" },
      { id: "pref_channels", label: "Preferred channels", type: "text" },
      { id: "pref_lang", label: "Preferred language", type: "select" },
      { id: "prospect_last_enrolled", label: "Prospecting Agent Last Enrolled", type: "date" },
      { id: "prospect_total_count", label: "Prospecting Agent Total Enrolled Count", type: "number" },
      { id: "salutation", label: "Salutation", type: "text" },
      { id: "state_region", label: "State/Region", type: "text" },
      { id: "state_region_code", label: "State/Region Code", type: "text" },
      { id: "street_address", label: "Street Address", type: "text" },
      { id: "timezone", label: "Time Zone", type: "text" },
      { id: "twitter", label: "Twitter Username", type: "text" },
      { id: "website", label: "Website URL", type: "text" },
      { id: "whatsapp", label: "WhatsApp Phone Number", type: "tel" },
      { id: "createDate", label: "Create Date", type: "date" },
    ]
  },
  {
    title: "CONVERSION INFORMATION",
    items: [
      { id: "fb_click_id", label: "Facebook click id", type: "text" },
      { id: "google_click_id", label: "Google ad click id", type: "text" },
      { id: "linkedin_click_id", label: "LinkedIn click id", type: "text" },
      { id: "tiktok_click_id", label: "TikTok click id", type: "text" },
    ]
  },
  {
    title: "DEAL INFORMATION",
    items: [
      { id: "buying_role", label: "Buying Role", type: "enumeration" },
      { id: "deal_close_date", label: "Close Date", type: "date" },
    ]
  },
  {
    title: "EMAIL INFORMATION",
    items: [
      { id: "email_quarantine_reason", label: "Email address quarantine reason", type: "text" },
      { id: "email_type", label: "Email type", type: "select" },
      { id: "email_legal_basis", label: "Legal basis for processing contact's data", type: "select" },
    ]
  },
  {
    title: "FACEBOOK ADS PROPERTIES",
    items: [
      { id: "fb_company_size", label: "Company size", type: "text" },
      { id: "fb_dob", label: "Date of birth", type: "date" },
      { id: "fb_degree", label: "Degree", type: "text" },
      { id: "fb_field_study", label: "Field of study", type: "text" },
      { id: "fb_gender", label: "Gender", type: "select" },
      { id: "fb_grad_date", label: "Graduation date", type: "date" },
      { id: "fb_job_function", label: "Job function", type: "text" },
      { id: "fb_marital", label: "Marital Status", type: "select" },
      { id: "fb_military", label: "Military status", type: "text" },
      { id: "fb_rel_status", label: "Relationship Status", type: "select" },
      { id: "fb_school", label: "School", type: "text" },
      { id: "fb_seniority", label: "Seniority", type: "text" },
      { id: "fb_start_date", label: "Start date", type: "date" },
      { id: "fb_work_email", label: "Work email", type: "email" },
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
    title: "WEB ANALYTICS HISTORY",
    items: [
      { id: "latest_traffic_source", label: "Latest Traffic Source", type: "text" },
      { id: "latest_traffic_source_date", label: "Latest Traffic Source Date", type: "date" },
      { id: "orig_traffic_source", label: "Original Traffic Source", type: "text" },
    ]
  }
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
