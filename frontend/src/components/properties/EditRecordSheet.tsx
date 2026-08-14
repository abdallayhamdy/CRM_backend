"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { CustomFieldsForm, type CustomFieldError } from "@/components/properties/CustomFieldsForm"
import type { ObjectType } from "@/hooks/use-properties"

export interface EditFieldConfig {
  name: string
  label: string
  type?: "text" | "textarea" | "number" | "email" | "tel" | "date" | "select"
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
}

interface EditRecordSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  objectType: ObjectType
  title: string
  fields: EditFieldConfig[]
  initialValues: Record<string, any>
  onSave: (values: Record<string, any>) => Promise<void> | void
}

export function EditRecordSheet({
  open,
  onOpenChange,
  objectType,
  title,
  fields,
  initialValues,
  onSave,
}: EditRecordSheetProps) {
  const [normalValues, setNormalValues] = React.useState<Record<string, any>>(() => {
    const normal: Record<string, any> = {}
    for (const field of fields) {
      let value = initialValues[field.name] ?? ""
      if (field.type === "date" && typeof value === "string") {
        value = value.slice(0, 10)
      }
      normal[field.name] = value
    }
    return normal
  })
  const [customValues, setCustomValues] = React.useState<Record<string, any>>(
    () => (initialValues.custom_fields ?? {}) as Record<string, any>,
  )
  const [customFieldErrors, setCustomFieldErrors] = React.useState<CustomFieldError>({})
  const [saving, setSaving] = React.useState(false)

  const setNormalValue = React.useCallback((name: string, value: any) => {
    setNormalValues(prev => ({ ...prev, [name]: value }))
  }, [])

  const setCustomValue = React.useCallback((name: string, value: any) => {
    setCustomValues(prev => ({ ...prev, [name]: value }))
  }, [])

  const missingRequired = fields.filter(field => {
    if (!field.required) return false
    const value = normalValues[field.name]
    return value === undefined || value === null || String(value).trim() === ""
  })

  const canSave = missingRequired.length === 0 && Object.keys(customFieldErrors).length === 0

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const payload: Record<string, any> = {}
      for (const field of fields) {
        const value = normalValues[field.name]
        payload[field.name] = value === "" ? null : value
      }
      payload.custom_fields = customValues
      await onSave(payload)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const renderField = (field: EditFieldConfig) => {
    const value = normalValues[field.name] ?? ""
    const hasError =
      field.required &&
      (value === undefined || value === null || String(value).trim() === "")
    const inputClass = cn("border-border", hasError && "border-destructive focus-visible:ring-destructive/50")

    if (field.type === "textarea") {
      return (
        <Textarea
          name={field.name}
          value={value ?? ""}
          onChange={(e) => setNormalValue(field.name, e.target.value)}
          placeholder={field.placeholder}
          className={cn(inputClass, "min-h-[80px]")}
        />
      )
    }

    if (field.type === "number") {
      return (
        <Input
          name={field.name}
          type="number"
          step="0.01"
          value={value ?? ""}
          onChange={(e) => setNormalValue(field.name, e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={field.placeholder}
          className={inputClass}
        />
      )
    }

    if (field.type === "select") {
      return (
        <Select
          value={value ?? ""}
          onValueChange={(v) => setNormalValue(field.name, v)}
        >
          <SelectTrigger className={cn("w-full border-border", hasError && "border-destructive")}>
            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    const inputType =
      field.type === "email" ? "email"
        : field.type === "tel" ? "tel"
          : field.type === "date" ? "date"
            : "text"

    return (
      <Input
        name={field.name}
        type={inputType}
        value={value ?? ""}
        onChange={(e) => setNormalValue(field.name, e.target.value)}
        placeholder={field.placeholder}
        className={inputClass}
      />
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Edit {title}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pr-1">
          <div className="space-y-4">
            {fields.map((field) => {
              const value = normalValues[field.name] ?? ""
              const hasError =
                field.required &&
                (value === undefined || value === null || String(value).trim() === "")
              return (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={`edit-${field.name}`} className="text-foreground font-semibold">
                    {field.label}
                    {field.required && <span className="ml-0.5 text-destructive">*</span>}
                  </Label>
                  {renderField(field)}
                  {hasError && (
                    <p className="text-xs text-destructive">This field is required</p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="border-t border-border pt-4 mt-6">
            <CustomFieldsForm
              objectType={objectType}
              values={customValues}
              onChange={setCustomValue}
              onValidationChange={setCustomFieldErrors}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
