"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Loader2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FieldOption {
  label: string
  value: string
  color?: string
}

export interface EditableFieldProps {
  value: string | number | null
  type: "text" | "email" | "phone" | "select" | "number" | "date" | "textarea" | "owner" | "toggle" | "richtext"
  options?: FieldOption[]
  editable: boolean
  onSave: (newValue: string | number | null) => Promise<void> | void
  placeholder?: string
  renderReadonly?: () => React.ReactNode
  layout?: "inline" | "stacked"
}

export function EditableField({
  value,
  type,
  options,
  editable,
  onSave,
  placeholder = "--",
  renderReadonly,
  layout = "inline",
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editValue, setEditValue] = React.useState<string | number | null>(value)
  const [isSaving, setIsSaving] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const prevValueRef = React.useRef(value)

  React.useEffect(() => {
    prevValueRef.current = value
  }, [value])

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if ("select" in inputRef.current) {
        inputRef.current.select()
      }
    }
  }, [isEditing])

  if (!editable) {
    if ((type === "select" || type === "owner") && options) {
      const matchedOption = options.find((o) => o.value.toLowerCase() === String(value ?? "").toLowerCase())
      const label = matchedOption?.label ?? String(value ?? "")
      const color = matchedOption?.color
      return (
        <div className="flex items-center justify-between h-7 text-[13px] text-foreground font-medium rounded border border-border px-2 bg-background">
          {color ? (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-white"
              style={{ backgroundColor: color }}
            >
              {label}
            </span>
          ) : (
            <span>{label || <span className="text-muted-foreground">{placeholder}</span>}</span>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </div>
      )
    }
    return (
      <div className="text-[13px] text-foreground font-medium">
        {renderReadonly ? renderReadonly() : renderDisplayValue(type, value, placeholder)}
      </div>
    )
  }

  if (type === "toggle") {
    const isChecked = value === 1 || value === "true"
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          checked={isChecked}
          onCheckedChange={async (checked) => {
            const newVal = checked === true ? 1 : 0
            try {
              await onSave(newVal)
            } catch {
              // revert is handled by parent via error throw
            }
          }}
          className="size-4 rounded-full border-border data-checked:bg-status-success data-checked:border-status-success"
        />
        <span className="text-[13px] text-foreground font-medium">
          {isChecked ? "Yes" : "No"}
        </span>
      </div>
    )
  }

  const handleStartEdit = () => {
    setEditValue(value)
    setIsEditing(true)
  }

  const handleRevert = () => {
    setEditValue(prevValueRef.current)
    setIsEditing(false)
  }

  const handleSave = async (finalValue?: string | number | null) => {
    const valueToSave = finalValue !== undefined ? finalValue : editValue
    if (valueToSave === prevValueRef.current) {
      setIsEditing(false)
      return
    }
    setIsSaving(true)
    try {
      await onSave(valueToSave)
      prevValueRef.current = valueToSave
      setIsEditing(false)
    } catch {
      setEditValue(prevValueRef.current)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault()
      handleRevert()
    }
    if (e.key === "Enter" && type !== "select" && type !== "owner" && type !== "date") {
      e.preventDefault()
      handleSave()
    }
  }

  if (isEditing) {
    if (type === "select" && options) {
      return (
        <div className="flex items-center gap-1.5">
          {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          <Select
            value={String(editValue ?? "")}
            onValueChange={(v) => {
              handleSave(v)
            }}
          >
            <SelectTrigger
              className={cn("h-7 text-[13px]", layout === "stacked" ? "w-full" : "w-full")}
              onKeyDown={handleKeyDown}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (type === "owner" && options) {
      return (
        <div className="flex items-center gap-1.5">
          {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          <Select
            value={String(editValue ?? "")}
            onValueChange={(v) => {
              handleSave(v === "" ? null : v)
            }}
          >
            <SelectTrigger
              className={cn("h-7 text-[13px]", layout === "stacked" ? "w-full" : "w-full")}
              onKeyDown={handleKeyDown}
            >
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (type === "date") {
      return (
        <div className="flex items-center gap-1.5">
          {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          <DatePicker
            value={editValue ? String(editValue) : undefined}
            onChange={(dateStr) => {
              handleSave(dateStr)
            }}
          />
        </div>
      )
    }

    if (type === "textarea") {
      return (
        <div className="flex flex-col gap-1.5">
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className="min-h-[60px] text-[13px] font-medium resize-none"
            value={editValue ?? ""}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSave()}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
          />
          {isSaving && (
            <div className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">Saving...</span>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-1.5">
        {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type === "phone" ? "tel" : type === "number" ? "number" : type === "email" ? "email" : "text"}
          className="h-7 text-[13px] font-medium"
          value={editValue ?? ""}
          onChange={(e) => {
            const v = type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value
            setEditValue(v)
          }}
          onBlur={() => handleSave()}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
        />
      </div>
    )
  }

  // Display mode (editable but not currently editing)
  if ((type === "select" || type === "owner") && options) {
    const matchedOption = options.find((o) => o.value.toLowerCase() === String(value ?? "").toLowerCase())
    const label = matchedOption?.label ?? String(value ?? "")
    const color = matchedOption?.color
    return (
      <button
        type="button"
        onClick={handleStartEdit}
        className={cn(
          "flex items-center justify-between h-7 text-[13px] text-foreground font-medium w-full",
          "rounded border border-border px-2 bg-background",
          "transition-colors cursor-pointer hover:bg-accent",
          "outline-none focus-visible:ring-1 focus-visible:ring-ring"
        )}
      >
        {color ? (
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-white"
            style={{ backgroundColor: color }}
          >
            {label}
          </span>
        ) : (
          <span>{label || <span className="text-muted-foreground">{placeholder}</span>}</span>
        )}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>
    )
  }

  if (type === "date") {
    const displayDate = value ? formatDisplayDate(String(value)) : placeholder
    return (
      <button
        type="button"
        onClick={handleStartEdit}
        className={cn(
          "flex items-center justify-between h-7 text-[13px] text-foreground font-medium w-full",
          "rounded border border-border px-2 bg-background",
          "transition-colors cursor-pointer hover:bg-accent",
          "outline-none focus-visible:ring-1 focus-visible:ring-ring"
        )}
      >
        <span>{value ? displayDate : <span className="text-muted-foreground">{placeholder}</span>}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>
    )
  }

  if (type === "richtext") {
    return (
      <button
        type="button"
        onClick={handleStartEdit}
        className={cn(
          "text-[13px] text-foreground font-medium text-left w-full",
          "transition-colors cursor-text",
          "outline-none focus-visible:ring-1 focus-visible:ring-ring",
          layout === "stacked"
            ? "hover:bg-accent rounded px-2 -mx-2 py-1 min-h-[30px]"
            : "hover:bg-muted/50 rounded px-1 -mx-1 py-0.5 -my-0.5"
        )}
      >
        {renderReadonly ? renderReadonly() : (
          <span className="line-clamp-3">{value ? String(value).replace(/<[^>]*>/g, "").trim() || "--" : "--"}</span>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleStartEdit}
      className={cn(
        "text-[13px] text-foreground font-medium text-left w-full",
        "transition-colors cursor-text",
        "outline-none focus-visible:ring-1 focus-visible:ring-ring",
        layout === "stacked"
          ? "hover:bg-accent rounded px-2 -mx-2 py-1 min-h-[30px]"
          : "hover:bg-muted/50 rounded px-1 -mx-1 py-0.5 -my-0.5"
      )}
    >
      {renderReadonly ? renderReadonly() : renderDisplayValue(type, value, placeholder)}
    </button>
  )
}

function formatDisplayDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function renderDisplayValue(
  type: EditableFieldProps["type"],
  value: string | number | null,
  placeholder: string
): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">{placeholder}</span>
  }
  if (type === "email") {
    return (
      <a href={`mailto:${value}`} className="text-primary hover:underline">
        {String(value)}
      </a>
    )
  }
  if (type === "phone") {
    return String(value)
  }
  if (type === "number") {
    return String(value)
  }
  if (type === "date") {
    return formatDisplayDate(String(value))
  }
  return String(value)
}
