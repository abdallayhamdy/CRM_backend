import { laravelApi } from "@/lib/laravel-api"
import {
  formatDisplayValue,
  getFieldLabel,
  getTrackedFieldKeys,
  type PropertyHistoryEntityType,
} from "@/lib/property-history-format"

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

export async function getPropertyHistory(
  entityType: PropertyHistoryEntityType,
  recordId: string,
  limit = 100
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
    for (const change of activity.changes ?? []) {
      if (!trackedKeys.has(change.key)) continue
      const label = getFieldLabel(entityType, change.key)
      if (!label) continue

      const changedBy = activity.owner
        ? [activity.owner.first_name, activity.owner.last_name].filter(Boolean).join(" ").trim() ||
          activity.owner.id ||
          "System"
        : "System"

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
