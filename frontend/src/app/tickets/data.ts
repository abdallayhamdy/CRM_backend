export interface Ticket {
  id: string
  name: string
  pipeline: string
  status: string
  createDate: string
  priority: 'High' | 'Medium' | 'Low'
  owner: {
    name: string
    avatar?: string
  }
  source: string
}

export const tickets: Ticket[] = [
  {
    id: "1",
    name: "sup",
    pipeline: "Support Pipeline",
    status: "New (Support Pipeline)",
    createDate: "Apr 30, 2026 12:49 AM GMT+3",
    priority: "High",
    owner: {
      name: "VS Realstate agency n/...",
    },
    source: "Chat"
  }
]

export const TICKET_OWNERS = [
  "Unassigned", "VS Realstate agency n/..."
]

export const TICKET_PRIORITIES = [
  "High", "Medium", "Low"
]
