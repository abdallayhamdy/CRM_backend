import { DEAL_STAGE_OPTIONS } from "@/lib/crm-constants"
import type { FieldConfig } from "./contacts"

const DEAL_TYPE_OPTIONS = [
  { value: "New Business", label: "New Business" },
  { value: "Existing Business", label: "Existing Business" },
  { value: "Renewal", label: "Renewal" },
  { value: "Upsell", label: "Upsell" },
]

const PRIORITY_OPTIONS = [
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
]

export const DEAL_FIELD_CONFIG: FieldConfig[] = [
  {
    key: "title",
    label: "Deal Name",
    type: "text",
    editable: true,
  },
  {
    key: "stage",
    label: "Stage",
    type: "select",
    editable: true,
    options: DEAL_STAGE_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
  },
  {
    key: "amount",
    label: "Amount",
    type: "number",
    editable: true,
  },
  {
    key: "close_date",
    label: "Close Date",
    type: "date",
    editable: true,
  },
  {
    key: "priority",
    label: "Priority",
    type: "select",
    editable: true,
    options: PRIORITY_OPTIONS,
    showInFullPage: false,
  },
  {
    key: "deal_type",
    label: "Type",
    type: "select",
    editable: true,
    options: DEAL_TYPE_OPTIONS,
    showInFullPage: false,
  },
  {
    key: "probability",
    label: "Probability",
    type: "number",
    editable: false,
    showInSidebar: false,
  },
  {
    key: "pipeline",
    label: "Pipeline",
    type: "text",
    editable: false,
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
