import type { FieldConfig } from "./contacts"

export const COMPANY_FIELD_CONFIG: FieldConfig[] = [
  {
    key: "name",
    label: "Company Name",
    type: "text",
    editable: true,
  },
  {
    key: "domain",
    label: "Domain",
    type: "text",
    editable: true,
  },
  {
    key: "industry",
    label: "Industry",
    type: "text",
    editable: true,
  },
  {
    key: "size",
    label: "Size",
    type: "text",
    editable: true,
    showInFullPage: false,
  },
  {
    key: "phone",
    label: "Phone",
    type: "phone",
    editable: true,
  },
  {
    key: "city",
    label: "City",
    type: "text",
    editable: true,
  },
  {
    key: "country",
    label: "Country/Region",
    type: "text",
    editable: true,
  },
  {
    key: "annual_revenue",
    label: "Annual Revenue",
    type: "number",
    editable: true,
  },
  {
    key: "employee_count",
    label: "Number of Employees",
    type: "number",
    editable: true,
  },
  {
    key: "address",
    label: "Address",
    type: "text",
    editable: false,
    showInFullPage: false,
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    editable: true,
    showInSidebar: false,
  },
  {
    key: "lifecycle_stage",
    label: "Lifecycle Stage",
    type: "lifecycle",
    editable: true,
    lifecycleObjectType: "company",
    showInFullPage: false,
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
