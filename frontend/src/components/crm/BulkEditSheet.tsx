"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export interface BulkEditField {
  id: string
  label: string
  type: "select" | "text" | "number"
  options?: { value: string; label: string }[]
  placeholder?: string
}

interface BulkEditSheetProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  entityName: string
  count: number
  fields: BulkEditField[]
  onBulkUpdate: (updates: Record<string, any>) => Promise<{ success: number; failed: number }>
}

export function BulkEditSheet({
  open,
  onClose,
  onSaved,
  entityName,
  count,
  fields,
  onBulkUpdate,
}: BulkEditSheetProps) {
  const [values, setValues] = React.useState<Record<string, any>>({})
  const [saving, setSaving] = React.useState(false)

  const hasChanges = Object.keys(values).length > 0

  const handleSave = async () => {
    if (!hasChanges) return
    setSaving(true)
    try {
      const result = await onBulkUpdate(values)
      if (result.failed > 0) {
        toast.error(`Failed to update ${result.failed} ${entityName}${result.failed > 1 ? 's' : ''}`)
      }
      if (result.success > 0) {
        toast.success(`Updated ${result.success} ${entityName}${result.success > 1 ? 's' : ''}`)
      }
      onClose()
      onSaved()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update records")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (v) { setValues({}) } else if (!saving) { onClose() } }}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto max-w-[90vw]">
        <SheetHeader>
          <SheetTitle>
            Edit {count} {entityName}{count > 1 ? 's' : ''}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            Only changed fields will be applied to all selected records.
          </p>

          {fields.map(field => (
            <div key={field.id} className="space-y-2">
              <Label className="text-sm font-medium">{field.label}</Label>
              {field.type === "select" ? (
                <Select
                  value={values[field.id] || ""}
                  onValueChange={(v) => setValues(prev => {
                    if (v === "__no_change__") {
                      const next = { ...prev }
                      delete next[field.id]
                      return next
                    }
                    return { ...prev, [field.id]: v }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No change" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__no_change__">No change</SelectItem>
                    {field.options?.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <input
                  type={field.type}
                  placeholder={field.placeholder || "No change"}
                  value={values[field.id] || ""}
                  onChange={(e) => setValues(prev => {
                    const next = { ...prev }
                    if (e.target.value) {
                      next[field.id] = field.type === "number" ? Number(e.target.value) : e.target.value
                    } else {
                      delete next[field.id]
                    }
                    return next
                  })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              `Save changes`
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
