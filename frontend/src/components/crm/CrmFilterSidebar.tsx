"use client"

import * as React from "react"
import { X, Search, ChevronDown, ChevronRight, Plus, Trash2, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  VisuallyHidden,
} from "@/components/ui/sheet"
import type { GenericCrmFilters, AdvancedFilter } from "@/hooks/use-crm-filters"

export interface SidebarFilterConfig {
  id: string
  label: string
  type: "text" | "property" | "number" | "date" | "check" | "link" | "fx" | "arrows" | "code"
  options?: string[] // For 'property' type
}

export interface SidebarFilterCategory {
  category: string
  items: SidebarFilterConfig[]
}

interface CrmFilterSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: GenericCrmFilters
  config: SidebarFilterConfig[] | SidebarFilterCategory[]
  onToggleProperty: (propertyId: string, value: string) => void
  onUpdateNumber: (propertyId: string, bound: "min" | "max", value: string) => void
  onClearAll: () => void
  onAddAdvancedFilter: (filter: Omit<AdvancedFilter, "id">) => void
  onRemoveAdvancedFilter: (id: string) => void
  activeFilterCount: number
}

const FilterItemRow = ({
  conf,
  filters,
  onToggleProperty,
  onUpdateNumber
}: {
  conf: SidebarFilterConfig,
  filters: GenericCrmFilters,
  onToggleProperty: (id: string, val: string) => void,
  onUpdateNumber: (id: string, bound: "min" | "max", val: string) => void
}) => {
  if (conf.type === "property" && conf.options) {
    return (
      <FilterSection key={conf.id} title={conf.label}>
        <PropertyFilterSection
          options={conf.options}
          selected={filters.properties[conf.id] || []}
          onToggle={(val) => onToggleProperty(conf.id, val)}
        />
      </FilterSection>
    )
  }
  if (conf.type === "number") {
    const numState = filters.numbers[conf.id] || { min: "", max: "" }
    return (
      <FilterSection key={conf.id} title={conf.label} defaultOpen={false}>
        <AmountFilterSection
          min={numState.min}
          max={numState.max}
          onChange={(bound, val) => onUpdateNumber(conf.id, bound, val)}
        />
      </FilterSection>
    )
  }

  // For types like check, fx, arrows, code, link - treat as property for now or simple toggle
  if (["check", "fx", "arrows", "code", "link"].includes(conf.type)) {
    return (
      <FilterSection key={conf.id} title={conf.label} defaultOpen={false}>
        <div className="px-5 py-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="rounded border-border text-primary focus:ring-primary"
              checked={(filters.properties[conf.id] || []).includes("true")}
              onChange={(e) => onToggleProperty(conf.id, e.target.checked ? "true" : "false")}
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Enabled</span>
          </label>
        </div>
      </FilterSection>
    )
  }

  return null
}

const FilterSection = ({
  title,
  children,
  defaultOpen = true
}: {
  title: string,
  children: React.ReactNode,
  defaultOpen?: boolean
}) => {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-3.5 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="text-[13px] font-bold text-foreground">{title}</span>
        <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-90")} />
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  )
}

function PropertyFilterSection({ options, selected, onToggle }: {
  options: string[]
  selected: string[]
  onToggle: (val: string) => void
}) {
  const [search, setSearch] = React.useState("")

  const cleanOptions = React.useMemo(() => {
    return Array.from(new Set(options.map(o => (o || '').trim()).filter(Boolean)))
  }, [options])

  const filtered = cleanOptions.filter((o) => o.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col gap-2">
      {cleanOptions.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-[13px] border-border focus-visible:ring-0 focus-visible:border-primary rounded-md"
          />
        </div>
      )}
      <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto">
        {filtered.map((opt) => (
          <label key={opt} className="flex items-center gap-3 px-1 py-1.5 hover:bg-muted/50 rounded-md cursor-pointer">
            <Checkbox
              checked={selected.includes(opt)}
              onCheckedChange={() => onToggle(opt)}
              className="h-4 w-4 rounded-sm border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-[13px] text-foreground font-medium truncate">{opt}</span>
          </label>
        ))}
        {filtered.length === 0 && (
          <p className="text-[12px] text-muted-foreground py-2 text-center">No options found</p>
        )}
      </div>
    </div>
  )
}

function AmountFilterSection({ min, max, onChange }: {
  min: string
  max: string
  onChange: (bound: "min" | "max", val: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Min</label>
          <Input
            placeholder="e.g. 10,000"
            value={min}
            onChange={(e) => onChange("min", e.target.value)}
            className="h-8 text-[13px] border-border focus-visible:ring-0 focus-visible:border-primary"
          />
        </div>
        <div className="flex-1">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Max</label>
          <Input
            placeholder="e.g. 1,000,000"
            value={max}
            onChange={(e) => onChange("max", e.target.value)}
            className="h-8 text-[13px] border-border focus-visible:ring-0 focus-visible:border-primary"
          />
        </div>
      </div>
    </div>
  )
}

function AddFilterSection({ config, onAdd }: { config: SidebarFilterConfig[], onAdd: (filter: Omit<AdvancedFilter, "id">) => void }) {
  const [search, setSearch] = React.useState("")
  const filtered = config.filter((p) =>
    p.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search properties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-[13px] border-border focus-visible:ring-0 focus-visible:border-primary rounded-md"
        />
      </div>
      <div className="flex flex-col gap-0.5 max-h-[180px] overflow-y-auto">
        {filtered.map((prop) => (
          <button
            key={prop.id}
            onClick={() =>
              onAdd({
                property: prop.id,
                operator: "is_known", // Default to simple operator for generic behavior
                value: "",
              })
            }
            className="flex items-center gap-3 px-2 py-2 hover:bg-muted/50 rounded-md text-left transition-colors group"
          >
            <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-[13px] text-foreground group-hover:text-foreground font-medium">{prop.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export function CrmFilterSidebar({
  open,
  onOpenChange,
  filters,
  config,
  onToggleProperty,
  onUpdateNumber,
  onClearAll,
  onAddAdvancedFilter,
  onRemoveAdvancedFilter,
  activeFilterCount,
}: CrmFilterSidebarProps) {
  const [filterSearch, setFilterSearch] = React.useState("")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-[400px] sm:max-w-[400px] p-0 flex flex-col gap-0 border-l border-border shadow-2xl max-w-[90vw]"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Advanced filters</SheetTitle>
          <SheetDescription>Apply complex filters to your CRM data</SheetDescription>
        </SheetHeader>
        {/* Visual Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <h2 className="text-[15px] font-bold text-foreground m-0">
              Advanced filters
            </h2>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {activeFilterCount > 0 && (
              <button
                onClick={onClearAll}
                className="text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Global Search within filters */}
        <div className="px-5 py-3 bg-muted/50 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search all filters..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="h-9 pl-9 text-[13px] bg-background border-border focus-visible:ring-primary/20 focus-visible:border-primary"
            />
          </div>
        </div>

        {/* Active filters chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 py-3 bg-muted/80 border-b border-border shrink-0 max-h-[120px] overflow-y-auto">
            {(() => {
              const getConfig = (id: string) => {
                if (!config) return null;
                if ('category' in config[0]) {
                  for (const cat of config as SidebarFilterCategory[]) {
                    const found = cat.items.find(i => i.id === id);
                    if (found) return found;
                  }
                } else {
                  return (config as SidebarFilterConfig[]).find(c => c.id === id);
                }
                return null;
              };

              return (
                <>
                  {/* Generate chips for active array properties */}
                  {Object.entries(filters.properties).flatMap(([propId, values]) =>
                    values.map((v) => {
                      const conf = getConfig(propId);
                      return (
                        <span key={`${propId}-${v}`} className="inline-flex items-center gap-1.5 h-6 px-2.5 bg-primary/10 text-primary text-[12px] font-semibold rounded-full border border-primary/20 truncate max-w-full">
                          {conf ? conf.label : propId}: {v}
                          <button onClick={() => onToggleProperty(propId, v)} className="shrink-0 ml-1"><X className="h-3 w-3" /></button>
                        </span>
                      )
                    })
                  )}

                  {/* Generate chips for date ranges */}
                  {Object.entries(filters.dateRanges).map(([propId, range]) => {
                    if (range === "all") return null;
                    const conf = getConfig(propId);
                    return (
                      <span key={propId} className="inline-flex items-center gap-1.5 h-6 px-2.5 bg-status-purple-light text-status-purple text-[12px] font-semibold rounded-full border border-status-purple/20">
                        {conf ? conf.label : propId}: {range.replace("_", " ")}
                        <button onClick={() => {/* handled via main reset or specific toggle if added */ }} className="ml-1"><X className="h-3 w-3" /></button>
                      </span>
                    )
                  })}

                  {/* Generate chips for number ranges */}
                  {Object.entries(filters.numbers).map(([propId, b]) => {
                    if (!b.min && !b.max) return null;
                    const conf = getConfig(propId);
                    return (
                      <span key={propId} className="inline-flex items-center gap-1.5 h-6 px-2.5 bg-status-success-light text-status-success text-[12px] font-semibold rounded-full border border-status-success/20">
                        {conf ? conf.label : propId}: {b.min || "0"} - {b.max || "∞"}
                        <button onClick={() => { onUpdateNumber(propId, "min", ""); onUpdateNumber(propId, "max", "") }} className="ml-1"><X className="h-3 w-3" /></button>
                      </span>
                    )
                  })}

                  {/* Advanced Filters */}
                  {filters.advancedFilters.map((f) => {
                    const conf = getConfig(f.property);
                    return (
                      <span key={f.id} className="inline-flex items-center gap-1.5 h-6 px-2.5 bg-muted text-foreground text-[12px] font-semibold rounded-full border border-border">
                        {conf ? conf.label : f.property}: {f.value || f.operator.replace("_", " ")}
                        <button onClick={() => onRemoveAdvancedFilter(f.id)} className="ml-1"><X className="h-3 w-3" /></button>
                      </span>
                    )
                  })}
                </>
              );
            })()}
          </div>
        )}

        {/* Scrollable filter body */}
        <div className="flex-1 overflow-y-auto">
          {(() => {
            const isCategorized = config.length > 0 && 'category' in config[0];

            if (isCategorized) {
              return (config as SidebarFilterCategory[]).map((cat) => {
                const filteredItems = cat.items.filter(item =>
                  item.label.toLowerCase().includes(filterSearch.toLowerCase())
                );

                if (filterSearch && filteredItems.length === 0) return null;

                return (
                  <div key={cat.category} className="mb-2">
                    <div className="px-5 py-2 bg-muted/50 border-y border-border">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{cat.category}</span>
                    </div>
                    {filteredItems.map((conf) => (
                      <FilterItemRow
                        key={conf.id}
                        conf={conf}
                        filters={filters}
                        onToggleProperty={onToggleProperty}
                        onUpdateNumber={onUpdateNumber}
                      />
                    ))}
                  </div>
                );
              });
            }

            return (config as SidebarFilterConfig[])
              .filter(conf => conf.label.toLowerCase().includes(filterSearch.toLowerCase()))
              .map((conf) => (
                <FilterItemRow
                  key={conf.id}
                  conf={conf}
                  filters={filters}
                  onToggleProperty={onToggleProperty}
                  onUpdateNumber={onUpdateNumber}
                />
              ));
          })()}

          <FilterSection title="Add a custom filter" defaultOpen={false}>
            {(() => {
              const flatConfig = config.length > 0 && 'category' in config[0]
                ? (config as SidebarFilterCategory[]).flatMap(c => c.items)
                : (config as SidebarFilterConfig[]);
              return <AddFilterSection config={flatConfig} onAdd={onAddAdvancedFilter} />;
            })()}
          </FilterSection>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-t border-border bg-background">
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Reset all
          </button>
          <Button
            onClick={() => onOpenChange(false)}
            className="h-9 px-6 bg-primary hover:bg-primary/90 text-primary-foreground text-[13px] font-bold rounded-lg shadow-sm"
          >
            Apply filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
