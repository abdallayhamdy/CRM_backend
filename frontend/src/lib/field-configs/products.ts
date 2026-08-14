import { PRODUCT_STATUSES } from "@/lib/types/crm"
import type { FieldConfig } from "./contacts"

const PRODUCT_TYPE_OPTIONS = [
  { value: "Physical Good", label: "Physical Good" },
  { value: "Digital Product", label: "Digital Product" },
  { value: "Service", label: "Service" },
  { value: "Subscription", label: "Subscription" },
  { value: "Bundle", label: "Bundle" },
]

export const PRODUCT_FIELD_CONFIG: FieldConfig[] = [
  {
    key: "name",
    label: "Name",
    type: "text",
    editable: true,
    showInSidebar: false,
    showInFullPage: false,
  },
  {
    key: "sku",
    label: "SKU",
    type: "text",
    editable: true,
    showInFullPage: false,
  },
  {
    key: "unit_price",
    label: "Price",
    type: "number",
    editable: true,
    showInFullPage: false,
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    editable: true,
    options: [...PRODUCT_STATUSES].map((v) => ({ label: v, value: v })),
    showInFullPage: false,
  },
  {
    key: "product_type",
    label: "Type",
    type: "select",
    editable: false,
    options: PRODUCT_TYPE_OPTIONS,
    showInFullPage: false,
  },
  {
    key: "product_description",
    label: "Description",
    type: "textarea",
    editable: false,
    showInFullPage: false,
  },
  {
    key: "created_at",
    label: "Created",
    type: "text",
    editable: false,
    showInSidebar: false,
    showInFullPage: false,
  },
]
