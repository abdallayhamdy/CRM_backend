"use client"

import * as React from "react"
import { Search, X, History } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  getTrackedFieldOptions,
  formatChangedDate,
  type PropertyHistoryEntityType,
} from "@/lib/property-history-format"
import { getPropertyHistory, type PropertyHistoryEntry } from "@/services/property-history"

interface PropertyHistoryPanelProps {
  entityType: PropertyHistoryEntityType
  entityId: string | null
  entityTitle?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PAGE_SIZE = 10

const SOURCE_OPTIONS = [
  { value: "CRM UI", label: "CRM UI" },
]

function DateFilterSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-[110px] text-[12px] border-border">
        <SelectValue placeholder="Date" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All dates</SelectItem>
        <SelectItem value="today">Today</SelectItem>
        <SelectItem value="7d">Last 7 days</SelectItem>
        <SelectItem value="30d">Last 30 days</SelectItem>
        <SelectItem value="90d">Last 90 days</SelectItem>
      </SelectContent>
    </Select>
  )
}

function matchesDateFilter(dateStr: string, filter: string): boolean {
  if (filter === "all") return true
  const date = new Date(dateStr)
  const now = new Date()
  if (isNaN(date.getTime())) return false

  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)

  switch (filter) {
    case "today": return diffDays < 1
    case "7d": return diffDays <= 7
    case "30d": return diffDays <= 30
    case "90d": return diffDays <= 90
    default: return true
  }
}

const ENTITY_LABELS: Record<PropertyHistoryEntityType, string> = {
  task: "task",
  note: "note",
  company: "company",
  deal: "deal",
  product: "product",
  order: "order",
  ticket: "ticket",
  contact: "contact",
}

export function PropertyHistoryPanel({
  entityType,
  entityId,
  entityTitle,
  open,
  onOpenChange,
}: PropertyHistoryPanelProps) {
  const [entries, setEntries] = React.useState<PropertyHistoryEntry[]>([])
  const [search, setSearch] = React.useState("")
  const [propertyFilter, setPropertyFilter] = React.useState("all")
  const [sourceFilter, setSourceFilter] = React.useState("all")
  const [dateFilter, setDateFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)

  const propertyOptions = React.useMemo(() => {
    return getTrackedFieldOptions(entityType)
  }, [entityType])

  React.useEffect(() => {
    let cancelled = false
    if (open && entityId) {
      getPropertyHistory(entityType, entityId).then((data) => {
        if (!cancelled) {
          setEntries(data)
          setPage(1)
          setSearch("")
          setPropertyFilter("all")
          setSourceFilter("all")
          setDateFilter("all")
        }
      })
    }
    return () => {
      cancelled = true
    }
  }, [open, entityType, entityId])

  const filteredEntries = React.useMemo(() => {
    return entries.filter((entry) => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !entry.property_label.toLowerCase().includes(q) &&
          !entry.changed_to_display.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      if (propertyFilter !== "all" && entry.property_key !== propertyFilter) return false
      if (sourceFilter !== "all" && entry.source !== sourceFilter) return false
      if (!matchesDateFilter(entry.changed_at, dateFilter)) return false
      return true
    })
  }, [entries, search, propertyFilter, sourceFilter, dateFilter])

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedEntries = filteredEntries.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const uniquePropertyLabels = React.useMemo(() => {
    return propertyOptions.filter((opt) => entries.some((e) => e.property_key === opt.value))
  }, [entries, propertyOptions])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-[480px] p-0 overflow-hidden gap-0 border-l border-border shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-background shrink-0">
          <div>
            <SheetTitle className="text-[17px] font-bold text-foreground tracking-tight flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Property History
            </SheetTitle>
            <SheetDescription className="text-[13px] text-muted-foreground font-medium mt-0.5">
              {entityTitle
                ? `Changes for "${entityTitle}"`
                : `View all property changes for this ${ENTITY_LABELS[entityType]}.`}
            </SheetDescription>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="h-8 pl-9 pr-8 text-[13px] border-border rounded-full"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="px-5 py-3 flex items-center gap-2 border-b border-border shrink-0">
            <Select value={propertyFilter} onValueChange={(v) => { setPropertyFilter(v); setPage(1) }}>
              <SelectTrigger className="h-8 w-[120px] text-[12px] border-border">
                <SelectValue placeholder="Property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All properties</SelectItem>
                {uniquePropertyLabels.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1) }}>
              <SelectTrigger className="h-8 w-[100px] text-[12px] border-border">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {SOURCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateFilterSelect value={dateFilter} onChange={(v) => { setDateFilter(v); setPage(1) }} />
          </div>

          <div className="flex-1 overflow-y-auto">
            {pagedEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <History className="h-8 w-8 mb-3 opacity-40" />
                <p className="text-[13px] font-medium">No property changes recorded</p>
                <p className="text-[12px] mt-1">
                  {entries.length === 0
                    ? `Changes will appear here as you edit this ${ENTITY_LABELS[entityType]}.`
                    : "No changes match your filters."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider h-9">Property</TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider h-9">Changed To</TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider h-9">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider h-9">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedEntries.map((entry) => (
                    <TableRow key={entry.id} className="group">
                      <TableCell className="py-2.5">
                        <span className="text-[13px] font-medium text-foreground">
                          {entry.property_label}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="text-[13px] text-muted-foreground">
                          {entry.changed_to_display}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="text-[13px] text-muted-foreground">
                          {formatChangedDate(entry.changed_at)}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[12px] text-muted-foreground">{entry.source}</span>
                          <span className="text-[12px] text-muted-foreground">by</span>
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={entry.changed_by_avatar || ""} />
                            <AvatarFallback className="text-[8px] bg-muted">
                              {entry.changed_by[0]?.toUpperCase() || "S"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[12px] text-muted-foreground">{entry.changed_by}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-border shrink-0 flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">
                {filteredEntries.length} {filteredEntries.length === 1 ? "change" : "changes"}
              </span>
              <Pagination>
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      text="Prev"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={safePage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer h-7 text-[12px] px-2"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - safePage) <= 2 || p === 1 || p === totalPages)
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <PaginationItem>
                            <span className="px-1 text-muted-foreground text-[12px]">...</span>
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            isActive={p === safePage}
                            onClick={() => setPage(p)}
                            className="cursor-pointer h-7 w-7 text-[12px]"
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      </React.Fragment>
                    ))}
                  <PaginationItem>
                    <PaginationNext
                      text="Next"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={safePage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer h-7 text-[12px] px-2"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
