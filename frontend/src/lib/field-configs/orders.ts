import type { FieldConfig } from "./contacts"

const ORDER_STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
]

export const ORDER_FIELD_CONFIG: FieldConfig[] = [
  {
    key: "order_number",
    label: "Order Number",
    type: "text",
    editable: false,
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    editable: true,
    options: ORDER_STATUS_OPTIONS,
  },
  {
    key: "amount",
    label: "Amount",
    type: "number",
    editable: false,
    showInSidebar: false,
  },
  {
    key: "total",
    label: "Total",
    type: "number",
    editable: true,
    showInFullPage: false,
  },
  {
    key: "pipeline",
    label: "Pipeline",
    type: "text",
    editable: false,
    showInSidebar: false,
  },
  {
    key: "closed_at",
    label: "Closed At",
    type: "date",
    editable: false,
    showInSidebar: false,
  },
  {
    key: "created_at",
    label: "Created",
    type: "text",
    editable: false,
  },
]
