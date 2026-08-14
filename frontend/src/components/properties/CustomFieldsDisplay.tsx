"use client"

import * as React from "react"

import { useProperties, type ObjectType, type PropertyFromDB } from "@/hooks/use-properties"
import { cn } from "@/lib/utils"
import {
  normalizePropertyOptions,
  isBooleanFieldType,
  isMultiOptionFieldType,
  isSingleOptionFieldType,
  isEmptyValue,
} from "@/lib/custom-fields"
import { sortProperties } from "@/components/properties/CustomFieldsForm"

interface CustomFieldsDisplayProps {
  objectType: ObjectType
  values: Record<string, any>
  className?: string
  emptyText?: string
}

function formatValue(prop: PropertyFromDB, value: any): string {
  if (isEmptyValue(value, prop.field_type)) return ""
  if (isBooleanFieldType(prop.field_type)) return value === true ? "Yes" : "No"
  if (isMultiOptionFieldType(prop.field_type)) {
    const options = normalizePropertyOptions(prop.options)
    const selected = Array.isArray(value) ? value : []
    return selected
      .map((v) => options.find((o) => o.value === String(v))?.label ?? String(v))
      .join(", ")
  }
  if (isSingleOptionFieldType(prop.field_type)) {
    const options = normalizePropertyOptions(prop.options)
    return options.find((o) => o.value === String(value))?.label ?? String(value)
  }
  if (Array.isArray(value)) return value.map(String).join(", ")
  return String(value)
}

export function CustomFieldsDisplay({
  objectType,
  values,
  className,
  emptyText = "No custom properties set.",
}: CustomFieldsDisplayProps) {
  const { properties, loading } = useProperties(objectType)
  const visible = sortProperties(
    properties.filter((p) => !p.is_archived && p.show_in_forms !== false),
  ).filter((p) => !isEmptyValue(values[p.name], p.field_type))

  if (loading) return null
  if (visible.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>

  return (
    <div className={cn("space-y-3", className)}>
      {visible.map((prop) => (
        <div key={prop.id} className="grid grid-cols-[140px_1fr] gap-3 text-sm">
          <dt className="text-muted-foreground">{prop.label}</dt>
          <dd className="text-foreground break-words">{formatValue(prop, values[prop.name])}</dd>
        </div>
      ))}
    </div>
  )
}
