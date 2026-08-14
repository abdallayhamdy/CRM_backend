import { format } from "date-fns"
import { CONTACT_FIELD_CONFIG, type FieldConfig } from "@/lib/field-configs/contacts"
import { COMPANY_FIELD_CONFIG } from "@/lib/field-configs/companies"
import { DEAL_FIELD_CONFIG } from "@/lib/field-configs/deals"
import { NOTES_FIELD_CONFIG } from "@/lib/field-configs/notes"
import { ORDER_FIELD_CONFIG } from "@/lib/field-configs/orders"
import { PRODUCT_FIELD_CONFIG } from "@/lib/field-configs/products"
import { TASK_FIELD_CONFIG } from "@/lib/field-configs/tasks"
import { TICKET_FIELD_CONFIG } from "@/lib/field-configs/tickets"

export type PropertyHistoryEntityType =
  | "task"
  | "contact"
  | "note"
  | "company"
  | "deal"
  | "product"
  | "order"
  | "ticket"

const ENTITY_FIELD_CONFIGS: Record<PropertyHistoryEntityType, FieldConfig[]> = {
  task: TASK_FIELD_CONFIG,
  contact: CONTACT_FIELD_CONFIG,
  note: NOTES_FIELD_CONFIG,
  company: COMPANY_FIELD_CONFIG,
  deal: DEAL_FIELD_CONFIG,
  product: PRODUCT_FIELD_CONFIG,
  order: ORDER_FIELD_CONFIG,
  ticket: TICKET_FIELD_CONFIG,
}

export interface HistoryKeyMapping {
  configKey: string
  label?: string
}

export const HISTORY_KEY_ALIASES: Record<PropertyHistoryEntityType, Record<string, HistoryKeyMapping>> = {
  task: {
    status: { configKey: "completed" },
    assigned_to: { configKey: "owner_id", label: "Assignee" },
  },
  contact: {
    assigned_to: { configKey: "owner_id", label: "Owner" },
  },
  note: {},
  company: {},
  deal: {},
  product: {},
  order: {},
  ticket: {},
}

export function getFieldConfigForEntity(entityType: PropertyHistoryEntityType): FieldConfig[] {
  return ENTITY_FIELD_CONFIGS[entityType] ?? []
}

export function resolveConfigKey(entityType: PropertyHistoryEntityType, key: string): HistoryKeyMapping | null {
  const alias = HISTORY_KEY_ALIASES[entityType]?.[key]
  if (alias) return alias
  if (getFieldConfigForEntity(entityType).some((f) => f.key === key)) return { configKey: key }
  return null
}

export function getTrackedFieldKeys(entityType: PropertyHistoryEntityType): Set<string> {
  const keys = getFieldConfigForEntity(entityType)
    .filter((f) => f.editable && f.key !== "created_at" && f.key !== "updated_at")
    .map((f) => f.key)
  return new Set([...keys, ...Object.keys(HISTORY_KEY_ALIASES[entityType] ?? {})])
}

export function getTrackedFieldOptions(entityType: PropertyHistoryEntityType): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = getFieldConfigForEntity(entityType)
    .filter((f) => f.editable && f.key !== "created_at")
    .map((f) => ({ value: f.key, label: f.label }))
  for (const [aliasKey, mapping] of Object.entries(HISTORY_KEY_ALIASES[entityType] ?? {})) {
    options.push({ value: aliasKey, label: mapping.label ?? getFieldLabel(entityType, aliasKey) ?? aliasKey })
  }
  return options
}

export function isOwnerField(entityType: PropertyHistoryEntityType, key: string): boolean {
  const mapping = resolveConfigKey(entityType, key)
  if (!mapping) return false
  return getFieldConfigForEntity(entityType).find((f) => f.key === mapping.configKey)?.type === "owner"
}

export function getFieldLabel(entityType: PropertyHistoryEntityType, key: string): string | null {
  const mapping = resolveConfigKey(entityType, key)
  if (!mapping) return null
  if (mapping.label) return mapping.label
  return getFieldConfigForEntity(entityType).find((f) => f.key === mapping.configKey)?.label ?? null
}

function formatSelectValue(rawValue: string | null | undefined, options?: { value: string; label: string }[]): string {
  if (rawValue === null || rawValue === undefined || rawValue === "") return "--"
  if (options) {
    const match = options.find((o) => o.value === rawValue)
    if (match) return match.label
  }
  return rawValue
}

function formatToggleValue(rawValue: unknown, key: string): string {
  if (key === "completed") {
    if (rawValue === true || rawValue === 1 || rawValue === "1" || rawValue === "completed") return "Completed"
    if (rawValue === false || rawValue === 0 || rawValue === "0" || rawValue === "pending") return "Pending"
    return "--"
  }
  if (rawValue === true || rawValue === 1 || rawValue === "1") return "Yes"
  if (rawValue === false || rawValue === 0 || rawValue === "0") return "No"
  return "--"
}

function formatDateValue(rawValue: string | null | undefined): string {
  if (!rawValue) return "--"
  try {
    const date = new Date(rawValue)
    if (isNaN(date.getTime())) return rawValue
    return format(date, "MMM d, yyyy")
  } catch {
    return rawValue
  }
}

export function formatDisplayValue(
  entityType: PropertyHistoryEntityType,
  key: string,
  rawValue: unknown,
  resolver?: (id: string) => string | undefined
): string {
  const mapping = resolveConfigKey(entityType, key)
  if (!mapping) return String(rawValue ?? "--")
  const config = getFieldConfigForEntity(entityType).find((f) => f.key === mapping.configKey)
  if (!config) return String(rawValue ?? "--")

  switch (config.type) {
    case "select":
    case "lifecycle":
      return formatSelectValue(rawValue as string, config.options)
    case "toggle":
      return formatToggleValue(rawValue, mapping.configKey)
    case "owner":
      if (rawValue === null || rawValue === undefined || rawValue === "") return "Unassigned"
      if (resolver) {
        const name = resolver(String(rawValue))
        if (name) return name
      }
      return String(rawValue)
    case "date":
      return formatDateValue(rawValue as string)
    case "richtext":
      if (rawValue === null || rawValue === undefined || rawValue === "") return "--"
      return String(rawValue).replace(/<[^>]*>/g, "").trim().slice(0, 80) || "--"
    default:
      return String(rawValue ?? "--")
  }
}

export function formatChangedDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return format(date, "MMM d, yyyy")
  } catch {
    return dateStr
  }
}
