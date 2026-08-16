import { LEAD_STATUS_OPTIONS } from "@/lib/crm-constants"

export interface FieldConfig {
  key: string
  label: string
  type: "text" | "email" | "phone" | "select" | "number" | "date" | "textarea" | "owner" | "lifecycle" | "toggle" | "richtext"
  editable: boolean
  options?: { label: string; value: string; color?: string }[]
  showInSidebar?: boolean
  showInFullPage?: boolean
  lifecycleObjectType?: "contact" | "company" | "deal" | "ticket"
}

export const CONTACT_FIELD_CONFIG: FieldConfig[] = [
  {
    key: "first_name",
    label: "First Name",
    type: "text",
    editable: true,
  },
  {
    key: "last_name",
    label: "Last Name",
    type: "text",
    editable: true,
  },
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
    key: "mobile_phone",
    label: "Mobile Phone",
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
    editable: true,
    options: LEAD_STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value, color: o.color })),
  },
  {
    key: "owner_id",
    label: "Owner",
    type: "owner",
    editable: true,
  },
  {
    key: "company_id",
    label: "Company",
    type: "text",
    editable: true,
  },
  {
    key: "job_title",
    label: "Job Title",
    type: "text",
    editable: true,
  },
  {
    key: "source",
    label: "Source",
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
