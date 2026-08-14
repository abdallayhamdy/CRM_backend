import type { PropertyFromDB } from "@/hooks/use-properties"

export interface PropertyOption {
  label: string
  value: string
}

export function normalizePropertyOptions(
  options: PropertyFromDB["options"],
): PropertyOption[] {
  if (!Array.isArray(options)) return []
  return options
    .map((opt) => {
      if (typeof opt === "string") return { label: opt, value: opt }
      if (opt && typeof opt === "object") {
        const label = opt.label ?? opt.name ?? opt.value ?? opt.internal_name ?? ""
        const value = opt.value ?? opt.internal_name ?? opt.name ?? opt.label ?? label
        return { label: String(label), value: String(value) }
      }
      return null
    })
    .filter((o): o is PropertyOption => !!o && o.value !== "")
}

export function isTextFieldType(fieldType: string): boolean {
  return [
    "single_line_text",
    "multi_line_text",
    "rich_text",
    "phone_number",
    "phone",
    "email",
    "url",
    "color_picker",
    "owner",
    "hubspot_user",
    "file",
    "calculation",
    "rollup",
    "property_sync",
  ].includes(fieldType)
}

export function isNumericFieldType(fieldType: string): boolean {
  return ["number", "currency", "percent", "score"].includes(fieldType)
}

export function isDateFieldType(fieldType: string): boolean {
  return ["date_picker", "date", "date_time_picker", "datetime", "date_time"].includes(
    fieldType,
  )
}

export function isBooleanFieldType(fieldType: string): boolean {
  return ["boolean_checkbox", "boolean", "single_checkbox"].includes(fieldType)
}

export function isSingleOptionFieldType(fieldType: string): boolean {
  return ["dropdown_select", "dropdown", "radio_select"].includes(fieldType)
}

export function isMultiOptionFieldType(fieldType: string): boolean {
  return ["multiple_checkboxes", "multi_checkbox", "multi_select"].includes(fieldType)
}

export function isEmptyValue(value: any, fieldType: string): boolean {
  if (value === undefined || value === null) return true
  if (isBooleanFieldType(fieldType)) return false
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === "number") return isNaN(value)
  return String(value).trim() === ""
}

export interface CustomFieldError {
  [name: string]: string
}

export function validateCustomFields(
  properties: PropertyFromDB[],
  values: Record<string, any>,
): CustomFieldError {
  const errors: CustomFieldError = {}
  for (const prop of properties) {
    const required = prop.is_required === true
    const value = values[prop.name]

    if (required) {
      if (isBooleanFieldType(prop.field_type)) {
        if (value !== true) {
          errors[prop.name] = `${prop.label} is required`
        }
      } else if (isEmptyValue(value, prop.field_type)) {
        errors[prop.name] = `${prop.label} is required`
      }
    }

    if (!isEmptyValue(value, prop.field_type) && typeof value === "string") {
      const settings = prop.settings ?? {}
      if (settings.require_min_chars && Number(settings.min_chars) > 0 && value.length < Number(settings.min_chars)) {
        errors[prop.name] = `${prop.label} must be at least ${settings.min_chars} characters`
      }
      if (settings.limit_max_chars && Number(settings.max_chars) > 0 && value.length > Number(settings.max_chars)) {
        errors[prop.name] = `${prop.label} must be at most ${settings.max_chars} characters`
      }
      if (prop.field_type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[prop.name] = `${prop.label} must be a valid email address`
      }
      if (prop.field_type === "url" && !/^(https?:\/\/)/i.test(value)) {
        errors[prop.name] = `${prop.label} must be a valid URL`
      }
    }
  }
  return errors
}

export function hasCustomFieldErrors(
  properties: PropertyFromDB[],
  values: Record<string, any>,
): boolean {
  return Object.keys(validateCustomFields(properties, values)).length > 0
}
