import type { FieldConfig } from "./contacts"

const TICKET_STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
]

const TICKET_PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

const SOURCE_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "chat", label: "Chat" },
  { value: "web", label: "Web" },
  { value: "other", label: "Other" },
]

export const TICKET_FIELD_CONFIG: FieldConfig[] = [
  {
    key: "subject",
    label: "Subject",
    type: "text",
    editable: true,
    showInSidebar: false,
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    editable: true,
    options: TICKET_STATUS_OPTIONS,
  },
  {
    key: "priority",
    label: "Priority",
    type: "select",
    editable: true,
    options: TICKET_PRIORITY_OPTIONS,
  },
  {
    key: "category",
    label: "Category",
    type: "text",
    editable: false,
    showInFullPage: false,
  },
  {
    key: "source",
    label: "Source",
    type: "select",
    editable: false,
    options: SOURCE_OPTIONS,
    showInSidebar: false,
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    editable: true,
    showInSidebar: false,
  },
  {
    key: "owner_id",
    label: "Owner",
    type: "owner",
    editable: true,
  },
  {
    key: "created_at",
    label: "Created",
    type: "text",
    editable: false,
  },
]
