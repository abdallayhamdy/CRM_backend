"use client"

import * as React from "react"
import {
  Pencil, GripVertical, Trash2, Calendar, Hash, CheckSquare, ArrowRightLeft, Link2, ChevronLeft as BackIcon,
  Search, ChevronDown, Plus, Filter, X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  SearchablePropertyFilter,
  SimplePropertyFilter,
  DateQuickFilter,
  TextPropertyFilter,
  NumberPropertyFilter,
} from "@/components/crm/CrmQuickFilterPopover"
import { MORE_FILTERS } from "@/lib/filter-data"
import { GenericActiveFilter } from "./CrmFilterBar"

interface CrmFilterChipRowProps {
  activeFilters?: GenericActiveFilter[]
  pinnedFilterIds?: string[]
  onAddPinnedFilter?: (id: string, label: string) => void
  onRemovePinnedFilter?: (id: string) => void
  onClearAll?: () => void
  activeFilterCount?: number
  onAdvancedFilterClick?: () => void
  moreFilters?: { category: string, items: { id: string, name: string, type: string }[] }[]
  showMoreButton?: boolean
  className?: string
}

export function CrmFilterChipRow({
  activeFilters = [],
  pinnedFilterIds = [],
  onAddPinnedFilter,
  onRemovePinnedFilter,
  onClearAll,
  activeFilterCount = 0,
  onAdvancedFilterClick,
  moreFilters,
  showMoreButton = true,
  className,
}: CrmFilterChipRowProps) {
  const [editFiltersView, setEditFiltersView] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const activeMoreFilters = moreFilters || MORE_FILTERS

  const filteredMoreFilters = activeMoreFilters.map(group => ({
    ...group,
    items: group.items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !pinnedFilterIds.includes(item.id)
    )
  })).filter(group => group.items.length > 0)

  return (
    <div className={cn("flex items-center gap-1 px-4 py-2 overflow-x-auto", className)}>
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
        {activeFilters.map((filter) => {
          const FilterButton = (
            <button className={cn(
              "group relative flex items-center gap-1 text-[13px] font-bold transition-colors cursor-pointer select-none whitespace-nowrap",
              (filter.value && filter.value !== "all" && (!Array.isArray(filter.value) || (filter.value as any[]).length > 0))
                ? "text-primary"
                : "text-foreground hover:text-foreground/80"
            )}>
              {filter.label}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-muted-foreground" />
              {filter.value as any && filter.value !== "all" && Array.isArray(filter.value) && (filter.value as any[]).length > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded bg-primary text-primary-foreground text-[10px] font-bold ml-0.5">
                  {(filter.value as any[]).length}
                </span>
              )}
              {filter.value && filter.value !== "all" && !Array.isArray(filter.value) && (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded bg-primary text-primary-foreground text-[10px] font-bold ml-0.5">
                  1
                </span>
              )}
            </button>
          )

          return (
            <React.Fragment key={filter.id}>
              {filter.type === "searchable-property" && (
                <SearchablePropertyFilter
                  label={filter.label}
                  options={filter.options || []}
                  selected={filter.value as string[]}
                  onToggle={filter.onChange}
                >
                  {FilterButton}
                </SearchablePropertyFilter>
              )}

              {filter.type === "simple-property" && (
                <SimplePropertyFilter
                  label={filter.label}
                  options={filter.options || []}
                  selected={filter.value as string[]}
                  onToggle={filter.onChange}
                >
                  {FilterButton}
                </SimplePropertyFilter>
              )}

              {filter.type === "date" && (
                <DateQuickFilter
                  selected={filter.value as string}
                  onSelect={filter.onChange}
                >
                  {FilterButton}
                </DateQuickFilter>
              )}

              {(filter.type === "text" || filter.type === "generic") && (
                <TextPropertyFilter
                  label={filter.label}
                  value={filter.value as string}
                  onChange={filter.onChange}
                >
                  {FilterButton}
                </TextPropertyFilter>
              )}

              {filter.type === "number" && (
                <NumberPropertyFilter
                  label={filter.label}
                  value={filter.value as string | { min?: number; max?: number }}
                  onChange={filter.onChange}
                >
                  {FilterButton}
                </NumberPropertyFilter>
              )}

              <div className="w-px h-4 border-border bg-background mx-2 shrink-0" />
            </React.Fragment>
          )
        })}

        {showMoreButton && (
          <Popover onOpenChange={(open) => {
            if (!open) {
              setEditFiltersView(false)
              setSearchQuery("")
            }
          }}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 text-[13px] font-bold text-primary hover:text-primary/80 transition-colors shrink-0">
              <Plus className="h-3.5 w-3.5" />
              More
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[380px] p-0 rounded-sm shadow-xl mt-1 flex flex-col border-border overflow-hidden"
            align="start"
          >
            {editFiltersView ? (
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <button
                    onClick={() => setEditFiltersView(false)}
                    className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <BackIcon className="h-3.5 w-3.5" /> Back
                  </button>
                  <button
                    onClick={() => setEditFiltersView(false)}
                    className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>

                <div className="px-4 pt-4 pb-3">
                  <h3 className="text-[15px] font-bold text-foreground tracking-tight mb-3">Edit quick filters</h3>
                  <div className="flex flex-wrap gap-2">
                    {activeFilters.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-1.5 bg-background border border-border rounded-sm px-2 py-1.5 text-[12px] font-medium text-foreground shadow-sm group"
                      >
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab shrink-0" />
                        <span className="truncate max-w-[90px]">{f.label}</span>
                        <button
                          onClick={() => onRemovePinnedFilter?.(f.id)}
                          className="ml-0.5 h-4 w-4 rounded-full flex items-center justify-center hover:border-border bg-background transition-colors shrink-0"
                        >
                          <X className="h-2.5 w-2.5 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                    <div
                      onClick={() => setEditFiltersView(false)}
                      className="flex items-center gap-1 border border-dashed border-border rounded-sm px-2.5 py-1.5 text-[12px] font-medium text-primary hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Add quick filter
                    </div>
                  </div>
                </div>

                <div className="border-t border-border px-4 py-3">
                  <button
                    onClick={onClearAll}
                    className="flex items-center gap-2 text-[13px] font-semibold text-foreground hover:text-destructive transition-colors group"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                    Delete all quick filters
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col bg-muted/80 border-b border-border shrink-0">
                  <div className="flex justify-center p-2.5 border-b border-border">
                    <button
                      onClick={() => setEditFiltersView(true)}
                      className="flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:text-primary/80 hover:underline underline-offset-2"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit quick filters
                    </button>
                  </div>
                  <div className="px-4 py-3 pb-4">
                    <h3 className="text-[14px] font-bold text-foreground mb-3 tracking-tight">Add a quick filter</h3>
                    <div className="relative">
                      <Input
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 rounded-full pl-4 pr-10 border-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary bg-background"
                      />
                      <Search className="absolute right-3.5 top-2 h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col py-2 max-h-[350px] overflow-y-auto">
                  {filteredMoreFilters.map((group, groupIdx) => (
                    <div key={groupIdx} className="flex flex-col pb-4 last:pb-2">
                      <h4 className="px-5 py-2 text-[14px] font-bold text-foreground tracking-tight">{group.category}</h4>
                      {group.items.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          onClick={() => onAddPinnedFilter?.(item.id, item.name)}
                          className="flex items-center px-5 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <div className="w-5 flex shrink-0 justify-center mr-3 text-muted-foreground">
                            {item.type === "text" && <span className="text-[11px] font-medium tracking-tighter">Abc</span>}
                            {item.type === "date" && <Calendar className="h-[15px] w-[15px] stroke-[1.5]" />}
                            {item.type === "number" && <Hash className="h-[15px] w-[15px] stroke-[1.5]" />}
                            {item.type === "check" && <CheckSquare className="h-[15px] w-[15px] stroke-[1.5]" />}
                            {item.type === "arrows" && <ArrowRightLeft className="h-[15px] w-[15px] stroke-[1.5]" />}
                            {item.type === "fx" && <span className="text-[12px] italic font-serif tracking-tighter">fx</span>}
                            {item.type === "code" && <span className="text-[10px] font-mono tracking-tighter font-semibold">&lt;/&gt;</span>}
                            {item.type === "link" && <Link2 className="h-[15px] w-[15px] stroke-[1.5]" />}
                          </div>
                          <span className="text-[13px] text-foreground truncate">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </PopoverContent>
        </Popover>
        )}
      </div>

      {activeFilterCount > 0 && onClearAll && (
        <>
          <div className="w-px h-4 border-border bg-background mx-2 shrink-0" />
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-[12px] font-semibold text-destructive hover:text-destructive/80 transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
            Clear all
          </button>
        </>
      )}
    </div>
  )
}
