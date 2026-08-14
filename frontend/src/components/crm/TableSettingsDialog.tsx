"use client"

import * as React from "react"
import { Info } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export type TableRowHeight = "compact" | "default" | "comfortable"
export type TablePaginationMode = number | "infinite"

export interface TableSettings {
  pagination: TablePaginationMode
  rowHeight: TableRowHeight
  zebraStriping: boolean
}

const STORAGE_KEY = "crm_table_settings"

const DEFAULT_SETTINGS: TableSettings = {
  pagination: 25,
  rowHeight: "default",
  zebraStriping: true,
}

export function loadTableSettings(): TableSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {}
  return DEFAULT_SETTINGS
}

export function saveTableSettings(settings: TableSettings) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {}
}

export function getRowHeightClass(rowHeight: TableRowHeight): string {
  switch (rowHeight) {
    case "compact":
      return "py-1"
    case "comfortable":
      return "py-4"
    default:
      return "py-2.5"
  }
}

interface TableSettingsSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: TableSettings
  onSettingsChange: (settings: TableSettings) => void
}

function RadioOption({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <RadioGroupItem value={value} id={`ts-${value}`} />
      <Label
        htmlFor={`ts-${value}`}
        className="text-[13px] font-medium text-foreground cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </Label>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-3">
      <span className="text-[14px] font-bold text-foreground">{children}</span>
      <Info className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
  )
}

export function TableSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: TableSettingsSidebarProps) {
  const [draft, setDraft] = React.useState<TableSettings>(settings)

  React.useEffect(() => {
    if (open) setDraft(settings)
  }, [open, settings])

  const handleApply = () => {
    onSettingsChange(draft)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[360px] sm:w-[360px] sm:max-w-[360px] p-0 gap-0 overflow-hidden max-w-[90vw]"
        showCloseButton={true}
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-[16px] font-bold">Table settings</SheetTitle>
        </SheetHeader>

        <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
          {/* Pagination */}
          <div>
            <SectionLabel>Pagination</SectionLabel>
            <RadioGroup
              value={String(draft.pagination)}
              onValueChange={(val) =>
                setDraft((s) => ({
                  ...s,
                  pagination: val === "infinite" ? "infinite" : Number(val),
                }))
              }
              className="gap-3"
            >
              <RadioOption value="25" label="25 per page" />
              <RadioOption value="50" label="50 per page" />
              <RadioOption value="100" label="100 per page" />
              <RadioOption value="infinite" label="Infinite" />
            </RadioGroup>
          </div>

          <div className="h-px bg-border" />

          {/* Row height */}
          <div>
            <SectionLabel>Row height</SectionLabel>
            <RadioGroup
              value={draft.rowHeight}
              onValueChange={(val) =>
                setDraft((s) => ({ ...s, rowHeight: val as TableRowHeight }))
              }
              className="gap-3"
            >
              <RadioOption value="compact" label="Compact" />
              <RadioOption value="default" label="Default" />
              <RadioOption value="comfortable" label="Comfortable" />
            </RadioGroup>
          </div>

          <div className="h-px bg-border" />

          {/* Zebra striping */}
          <div className="flex items-center justify-between">
            <Label className="text-[14px] font-bold text-foreground">Zebra striping</Label>
            <Switch
              checked={draft.zebraStriping}
              onCheckedChange={(checked) =>
                setDraft((s) => ({ ...s, zebraStriping: checked }))
              }
            />
          </div>
        </div>

        {/* Apply button */}
        <div className="px-6 py-4 border-t border-border">
          <button
            onClick={handleApply}
            className="w-full h-9 rounded-md bg-foreground text-background text-[13px] font-bold hover:bg-foreground/90 transition-colors"
          >
            Apply
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
