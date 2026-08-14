import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns"

interface ChangeSet {
  old: Record<string, any>
  new: Record<string, any>
}

export function isChangeDescription(description: string | null | undefined): boolean {
  if (!description) return false
  try {
    const parsed = JSON.parse(description)
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      "old" in parsed &&
      "new" in parsed &&
      typeof parsed.old === "object" &&
      typeof parsed.new === "object"
    )
  } catch {
    return false
  }
}

export function parseChangeSet(description: string): ChangeSet | null {
  try {
    const parsed = JSON.parse(description)
    if (parsed && typeof parsed === "object" && "old" in parsed && "new" in parsed) {
      return { old: parsed.old || {}, new: parsed.new || {} }
    }
  } catch {}
  return null
}

const SKIP_FIELDS = new Set([
  "updated_at", "created_at", "workspace_id", "id",
])

const FIELD_LABELS: Record<string, string> = {
  status: "Status",
  owner_id: "Owner",
  assignee_id: "Assignee",
  assigned_to: "Assigned to",
  contact_id: "Contact",
  company_id: "Company",
  deal_id: "Deal",
  ticket_id: "Ticket",
  first_name: "First name",
  last_name: "Last name",
  email: "Email",
  phone: "Phone",
  title: "Title",
  name: "Name",
  subject: "Subject",
  description: "Description",
  content: "Content",
  type: "Type",
  priority: "Priority",
  stage: "Stage",
  value: "Value",
  amount: "Amount",
  due_date: "Due date",
  activity_date: "Activity date",
  completed: "Completed",
  deal_stage: "Deal stage",
  lifecycle_stage: "Lifecycle stage",
  lead_status: "Lead status",
  job_title: "Job title",
  website: "Website",
  address: "Address",
  city: "City",
  country: "Country",
  notes: "Notes",
  tags: "Tags",
}

const ENUM_VALUES: Record<string, Record<string, string>> = {
  status: {
    active: "Active",
    inactive: "Inactive",
    archived: "Archived",
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    open: "Open",
    closed: "Closed",
    won: "Won",
    lost: "Lost",
    contacted: "Contacted",
    qualified: "Qualified",
    unqualified: "Unqualified",
    new: "New",
    proposal: "Proposal",
    negotiation: "Negotiation",
    discovery: "Discovery",
    proposal_sent: "Proposal Sent",
    contract_sent: "Contract Sent",
    verbal_agreement: "Verbal Agreement",
  },
  lifecycle_stage: {
    lead: "Lead",
    mql: "MQL",
    sql: "SQL",
    opportunity: "Opportunity",
    customer: "Customer",
    churned: "Churned",
  },
  lead_status: {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    unqualified: "Unqualified",
    nurturing: "Nurturing",
  },
  type: {
    call: "Call",
    email: "Email",
    meeting: "Meeting",
    task: "Task",
    note: "Note",
    system: "System",
  },
  completed: {
    true: "Yes",
    "1": "Yes",
    false: "No",
    "0": "No",
  },
}

const ENTITY_NAME_FIELDS = new Set([
  "contact_id", "company_id", "deal_id", "ticket_id",
  "owner_id", "assigned_to", "assignee_id", "user_id",
])

function formatFieldValue(field: string, value: any): string {
  if (value === null || value === undefined) return "—"
  if (value === "" || value === false) return "—"

  const enumGroup = ENUM_VALUES[field]
  if (enumGroup) {
    const strVal = String(value).toLowerCase()
    return enumGroup[strVal] || String(value)
  }

  if (field.includes("date") || field.includes("_at")) {
    try {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        return format(d, "MMM d, yyyy 'at' h:mm a")
      }
    } catch {}
  }

  if (typeof value === "boolean") return value ? "Yes" : "No"

  return String(value)
}

export interface ChangeDetail {
  field: string
  fieldLabel: string
  oldValue: string
  newValue: string
}

export function parseChanges(description: string): ChangeDetail[] {
  const changeSet = parseChangeSet(description)
  if (!changeSet) return []

  const changes: ChangeDetail[] = []
  const allKeys = new Set([...Object.keys(changeSet.old), ...Object.keys(changeSet.new)])

  for (const key of allKeys) {
    if (SKIP_FIELDS.has(key)) continue

    const oldVal = changeSet.old[key]
    const newVal = changeSet.new[key]

    if (oldVal === newVal) continue
    if (oldVal === undefined && newVal === undefined) continue
    if (oldVal === null && newVal === null) continue

    const fieldLabel = FIELD_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

    changes.push({
      field: key,
      fieldLabel,
      oldValue: formatFieldValue(key, oldVal),
      newValue: formatFieldValue(key, newVal),
    })
  }

  return changes
}

export function getActionVerb(type: string, entityName?: string | null): string {
  const name = entityName || "record"
  switch (type) {
    case "created":
      return `created ${name}`
    case "updated":
      return `updated ${name}`
    case "deleted":
      return `deleted ${name}`
    case "call":
      return "logged a call"
    case "email":
      return "sent an email"
    case "meeting":
      return "scheduled a meeting"
    case "note":
      return "added a note"
    case "task":
      return "updated a task"
    case "system":
      return "system activity"
    default:
      return `logged ${type.replace(/_/g, " ")}`
  }
}

export function getActivityIcon(type: string): string {
  switch (type) {
    case "created": return "created"
    case "updated": return "updated"
    case "deleted": return "deleted"
    case "call": return "call"
    case "email": return "email"
    case "meeting": return "meeting"
    case "note": return "note"
    case "task": return "task"
    case "system": return "system"
    default: return "other"
  }
}

export function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ""
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return ""
  }
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ""
    if (isToday(d)) return "Today"
    if (isYesterday(d)) return "Yesterday"
    if (isThisWeek(d)) return format(d, "EEEE")
    return format(d, "MMM d, yyyy")
  } catch {
    return ""
  }
}

export function groupActivitiesByDate<T extends { created_at: string }>(
  items: T[]
): { label: string; items: T[] }[] {
  const groups = new Map<string, T[]>()

  for (const item of items) {
    const label = formatDate(item.created_at)
    const key = label || "Older"
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }))
}
