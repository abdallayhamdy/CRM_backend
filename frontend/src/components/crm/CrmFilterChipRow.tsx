"use client"

import * as React from "react"
import { ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  SearchablePropertyFilter,
  SimplePropertyFilter,
  DateQuickFilter,
  TextPropertyFilter,
  NumberPropertyFilter,
} from "@/components/crm/CrmQuickFilterPopover"
import { GenericActiveFilter } from "./CrmFilterBar"

interface CrmFilterChipRowProps {
  activeFilters?: GenericActiveFilter[]
  // NOTE: Dynamic pinning of new quick filters via the "+ More" popover has been
  // removed per client feedback (UI declutter). Props are kept optional/no-ops
  // here so existing callers (e.g. onRemovePinnedFilter for chip removal) keep working.
  /** @deprecated "+ More" quick-filter management was removed per client feedback. */
  pinnedFilterIds?: string[]
  /** @deprecated No longer rendered. */
  onAddPinnedFilter?: (id: string, label: string) => void
  /** @deprecated No longer rendered. */
  onRemovePinnedFilter?: (id: string) => void
  onClearAll?: () => void
  activeFilterCount?: number
  onAdvancedFilterClick?: () => void
  /** @deprecated No longer rendered. */
  moreFilters?: { category: string, items: { id: string, name: string, type: string }[] }[]
  /** @deprecated No longer rendered. */
  showMoreButton?: boolean
  className?: string
}

export function CrmFilterChipRow({
  activeFilters = [],
  onClearAll,
  activeFilterCount = 0,
  className,
}: CrmFilterChipRowProps) {
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
