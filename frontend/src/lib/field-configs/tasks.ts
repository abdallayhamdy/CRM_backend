import type { FieldConfig } from "./contacts"

const TASK_TYPE_OPTIONS = [
  { value: "to_do", label: "To-do" },
  { value: "call", label: "Call" },
  { value: "follow_up", label: "Follow Up" },
  { value: "follow_up_after_meeting", label: "Follow Up After Meeting" },
  { value: "email", label: "Email" },
  { value: "message", label: "Message" },
]

const TASK_PRIORITY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

const QUEUE_OPTIONS = [
  { value: "general", label: "General" },
  { value: "support", label: "Support" },
  { value: "sales", label: "Sales" },
]

const REMINDER_OPTIONS = [
  { value: "none", label: "No reminder" },
  { value: "at_time", label: "At time of event" },
  { value: "5_min", label: "5 minutes before" },
  { value: "15_min", label: "15 minutes before" },
  { value: "1_hour", label: "1 hour before" },
  { value: "1_day", label: "1 day before" },
]

export const TASK_FIELD_CONFIG: FieldConfig[] = [
  {
    key: "title",
    label: "Title",
    type: "text",
    editable: true,
    showInSidebar: false,
    showInFullPage: true,
  },
  {
    key: "completed",
    label: "Status",
    type: "toggle",
    editable: true,
    showInFullPage: false,
  },
  {
    key: "type",
    label: "Type",
    type: "select",
    editable: true,
    options: TASK_TYPE_OPTIONS,
    showInFullPage: false,
  },
  {
    key: "task_priority",
    label: "Priority",
    type: "select",
    editable: true,
    options: TASK_PRIORITY_OPTIONS,
    showInFullPage: false,
  },
  {
    key: "owner_id",
    label: "Assigned",
    type: "owner",
    editable: true,
    showInFullPage: false,
  },
  {
    key: "task_queue",
    label: "Queue",
    type: "select",
    editable: true,
    options: QUEUE_OPTIONS,
    showInFullPage: false,
  },
  {
    key: "due_date",
    label: "Due Date",
    type: "date",
    editable: true,
    showInFullPage: false,
  },
  {
    key: "set_repeat",
    label: "Repeat",
    type: "toggle",
    editable: true,
    showInFullPage: false,
  },
  {
    key: "reminder",
    label: "Reminder",
    type: "select",
    editable: true,
    options: REMINDER_OPTIONS,
    showInFullPage: false,
  },
  {
    key: "description",
    label: "Notes",
    type: "richtext",
    editable: true,
    showInFullPage: false,
  },
  {
    key: "created_at",
    label: "Created",
    type: "text",
    editable: false,
    showInFullPage: false,
  },
]
