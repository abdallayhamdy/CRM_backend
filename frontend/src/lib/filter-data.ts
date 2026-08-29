import type { SidebarFilterConfig } from "@/components/crm/CrmFilterSidebar"

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
