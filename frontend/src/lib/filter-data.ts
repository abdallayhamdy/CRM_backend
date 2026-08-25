import type { SidebarFilterConfig } from "@/components/crm/CrmFilterSidebar"

/**
 * Simplified advanced-filter configuration.
 *
 * Trimmed down from ~350 HubSpot-style demo fields to a small set of
 * core properties per entity, matching our simplified CRM architecture.
 */

export const MORE_FILTERS = [
  {
    category: "Contact Information",
    items: [
      { id: "first-name", name: "First name", type: "text" },
      { id: "last-name", name: "Last name", type: "text" },
      { id: "email", name: "Email", type: "text" },
      { id: "phone-number", name: "Phone number", type: "text" },
      { id: "mobile-phone-number", name: "Mobile phone number", type: "text" },
      { id: "company-name", name: "Company name", type: "text" },
      { id: "job-title", name: "Job title", type: "text" },
      { id: "city", name: "City", type: "text" },
      { id: "country-region", name: "Country/Region", type: "text" },
      // Rendered as dynamic selects by contacts/page.tsx (owner & lead-status options)
      { id: "contactOwner", name: "Contact owner", type: "check" },
      { id: "leadStatus", name: "Lead status", type: "check" },
      { id: "createDate", name: "Create date", type: "date" },
      { id: "lastActivity", name: "Last activity date", type: "date" },
    ]
  }
];

export const COMPANY_MORE_FILTERS = [
  {
    category: "Company Information",
    items: [
      { id: "company-name", name: "Company name", type: "text" },
      // Rendered as a dynamic select by companies/page.tsx (owner options)
      { id: "owner", name: "Company owner", type: "check" },
      { id: "industry", name: "Industry", type: "text" },
      { id: "city", name: "City", type: "text" },
      { id: "country-region", name: "Country/Region", type: "text" },
      { id: "phone-number", name: "Phone number", type: "text" },
      { id: "website-url", name: "Website URL", type: "link" },
      { id: "createDate", name: "Create date", type: "date" },
      { id: "lastActivity", name: "Last activity date", type: "date" },
    ]
  }
];

interface PropertyForSidebar {
  name: string
  label: string
  field_type: string
  is_archived: boolean
  options?: Array<{ label?: string; value?: string; name?: string } | string>
}

export function buildPropertySidebarFilters(properties: PropertyForSidebar[]): SidebarFilterConfig[] {
  return properties
    .filter(p => !p.is_archived)
    .map(prop => {
      let type: SidebarFilterConfig['type'] = "text"
      let options: string[] | undefined

      const choiceTypes = ["dropdown_select", "radio_select", "multi_select", "multi_checkbox", "multiple_checkboxes"]
      if (choiceTypes.includes(prop.field_type)) {
        type = "property"
        options = prop.options?.map(o => typeof o === 'string' ? o : (o.label || o.value || o.name || '')).filter(Boolean)
      } else if (prop.field_type === "boolean" || prop.field_type === "boolean_checkbox") {
        type = "property"
        options = ["Yes", "No"]
      } else if (["number", "currency", "percent"].includes(prop.field_type)) {
        type = "number"
      } else if (["date", "datetime"].includes(prop.field_type)) {
        type = "date"
      }

      return { id: `custom_${prop.name}`, label: prop.label, type, options }
    })
}
