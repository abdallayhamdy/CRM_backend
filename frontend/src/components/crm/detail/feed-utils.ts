import { ALL_ACTIVITY_TYPES } from "@/components/activity/ActivityFilterPopover"

export interface FeedItem {
  id: string
  feedType: "note" | "activity"
  created_at?: string | null
  due_date?: string | null
  type?: string | null
  content?: string | null
  title?: string | null
  description?: string | null
  owner_id?: string | null
  created_by?: string | null
  completed?: boolean | null
  workspace_id?: string | null
  [key: string]: unknown
}

export interface FeedFilters {
  selectedFilters: string[]
  activeTab: string
  searchTerm: string
  timeFilter: string
  assignedToFilter: string
}

export function buildCombinedFeed(
  notes: any[],
  activities: any[],
  extraItems: any[] = [],
  filters: FeedFilters
): FeedItem[] {
  const notesItems = notes.map((n: any) => ({ ...n, feedType: "note" as const }))
  const activitiesItems = activities.map((a: any) => ({ ...a, feedType: "activity" as const }))
  const extras = extraItems.map((e: any) => ({
    ...e,
    feedType: "activity" as const,
    type: e.type || "ticket",
  }))

  let all = [...notesItems, ...activitiesItems, ...extras].sort((a: any, b: any) => {
    const dateA = new Date(a.created_at || a.due_date || 0).getTime()
    const dateB = new Date(b.created_at || b.due_date || 0).getTime()
    return dateB - dateA
  })

  if (filters.activeTab !== "all") {
    all = all.filter((item: any) => {
      if (filters.activeTab === "notes") return item.feedType === "note"
      if (filters.activeTab === "tasks") return item.feedType === "activity" && item.type === "task"
      if (filters.activeTab === "tickets") return item.feedType === "activity" && item.type === "ticket"
      if (filters.activeTab === "activities")
        return item.feedType === "activity" && item.type !== "task" && item.type !== "ticket"
      if (filters.activeTab === "emails") return item.feedType === "activity" && item.type === "email"
      if (filters.activeTab === "calls") return item.feedType === "activity" && item.type === "call"
      if (filters.activeTab === "meetings") return item.feedType === "activity" && item.type === "meeting"
      return true
    })
  }

  all = all.filter((item: any) => {
    if (item.feedType === "note") {
      return filters.selectedFilters.includes("Notes")
    }
    const typeMap: Record<string, string> = {
      call: "Calls",
      email: "Emails",
      meeting: "Meetings",
      task: "Tasks",
      ticket: "Tickets",
      lifecycle_change: "Lifecycle changes",
      ticket_activity: "Ticket activity",
    }
    const label = typeMap[item.type]
    if (label) return filters.selectedFilters.includes(label)
    return true
  })

  if (filters.searchTerm) {
    const lower = filters.searchTerm.toLowerCase()
    all = all.filter((item: any) => {
      const content = ("content" in item ? item.content : "") || ""
      const title = ("title" in item ? item.title : "") || ""
      const description = ("description" in item ? item.description : "") || ""
      return (
        content.toLowerCase().includes(lower) ||
        title.toLowerCase().includes(lower) ||
        description.toLowerCase().includes(lower)
      )
    })
  }

  if (filters.timeFilter !== "all") {
    const now = new Date()
    all = all.filter((item: any) => {
      const itemDate = new Date(item.created_at || item.due_date || 0)
      if (filters.timeFilter === "today") return itemDate.toDateString() === now.toDateString()
      if (filters.timeFilter === "yesterday") {
        const y = new Date(now)
        y.setDate(now.getDate() - 1)
        return itemDate.toDateString() === y.toDateString()
      }
      if (filters.timeFilter === "this-week") {
        const w = new Date(now)
        w.setDate(now.getDate() - 7)
        return itemDate >= w
      }
      if (filters.timeFilter === "this-month") {
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
      }
      return true
    })
  }

  if (filters.assignedToFilter !== "all") {
    all = all.filter((item: any) => {
      const ownerId = "owner_id" in item ? item.owner_id : null
      const createdBy = "created_by" in item ? item.created_by : null
      return ownerId === filters.assignedToFilter || createdBy === filters.assignedToFilter
    })
  }

  return all as FeedItem[]
}

export function buildFeedCounts(
  notes: any[],
  activities: any[],
  extraItems: any[] = []
): { all: number; notes: number; tasks: number; tickets: number; calls: number } {
  const notesItems = notes.map((n: any) => ({ ...n, feedType: "note" as const }))
  const activitiesItems = activities.map((a: any) => ({ ...a, feedType: "activity" as const }))
  const extras = extraItems.map((e: any) => ({ ...e, feedType: "activity" as const, type: e.type || "ticket" }))
  const all = [...notesItems, ...activitiesItems, ...extras]
  return {
    all: all.length,
    notes: all.filter((i) => i.feedType === "note").length,
    tasks: all.filter((i) => i.feedType === "activity" && i.type === "task").length,
    tickets: all.filter((i) => i.feedType === "activity" && i.type === "ticket").length,
    calls: all.filter((i) => i.feedType === "activity" && i.type === "call").length,
  }
}

export function buildGroupedHistory(combinedFeed: FeedItem[]): Record<string, FeedItem[]> {
  const historyItems = combinedFeed.filter(
    (item) => !(item.feedType === "activity" && item.type === "task" && !item.completed)
  )
  const groups: Record<string, FeedItem[]> = {}
  historyItems.forEach((item) => {
    const date = new Date(item.created_at || (item as any).due_date || 0)
    const monthYear = date.toLocaleString("en-US", { month: "long", year: "numeric" })
    if (!groups[monthYear]) groups[monthYear] = []
    groups[monthYear].push(item)
  })
  return groups
}

export function buildUpcomingTasks(combinedFeed: FeedItem[]): FeedItem[] {
  return combinedFeed.filter(
    (item) => item.feedType === "activity" && item.type === "task" && !item.completed
  )
}
