"use client"

import * as React from "react"
import { Search, X, GripVertical, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { PROPERTY_GROUPS_CONFIG, CrmPropertyGroup } from "@/lib/crm-properties"

export interface ColumnItem {
  id: string
  label: string
  visible: boolean
}

interface CrmColumnEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnItem[]
  propertyGroups?: CrmPropertyGroup[]
  onSave: (columns: ColumnItem[], frozenCount: number) => void
  title?: string
  description?: string
}

function ColumnItem({
  column,
  onRemove,
}: {
  column: ColumnItem
  onRemove: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-2 p-1.5 bg-background border border-border rounded-md shadow-sm transition-all group text-[12px]">
      <div className="text-muted-foreground/40 px-0.5 shrink-0">
        <GripVertical className="h-3.5 w-3.5" />
      </div>
      <span className="text-foreground flex-1 font-medium truncate">
        {column.label}
      </span>
      <button
        onClick={() => onRemove(column.id)}
        className="h-4 w-4 flex items-center justify-center text-muted-foreground/40 hover:text-destructive rounded-sm transition-colors shrink-0 opacity-0 group-hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export function CrmColumnEditor({
  open,
  onOpenChange,
  columns: initialColumns,
  propertyGroups = PROPERTY_GROUPS_CONFIG,
  onSave,
  title = "Edit columns",
  description = "Choose which columns to show in your table and their order."
}: CrmColumnEditorProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [frozenCount, setFrozenCount] = React.useState("0")

  const columnGroups = propertyGroups

  const [columns, setColumns] = React.useState<ColumnItem[]>(() => {
    const allProps = columnGroups.flatMap(g => g.items)
    const propMap = new Map(allProps.map(p => [p.id, p]))

    const initialItems: ColumnItem[] = initialColumns.map(c => ({
      id: c.id,
      label: c.label || propMap.get(c.id)?.label || c.id,
      visible: c.visible
    }))

    const initialIds = new Set(initialItems.map(c => c.id))
    allProps.forEach(prop => {
      if (!initialIds.has(prop.id)) {
        initialItems.push({
          id: prop.id,
          label: prop.label,
          visible: false
        })
      }
    })

    return initialItems
  })

  React.useEffect(() => {
    if (open) {
      const allProps = columnGroups.flatMap(g => g.items)
      const propMap = new Map(allProps.map(p => [p.id, p]))

      const newItems: ColumnItem[] = initialColumns.map(c => ({
        id: c.id,
        label: c.label || propMap.get(c.id)?.label || c.id,
        visible: c.visible
      }))

      const newIds = new Set(newItems.map(c => c.id))
      allProps.forEach(prop => {
        if (!newIds.has(prop.id)) {
          newItems.push({
            id: prop.id,
            label: prop.label,
            visible: false
          })
        }
      })

      setColumns(newItems)
      setSearchQuery("")
    }
  }, [initialColumns, open, columnGroups])

  const filteredGroups = React.useMemo(() => {
    return columnGroups.map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(group => group.items.length > 0)
  }, [columnGroups, searchQuery])

  const selectedColumns = React.useMemo(() =>
    columns.filter(col => col.visible),
    [columns]
  )

  const toggleColumn = (id: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === id ? { ...col, visible: !col.visible } : col
      )
    )
  }

  const removeColumn = (id: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === id ? { ...col, visible: false } : col
      )
    )
  }

  const handleSave = () => {
    onSave(columns, parseInt(frozenCount) || 0)
    onOpenChange(false)
  }

  const handleRemoveAll = () => {
    setColumns(prev => prev.map(c => ({ ...c, visible: false })))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        style={{ top: "56px", height: "calc(100vh - 56px)" }}
        className="w-[480px] p-0 overflow-hidden gap-0 border-l border-border shadow-2xl max-w-[90vw] data-[side=right]:sm:max-w-[480px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background shrink-0">
          <div>
            <SheetTitle className="text-[17px] font-bold text-foreground tracking-tight">
              {title}
            </SheetTitle>
            {description && (
              <SheetDescription className="text-[13px] text-muted-foreground font-medium mt-0.5">
                {description}
              </SheetDescription>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body - Two columns */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Available columns */}
          <div className="flex-1 flex flex-col border-r border-border min-w-0">
            <div className="p-3 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search columns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 pr-3 border-border rounded-md text-[13px] bg-background focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filteredGroups.map((group) => (
                <div key={group.title} className="mt-3 first:mt-1">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1.5">
                    {group.title}
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isVisible = columns.find(c => c.id === item.id)?.visible
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center gap-3 py-1.5 px-2 rounded-md transition-colors cursor-pointer group",
                            isVisible
                              ? "bg-muted/70"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => toggleColumn(item.id)}
                        >
                          <Checkbox
                            checked={isVisible}
                            onCheckedChange={() => toggleColumn(item.id)}
                            className="h-4 w-4 border-border rounded-[2px] data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
                          />
                          <span className="text-[13px] text-foreground font-normal leading-tight truncate">
                            {item.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              <div className="mt-8 mb-4 text-[12px] text-muted-foreground px-2 border-t border-border pt-4">
                <p>
                  Don&apos;t see the property you&apos;re looking for?{" "}
                  <button className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                    Create a property <ExternalLink className="h-3 w-3" />
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Right: Selected columns */}
          <div className="w-[180px] flex flex-col bg-muted/20 shrink-0">
            <div className="p-3 border-b border-border flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Selected ({selectedColumns.length})
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">Frozen</span>
                <Select value={frozenCount} onValueChange={(v) => setFrozenCount(v || "0")}>
                  <SelectTrigger className="h-6 w-10 text-[11px] bg-background border-border rounded-md px-1.5 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-md">
                    <SelectItem value="0" className="text-[12px]">0</SelectItem>
                    <SelectItem value="1" className="text-[12px]">1</SelectItem>
                    <SelectItem value="2" className="text-[12px]">2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {selectedColumns.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-[12px] px-3 text-center">
                  <p>No columns selected.</p>
                  <p className="mt-1">Check columns on the left to add them.</p>
                </div>
              ) : (
                    <div className="space-y-1">
                      {selectedColumns.map((column) => (
                        <ColumnItem
                          key={column.id}
                          column={column}
                          onRemove={removeColumn}
                        />
                      ))}
                    </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Sticky at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-3.5 border-t border-border flex items-center justify-between bg-background z-20 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
          <button
            onClick={handleRemoveAll}
            className="text-[13px] text-destructive font-medium hover:underline transition-colors"
          >
            Remove all columns
          </button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-8 px-4 border-border text-foreground font-medium rounded-md text-[13px] hover:bg-muted/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="h-8 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md text-[13px] shadow-sm"
            >
              Apply
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
