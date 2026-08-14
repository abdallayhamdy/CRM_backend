"use client"

import * as React from "react"
import { X, FileSpreadsheet, FileText, File, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

export interface ExportColumn {
  id: string
  label: string
  visible: boolean
}

export type ExportFormat = "csv" | "xlsx" | "pdf"

export type ExportScope = "all" | "filtered" | "selected"

interface ExportSlideOverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityLabel: string
  columns: ExportColumn[]
  totalCount: number
  filteredCount: number
  selectedCount: number
  hasActiveFilter: boolean
  onExport: (format: ExportFormat, columnIds: string[], scope: ExportScope) => void
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string; desc: string; icon: React.ElementType }[] = [
  { value: "csv", label: "CSV", desc: "Best for spreadsheets", icon: FileText },
  { value: "xlsx", label: "Excel (.xlsx)", desc: "Best for spreadsheets", icon: FileSpreadsheet },
  { value: "pdf", label: "PDF", desc: "Best for printing", icon: File },
]

export function ExportSlideOver({
  open,
  onOpenChange,
  entityLabel,
  columns: initialColumns,
  totalCount,
  filteredCount,
  selectedCount,
  hasActiveFilter,
  onExport,
}: ExportSlideOverProps) {
  const [format, setFormat] = React.useState<ExportFormat>("csv")
  const [columnMode, setColumnMode] = React.useState<"all" | "visible" | "custom">("all")
  const [selectedColumnIds, setSelectedColumnIds] = React.useState<Set<string>>(new Set())
  const [scope, setScope] = React.useState<ExportScope>("all")
  const [exporting, setExporting] = React.useState(false)

  const visibleColumnIds = React.useMemo(
    () => new Set(initialColumns.filter((c) => c.visible).map((c) => c.id)),
    [initialColumns]
  )

  const allColumnIds = React.useMemo(
    () => new Set(initialColumns.map((c) => c.id)),
    [initialColumns]
  )

  const effectiveColumnIds = React.useMemo(() => {
    if (columnMode === "all") return allColumnIds
    if (columnMode === "visible") return visibleColumnIds
    return selectedColumnIds
  }, [columnMode, allColumnIds, visibleColumnIds, selectedColumnIds])

  const handleColumnModeChange = (mode: "all" | "visible" | "custom") => {
    setColumnMode(mode)
    if (mode === "all") setSelectedColumnIds(new Set(allColumnIds))
    else if (mode === "visible") setSelectedColumnIds(new Set(visibleColumnIds))
  }

  const handleToggleColumn = (columnId: string) => {
    setColumnMode("custom")
    setSelectedColumnIds((prev) => {
      const next = new Set(prev)
      if (next.has(columnId)) next.delete(columnId)
      else next.add(columnId)
      return next
    })
  }

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      setFormat("csv")
      setColumnMode("all")
      setSelectedColumnIds(new Set(allColumnIds))
      setScope("all")
      setExporting(false)
    }
    onOpenChange(nextOpen)
  }, [allColumnIds, onOpenChange])

  const handleExport = async () => {
    setExporting(true)
    // Simulated processing delay
    await new Promise((resolve) => setTimeout(resolve, 700))
    onExport(format, Array.from(effectiveColumnIds), scope)
    setExporting(false)
    onOpenChange(false)
  }

  const recordCount = scope === "all" ? totalCount : scope === "filtered" ? filteredCount : selectedCount

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ top: "56px", height: "calc(100vh - 56px)" }}
        className="w-[420px] p-0 overflow-hidden gap-0 border-l border-border shadow-2xl data-[side=right]:sm:max-w-[420px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background shrink-0">
          <div>
            <SheetTitle className="text-[17px] font-bold text-foreground tracking-tight">
              Export {entityLabel}
            </SheetTitle>
            <SheetDescription className="text-[13px] text-muted-foreground font-medium mt-0.5">
              Configure your export settings
            </SheetDescription>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-6 overflow-y-auto flex-1">
          {/* Section 1: Format */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wider">Format</h3>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)} className="space-y-2">
              {FORMAT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    format === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <RadioGroupItem value={opt.value} />
                  <opt.icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-[13px] font-medium text-foreground">{opt.label}</span>
                    <span className="text-[12px] text-muted-foreground ml-2">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Section 2: Columns */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wider">Columns to export</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleColumnModeChange("all")}
                className={cn(
                  "px-3 py-1.5 text-[12px] font-medium rounded-md border transition-colors",
                  columnMode === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-muted"
                )}
              >
                All columns
              </button>
              <button
                onClick={() => handleColumnModeChange("visible")}
                className={cn(
                  "px-3 py-1.5 text-[12px] font-medium rounded-md border transition-colors",
                  columnMode === "visible"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-muted"
                )}
              >
                Visible columns only
              </button>
            </div>
            <div className="text-[12px] text-muted-foreground">
              {effectiveColumnIds.size} of {initialColumns.length} columns selected
            </div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto border border-border rounded-lg p-2">
              {initialColumns.map((col) => (
                <label
                  key={col.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={effectiveColumnIds.has(col.id)}
                    onCheckedChange={() => handleToggleColumn(col.id)}
                  />
                  <span className="text-[13px] text-foreground">{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 3: Records */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wider">Records to export</h3>
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as ExportScope)} className="space-y-2">
              <label
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  scope === "all"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <RadioGroupItem value="all" />
                <div className="flex-1">
                  <span className="text-[13px] font-medium text-foreground">All records</span>
                  <span className="text-[12px] text-muted-foreground ml-2">
                    {totalCount} {entityLabel.toLowerCase()}
                  </span>
                </div>
              </label>
              {hasActiveFilter && (
                <label
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    scope === "filtered"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <RadioGroupItem value="filtered" />
                  <div className="flex-1">
                    <span className="text-[13px] font-medium text-foreground">Current filtered view</span>
                    <span className="text-[12px] text-muted-foreground ml-2">
                      {filteredCount} {entityLabel.toLowerCase()}
                    </span>
                  </div>
                </label>
              )}
              {selectedCount > 0 && (
                <label
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    scope === "selected"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <RadioGroupItem value="selected" />
                  <div className="flex-1">
                    <span className="text-[13px] font-medium text-foreground">Selected records only</span>
                    <span className="text-[12px] text-muted-foreground ml-2">
                      {selectedCount} {entityLabel.toLowerCase()}
                    </span>
                  </div>
                </label>
              )}
            </RadioGroup>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-3.5 border-t border-border flex items-center justify-end gap-2 bg-background z-20 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting || effectiveColumnIds.size === 0}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Preparing export...
              </>
            ) : (
              `Export ${recordCount} records`
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
