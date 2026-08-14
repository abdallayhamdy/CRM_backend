"use client"

import * as React from "react"

import { useProperties, type ObjectType, type PropertyFromDB } from "@/hooks/use-properties"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  normalizePropertyOptions,
  isTextFieldType,
  isNumericFieldType,
  isDateFieldType,
  isBooleanFieldType,
  isSingleOptionFieldType,
  isMultiOptionFieldType,
  validateCustomFields,
  type CustomFieldError,
} from "@/lib/custom-fields"

interface CustomFieldsFormProps {
  objectType: ObjectType
  values: Record<string, any>
  onChange: (name: string, value: any) => void
  className?: string
  onValidationChange?: (errors: CustomFieldError) => void
}

export function sortProperties(properties: PropertyFromDB[]): PropertyFromDB[] {
  return [...properties].sort((a, b) => {
    const ao = a.display_order ?? 0
    const bo = b.display_order ?? 0
    if (ao !== bo) return ao - bo
    return a.label.localeCompare(b.label)
  })
}

export function visibleProperties(properties: PropertyFromDB[]): PropertyFromDB[] {
  return sortProperties(
    properties.filter((p) => !p.is_archived && p.show_in_forms !== false),
  )
}

export function CustomFieldsForm({
  objectType,
  values,
  onChange,
  className,
  onValidationChange,
}: CustomFieldsFormProps) {
  const { properties, loading } = useProperties(objectType)
  const visible = React.useMemo(() => visibleProperties(properties), [properties])
  const errors = React.useMemo(
    () => validateCustomFields(visible, values),
    [visible, values],
  )
  const groups = React.useMemo(() => {
    const map = new Map<string | null, PropertyFromDB[]>()
    for (const p of visible) {
      const key = p.group_name || "__ungrouped"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return Array.from(map.entries())
  }, [visible])

  React.useEffect(() => {
    onValidationChange?.(errors)
  }, [errors, onValidationChange])

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-full animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    )
  }

  if (visible.length === 0) return null

  const fieldError = (prop: PropertyFromDB): string | undefined => errors[prop.name]

  const renderField = (prop: PropertyFromDB) => {
    const value = values[prop.name]
    const error = fieldError(prop)
    const options = normalizePropertyOptions(prop.options)
    const sharedInputClass = cn(
      "w-full",
      error && "border-destructive focus-visible:ring-destructive/50",
    )

    if (isTextFieldType(prop.field_type)) {
      const inputType =
        prop.field_type === "email"
          ? "email"
          : prop.field_type === "url"
            ? "url"
            : prop.field_type === "phone_number" || prop.field_type === "phone"
              ? "tel"
              : prop.field_type === "color_picker"
                ? "color"
                : "text"
      if (
        prop.field_type === "multi_line_text" ||
        prop.field_type === "rich_text" ||
        prop.field_type === "calculation" ||
        prop.field_type === "rollup"
      ) {
        return (
          <Textarea
            name={prop.name}
            value={value ?? ""}
            onChange={(e) => onChange(prop.name, e.target.value)}
            placeholder={prop.field_type === "calculation" || prop.field_type === "rollup" ? "Auto-calculated" : `Enter ${prop.label.toLowerCase()}`}
            rows={prop.field_type === "rich_text" ? 4 : 3}
            className={sharedInputClass}
            readOnly={prop.field_type === "calculation" || prop.field_type === "rollup"}
          />
        )
      }
      return (
        <Input
          name={prop.name}
          type={inputType}
          value={value ?? ""}
          onChange={(e) => onChange(prop.name, e.target.value)}
          placeholder={`Enter ${prop.label.toLowerCase()}`}
          className={sharedInputClass}
        />
      )
    }

    if (isNumericFieldType(prop.field_type)) {
      return (
        <Input
          name={prop.name}
          type="number"
          min="0"
          step={prop.field_type === "currency" ? "0.01" : "1"}
          value={value ?? ""}
          onChange={(e) => onChange(prop.name, e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={`Enter ${prop.label.toLowerCase()}`}
          className={sharedInputClass}
        />
      )
    }

    if (isDateFieldType(prop.field_type)) {
      const isDateTime = ["date_time_picker", "datetime", "date_time"].includes(prop.field_type)
      return (
        <Input
          name={prop.name}
          type={isDateTime ? "datetime-local" : "date"}
          value={value ?? ""}
          onChange={(e) => onChange(prop.name, e.target.value)}
          className={sharedInputClass}
        />
      )
    }

    if (isBooleanFieldType(prop.field_type)) {
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            id={`custom-${prop.name}`}
            checked={value === true}
            onCheckedChange={(checked) => onChange(prop.name, checked === true)}
          />
          <Label htmlFor={`custom-${prop.name}`} className="font-normal cursor-pointer">
            {prop.label}
          </Label>
        </div>
      )
    }

    if (isMultiOptionFieldType(prop.field_type)) {
      const selected: string[] = Array.isArray(value) ? value : []
      return (
        <div className="space-y-2">
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">No options configured</p>
          ) : (
            options.map((opt) => {
              const checked = selected.includes(opt.value)
              return (
                <div key={opt.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`custom-${prop.name}-${opt.value}`}
                    checked={checked}
                    onCheckedChange={(isChecked) => {
                      const next = isChecked
                        ? [...selected, opt.value]
                        : selected.filter((v) => v !== opt.value)
                      onChange(prop.name, next)
                    }}
                  />
                  <Label
                    htmlFor={`custom-${prop.name}-${opt.value}`}
                    className="font-normal cursor-pointer"
                  >
                    {opt.label}
                  </Label>
                </div>
              )
            })
          )}
        </div>
      )
    }

    if (isSingleOptionFieldType(prop.field_type)) {
      if (prop.field_type === "radio_select") {
        return (
          <RadioGroup
            value={value ?? ""}
            onValueChange={(v) => onChange(prop.name, v)}
            className="gap-3"
          >
            {options.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <RadioGroupItem value={opt.value} id={`custom-${prop.name}-${opt.value}`} />
                <Label htmlFor={`custom-${prop.name}-${opt.value}`} className="font-normal cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )
      }
      return (
        <Select value={value ?? ""} onValueChange={(v) => onChange(prop.name, v)}>
          <SelectTrigger className={sharedInputClass}>
            <SelectValue placeholder={`Select ${prop.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    return (
      <Input
        name={prop.name}
        value={value ?? ""}
        onChange={(e) => onChange(prop.name, e.target.value)}
        placeholder={`Enter ${prop.label.toLowerCase()}`}
        className={sharedInputClass}
      />
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {groups.map(([group, props]) => (
        <div key={group ?? "ungrouped"} className="space-y-4">
          {group && (
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {group}
            </h4>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {props.map((prop) => {
              const error = fieldError(prop)
              return (
                <div
                  key={prop.id}
                  className={cn("space-y-2", isBooleanFieldType(prop.field_type) && "sm:col-span-1")}
                >
                  {!isBooleanFieldType(prop.field_type) && (
                    <Label htmlFor={prop.name}>
                      {prop.label}
                      {prop.is_required && <span className="ml-1 text-destructive">*</span>}
                    </Label>
                  )}
                  {renderField(prop)}
                  {error && (
                    <p className="text-xs text-destructive" data-slot="field-error">
                      {error}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export type { CustomFieldError }
