import { LEAD_STATUS_OPTIONS } from "@/lib/crm-constants"

export interface FieldConfig {
  key: string
  label: string
  type: "text" | "email" | "phone" | "select" | "number" | "date" | "textarea" | "owner" | "lifecycle" | "toggle" | "richtext"
  editable: boolean
  options?: { label: string; value: string }[]
  showInSidebar?: boolean
  showInFullPage?: boolean
  lifecycleObjectType?: "contact" | "company" | "deal" | "ticket"
}

export const CONTACT_FIELD_CONFIG: FieldConfig[] = [
  {
    key: "email",
    label: "Email",
    type: "email",
    editable: true,
  },
  {
    key: "phone",
    label: "Phone",
    type: "phone",
    editable: true,
  },
  {
    key: "lifecycle_stage",
    label: "Lifecycle Stage",
    type: "lifecycle",
    editable: true,
    lifecycleObjectType: "contact",
  },
  {
    key: "lead_status",
    label: "Lead Status",
    type: "select",
    editable: false,
    options: LEAD_STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
  },
  {
    key: "source",
    label: "Source",
    type: "text",
    editable: false,
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
