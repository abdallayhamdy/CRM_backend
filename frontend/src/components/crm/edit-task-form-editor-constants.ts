import type { Property } from "./edit-contact-form-editor-constants"

export const TASK_DEFAULT_FIELDS: Property[] = [
  { id: "title", label: "Title", required: true, selected: true },
  { id: "task_subtype", label: "Task Type", selected: true, type: "select" },
  { id: "task_priority", label: "Priority", selected: true, type: "select" },
  { id: "owner_id", label: "Assigned To", selected: true, type: "select" },
  { id: "task_queue", label: "Queue", selected: true, type: "select" },
  { id: "due_date", label: "Due Date", selected: true, type: "date" },
  { id: "due_time", label: "Due Time", selected: true, type: "text" },
  { id: "task_repeat", label: "Repeat", selected: true, type: "toggle" },
  { id: "task_reminder", label: "Reminder", selected: true, type: "select" },
  { id: "description", label: "Notes", selected: true, type: "richtext" },
  { id: "completed", label: "Status", selected: true, type: "toggle" },
]

export interface TaskPropertyItem {
  id: string
  label: string
  type: string
}

export interface TaskPropertyGroup {
  title: string
  items: TaskPropertyItem[]
}

export const TASK_PROPERTY_GROUPS: TaskPropertyGroup[] = [
  {
    title: "TASK DETAILS",
    items: [
      { id: "title", label: "Title", type: "text" },
      { id: "task_subtype", label: "Task Type", type: "select" },
      { id: "task_priority", label: "Priority", type: "select" },
      { id: "completed", label: "Status", type: "toggle" },
    ]
  },
  {
    title: "ASSIGNMENT & QUEUE",
    items: [
      { id: "owner_id", label: "Assigned To", type: "select" },
      { id: "task_queue", label: "Queue", type: "select" },
    ]
  },
  {
    title: "SCHEDULING",
    items: [
      { id: "due_date", label: "Due Date", type: "date" },
      { id: "due_time", label: "Due Time", type: "text" },
      { id: "task_repeat", label: "Repeat", type: "toggle" },
      { id: "task_reminder", label: "Reminder", type: "select" },
    ]
  },
  {
    title: "ADDITIONAL INFORMATION",
    items: [
      { id: "description", label: "Notes", type: "richtext" },
    ]
  }
]
