import type { FieldConfig } from "./contacts"

export const NOTES_FIELD_CONFIG: FieldConfig[] = [
  {
    key: "title",
    label: "Title",
    type: "text",
    editable: false,
  },
  {
    key: "description",
    label: "Content",
    type: "richtext",
    editable: true,
  },
  {
    key: "contact_id",
    label: "Linked Contact",
    type: "text",
    editable: false,
  },
  {
    key: "company_id",
    label: "Linked Company",
    type: "text",
    editable: false,
  },
  {
    key: "deal_id",
    label: "Linked Deal",
    type: "text",
    editable: false,
  },
  {
    key: "ticket_id",
    label: "Linked Ticket",
    type: "text",
    editable: false,
  },
  {
    key: "created_at",
    label: "Created",
    type: "text",
    editable: false,
  },
]
