"use client"

import * as React from "react"
import {
  Search, Settings, ChevronDown, Plus, Filter,
  LayoutGrid, Columns2, Sliders, X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CrmFilterChipRow } from "./CrmFilterChipRow"
import { SortPopover, SortField } from "./SortPopover"
import {
  TableSettingsDialog,
  TableSettings,
  loadTableSettings,
  saveTableSettings,
} from "@/components/crm/TableSettingsDialog"

export interface GenericActiveFilter {
  id: string
  label: string
  type: "searchable-property" | "simple-property" | "date" | "text" | "number" | "check" | "arrows" | "generic"
  options?: (string | { value: string, label: string, color?: string })[]
  value: unknown
  onChange: (val: any) => void
}

interface CrmFilterBarProps {
  // Search
  onSearchChange?: (value: string) => void
  searchValue?: string

  // The generic active filters configuration
  activeFilters?: GenericActiveFilter[]

  // Dynamic pinning
  pinnedFilterIds?: string[]
  onAddPinnedFilter?: (id: string, label: string) => void
  onRemovePinnedFilter?: (id: string) => void

  onClearAll?: () => void
  activeFilterCount?: number

  // Advanced filters sidebar
  onAdvancedFilterClick?: () => void

  // Columns management
  onEditColumnsClick?: () => void

  // View mode
  viewMode?: "table" | "board"
  onViewModeChange?: (mode: "table" | "board") => void
  className?: string
  placeholder?: string
  moreFilters?: { category: string, items: { id: string, name: string, type: string }[] }[]

  // Table settings
  tableSettings?: TableSettings
  onTableSettingsChange?: (settings: TableSettings) => void

  // Sort
  sortFields?: SortField[]
  sortBy?: string
  sortDir?: "asc" | "desc"
  onSortChange?: (field: string, dir: "asc" | "desc") => void

  // Export
  onExportClick?: () => void
}

export function CrmFilterBar({
  onSearchChange,
  searchValue = "",
  activeFilters,
  pinnedFilterIds = [],
  onAddPinnedFilter,
  onRemovePinnedFilter,
  onClearAll,
  activeFilterCount = 0,
  onAdvancedFilterClick,
  onEditColumnsClick,
  viewMode = "table",
  onViewModeChange,
  className,
  placeholder = "Search",
  moreFilters,
  tableSettings,
  onTableSettingsChange,
  onExportClick,
  sortFields,
  sortBy = "",
  sortDir = "asc",
  onSortChange,
}: CrmFilterBarProps) {
  const [tableSettingsOpen, setTableSettingsOpen] = React.useState(false)

  return (
    <div className={cn("flex flex-col bg-background border-b border-border shrink-0", className)}>
      {/* Row 1: Search and Action buttons */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border flex-wrap">
        <div className="relative flex-1 min-w-0 max-w-[420px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchValue}
            className="pl-9 h-9 rounded-full border-border focus-visible:ring-1 focus-visible:ring-muted-foreground/50 bg-background text-[13px]"
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange?.("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          {onViewModeChange ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-[34px] px-3 font-medium text-[13px] border-border gap-1.5 min-w-[130px] justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    {viewMode === "table" ? (
                      <LayoutGrid className="h-3.5 w-3.5" />
                    ) : (
                      <Columns2 className="h-3.5 w-3.5" />
                    )}
                    {viewMode === "table" ? "Table view" : "Board view"}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px] p-1 shadow-xl border-border">
                <DropdownMenuItem
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-[13px] cursor-pointer rounded-sm",
                    viewMode === "table" && "bg-muted/50 font-bold"
                  )}
                  onClick={() => onViewModeChange("table")}
                >
                  <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                  Table view
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-[13px] cursor-pointer rounded-sm",
                    viewMode === "board" && "bg-muted/50 font-bold"
                  )}
                  onClick={() => onViewModeChange("board")}
                >
                  <Columns2 className="h-4 w-4 text-muted-foreground" />
                  Board view
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <Button variant="outline" size="icon" className="h-[34px] w-[34px] border-border" onClick={() => setTableSettingsOpen(true)}>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-[34px] px-3 font-medium text-[13px] border-border"
            onClick={onEditColumnsClick}
          >
            Edit columns
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onAdvancedFilterClick}
            className={cn(
              "h-[34px] px-3 font-bold text-[13px] gap-1.5 transition-all",
              activeFilterCount > 0
                ? "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                : "bg-secondary/80 text-foreground border-border hover:bg-secondary dark:bg-accent dark:text-foreground dark:border-accent dark:hover:bg-accent/80"
            )}
          >
            <Sliders className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded bg-primary text-primary-foreground text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {onSortChange && sortFields ? (
            <SortPopover
              fields={sortFields}
              sortBy={sortBy}
              sortDir={sortDir}
              onSortChange={onSortChange}
            />
          ) : null}

          <Button
            variant="outline"
            size="sm"
            className="h-[34px] px-3 font-medium text-[13px] border-border hidden sm:inline-flex"
            onClick={onExportClick}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Row 2: Quick Filters */}
      <CrmFilterChipRow
        activeFilters={activeFilters}
        pinnedFilterIds={pinnedFilterIds}
        onAddPinnedFilter={onAddPinnedFilter}
        onRemovePinnedFilter={onRemovePinnedFilter}
        onClearAll={onClearAll}
        activeFilterCount={activeFilterCount}
        onAdvancedFilterClick={onAdvancedFilterClick}
        moreFilters={moreFilters}
      />

      <TableSettingsDialog
        open={tableSettingsOpen}
        onOpenChange={setTableSettingsOpen}
        settings={tableSettings || loadTableSettings()}
        onSettingsChange={onTableSettingsChange || saveTableSettings}
      />
    </div>
  )
}
