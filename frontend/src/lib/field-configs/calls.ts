import type { FieldConfig } from "./contacts"

const CALL_DIRECTION_OPTIONS = [
  { value: "Inbound", label: "Inbound" },
  { value: "Outbound", label: "Outbound" },
]

const CALL_OUTCOME_OPTIONS = [
  { value: "Connected", label: "Connected" },
  { value: "Voicemail", label: "Voicemail" },
  { value: "Resolved", label: "Resolved" },
  { value: "Busy", label: "Busy" },
  { value: "No Answer", label: "No Answer" },
  { value: "Wrong Number", label: "Wrong Number" },
]

export const CALL_FIELD_CONFIG: FieldConfig[] = [
  {
    key: "title",
    label: "Title",
    type: "text",
    editable: true,
    showInSidebar: false,
  },
  {
    key: "call_direction",
    label: "Direction",
    type: "select",
    editable: false,
    options: CALL_DIRECTION_OPTIONS,
  },
  {
    key: "call_duration",
    label: "Duration",
    type: "text",
    editable: false,
  },
  {
    key: "call_outcome",
    label: "Outcome",
    type: "select",
    editable: false,
    options: CALL_OUTCOME_OPTIONS,
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
