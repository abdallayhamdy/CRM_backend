import { laravelApi } from "@/lib/laravel-api"
import {
  formatDisplayValue,
  getFieldLabel,
  getTrackedFieldKeys,
  type PropertyHistoryEntityType,
} from "@/lib/property-history-format"
import type { PropertyFromDB } from "@/hooks/use-properties"

export interface PropertyHistoryEntry {
  id: string
  entity_type: PropertyHistoryEntityType
  entity_id: string
  property_key: string
  property_label: string
  changed_to: string
  changed_to_display: string
  changed_at: string
  source: string
  changed_by: string
  changed_by_avatar: string | null
}

interface ActivityChange {
  key: string
  old?: unknown
  new?: unknown
}

interface ActivityOwner {
  id?: string
  first_name?: string
  last_name?: string
}

interface ActivityItem {
  id: string
  type: string
  entity_type?: string | null
  entity_id?: string | null
  activity_date?: string | null
  created_at: string
  changes?: ActivityChange[]
  owner?: ActivityOwner | null
  owner_id?: string | null
}

function formatCustomPropertyValue(
  value: unknown,
  propDef?: PropertyFromDB
): string {
  if (value === null || value === undefined || value === "") return "--"
  if (!propDef) return String(value)

  const choiceTypes = ["dropdown_select", "radio_select", "multi_select", "multi_checkbox", "multiple_checkboxes"]

  if (propDef.field_type === "boolean" || propDef.field_type === "boolean_checkbox") {
    return value === true || value === "1" || value === "true" || value === "Yes" ? "Yes" : "No"
  }

  if (choiceTypes.includes(propDef.field_type) && propDef.options) {
    const raw = Array.isArray(value) ? value : [value]
    return raw.map(v => {
      const match = propDef.options!.find(o =>
        typeof o === "string" ? o === v : (o.value === v || o.name === v || o.internal_name === v || o.label === v)
      )
      if (match && typeof match !== "string") return match.label || match.name || String(v)
      return String(v)
    }).join(", ")
  }

  if (propDef.field_type === "date" || propDef.field_type === "datetime") {
    try {
      const d = new Date(String(value))
      if (!isNaN(d.getTime())) return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } catch { /* fall through */ }
  }

  return String(value)
}

export async function getPropertyHistory(
  entityType: PropertyHistoryEntityType,
  recordId: string,
  limit = 100,
  properties: PropertyFromDB[] = []
): Promise<PropertyHistoryEntry[]> {
  if (!recordId) return []

  const { data, error } = await laravelApi.get<{ data: ActivityItem[] }>("/activities", {
    entity_type: entityType,
    record_id: recordId,
    type: "updated",
    limit,
  })
  if (error) return []

  const trackedKeys = getTrackedFieldKeys(entityType)
  const entries: PropertyHistoryEntry[] = []

  for (const activity of data?.data ?? []) {
    const changedBy = activity.owner
      ? [activity.owner.first_name, activity.owner.last_name].filter(Boolean).join(" ").trim() ||
        activity.owner.id ||
        "System"
      : "System"

    for (const change of activity.changes ?? []) {
      if (change.key === "custom_data") {
        const oldCustom = (typeof change.old === "object" && change.old !== null ? change.old : {}) as Record<string, unknown>
        const newCustom = (typeof change.new === "object" && change.new !== null ? change.new : {}) as Record<string, unknown>
        const allKeys = new Set([...Object.keys(oldCustom), ...Object.keys(newCustom)])

        for (const cKey of allKeys) {
          const oldVal = oldCustom[cKey]
          const newVal = newCustom[cKey]
          if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue

          const propDef = properties.find(p => p.name === cKey)
          const label = propDef?.label ?? cKey

          entries.push({
            id: `${activity.id}:custom_${cKey}`,
            entity_type: entityType,
            entity_id: activity.entity_id || recordId,
            property_key: `custom_${cKey}`,
            property_label: label,
            changed_to: String(newVal ?? ""),
            changed_to_display: formatCustomPropertyValue(newVal, propDef),
            changed_at: activity.activity_date || activity.created_at,
            source: "CRM UI",
            changed_by: changedBy,
            changed_by_avatar: null,
          })
        }
        continue
      }

      if (!trackedKeys.has(change.key)) continue
      const label = getFieldLabel(entityType, change.key)
      if (!label) continue

      entries.push({
        id: `${activity.id}:${change.key}`,
        entity_type: entityType,
        entity_id: activity.entity_id || recordId,
        property_key: change.key,
        property_label: label,
        changed_to: String(change.new ?? ""),
        changed_to_display: formatDisplayValue(entityType, change.key, change.new),
        changed_at: activity.activity_date || activity.created_at,
        source: "CRM UI",
        changed_by: changedBy,
        changed_by_avatar: null,
      })
    }
  }

  return entries
}
