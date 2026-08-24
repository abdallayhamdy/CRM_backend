"use client"

import Link from "next/link"
import * as React from "react"
import { activitiesService } from "@/services/activities"
import { authService } from "@/services/auth"
import { useAuth } from "@/hooks/use-auth"
import { Activity, ActivityType } from "@/lib/types/crm"
import { isChangeDescription, parseChanges, formatRelativeTime } from "@/lib/activity-formatters"
import { Search, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, RefreshCw } from "lucide-react"
import { useRealtime } from "@/hooks/use-realtime"
import { cn } from "@/lib/utils"
import { getBadgeClasses } from "@/lib/badge-colors"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CrmDataTable } from "@/components/crm/CrmDataTable"
import type { ColumnDef, CellContext } from "@tanstack/react-table"

const ACTIVITY_TYPES = [
  { value: "all", label: "All activity types" },
  { value: "email", label: "Emails" },
  { value: "call", label: "Calls" },
  { value: "meeting", label: "Meetings" },
  { value: "task", label: "Tasks" },
  { value: "note", label: "Notes" },
  { value: "system", label: "System" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "deleted", label: "Deleted" },
]

export default function ActivityFeedPage() {
  const [search, setSearch] = React.useState("")
  const [activities, setActivities] = React.useState<Activity[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)
  const [perPage] = React.useState(25)
  const { workspaceId } = useAuth()
  const [nameMap, setNameMap] = React.useState<Record<string, string>>({})

  const totalPages = Math.ceil(totalCount / perPage)
  const from = (currentPage - 1) * perPage
  const to = from + perPage - 1

  const fetchActivities = React.useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const { data, error, meta } = await activitiesService.getAll({
        workspace_id: workspaceId,
        search: search || undefined,
        type: typeFilter === "all" ? undefined : (typeFilter as ActivityType),
        limit: perPage,
        page: currentPage,
      })
      if (error) throw error
      setActivities(data || [])
      setTotalCount(meta?.total ?? 0)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load activities"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, search, typeFilter, currentPage, perPage])

  React.useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  React.useEffect(() => {
    setCurrentPage(1)
  }, [search, typeFilter])

  React.useEffect(() => {
    if (!workspaceId) return
    authService.listProfiles(workspaceId).then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {}
        for (const p of data) {
          const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim()
          if (name) map[p.id] = name
        }
        setNameMap(map)
      }
    })
  }, [workspaceId])

  useRealtime(async () => {
    if (!workspaceId) return
    try {
      const { data, error } = await activitiesService.getAll({
        workspace_id: workspaceId,
        search: search || undefined,
        type: typeFilter === "all" ? undefined : (typeFilter as ActivityType),
        limit: perPage,
        page: currentPage,
      })
      if (!error && data) {
        setActivities(data)
      }
    } catch (err) {
      console.error("[activity-feed] Failed to poll activities:", err)
    }
  }, ["activity_comments"], workspaceId, { intervalMs: 5000 })

  const columns: ColumnDef<Activity, any>[] = React.useMemo(() => [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: CellContext<Activity, any>) => {
        const type = row.original.type
        return (
          <Badge variant="outline" className={cn("text-[11px] px-1.5 py-0 capitalize", getBadgeClasses("activity_type", type as string, "bordered"))}>
            {type}
          </Badge>
        )
      },
    },
    {
      id: "owner",
      header: "Owner",
      cell: ({ row }: CellContext<Activity, any>) => {
        const ownerId = row.original.owner_id
        const name = (ownerId && nameMap[ownerId]) || "System"
        return <span className="text-foreground text-[13px] font-medium">{name}</span>
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }: CellContext<Activity, any>) => (
        <span className="text-foreground text-[13px] font-bold">
          {row.original.title || row.original.entity_name || "—"}
        </span>
      ),
    },
    {
      id: "description",
      header: "Description",
      cell: ({ row }: CellContext<Activity, any>) => {
        const a = row.original
        const raw = a.formatted_description || a.description || ""
        if (!raw) {
          return <span className="text-muted-foreground text-[13px]">—</span>
        }
        if (isChangeDescription(raw)) {
          const changes = parseChanges(raw, nameMap)
          if (changes.length > 0) {
            const summary = changes
              .slice(0, 2)
              .map((c) => `${c.fieldLabel}: ${c.oldValue} → ${c.newValue}`)
              .join(" · ")
            const extra = changes.length > 2 ? ` (+${changes.length - 2} more)` : ""
            return (
              <span
                title={`${summary}${extra}`}
                className="text-muted-foreground text-[13px] max-w-[300px] truncate block"
              >
                {summary}{extra}
              </span>
            )
          }
          return (
            <span className="text-muted-foreground text-[13px] max-w-[300px] truncate block">
              Record updated
            </span>
          )
        }
        return (
          <span
            title={raw}
            className="text-muted-foreground text-[13px] max-w-[300px] truncate block"
          >
            {raw}
          </span>
        )
      },
    },
    {
      id: "related",
      header: "Related To",
      cell: ({ row }: CellContext<Activity, any>) => {
        const a = row.original
        if (a.entity_name && a.entity_route) {
          return (
            <Link href={a.entity_route} className="text-primary text-[13px] font-bold hover:underline inline-flex items-center gap-1">
              {a.entity_name}
              <ExternalLink className="w-3 h-3" />
            </Link>
          )
        }
        return <span className="text-muted-foreground text-[13px]">—</span>
      },
    },
    {
      id: "time",
      header: "Time",
      cell: ({ row }: CellContext<Activity, any>) => (
        <span className="text-muted-foreground text-[13px]">
          {formatRelativeTime(row.original.activity_date ?? row.original.created_at)}
        </span>
      ),
    },
  ], [nameMap])

  return (
    <div className="h-full bg-muted/50 flex flex-col overflow-y-auto">
      {/* Top Header - Fixed */}
      <div className="bg-background border-b border-border px-8 py-4 flex items-center justify-between shrink-0 z-20 shadow-sm">
        <h1 className="text-[20px] font-bold text-foreground">Activity Feed</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-9 border-border text-muted-foreground font-bold" onClick={fetchActivities}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Search and Filters */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-background shrink-0">
          <div className="relative flex-1 max-w-[500px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search by title, description or owner..."
              aria-label="Search activity feed"
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-[14px] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <span>Activity type:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 font-bold text-foreground hover:text-primary transition-colors border border-border px-3 py-2 rounded-lg bg-background">
                  {ACTIVITY_TYPES.find(t => t.value === typeFilter)?.label} <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {ACTIVITY_TYPES.map((type) => (
                  <DropdownMenuItem
                    key={type.value}
                    onClick={() => setTypeFilter(type.value)}
                    className={cn(typeFilter === type.value && "bg-muted/50 font-bold")}
                  >
                    {type.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Activity Table */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-24 ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <CrmDataTable
                columns={columns}
                data={activities}
                entityName="activity"
                hidePreviewActions
              />

              {!isLoading && totalCount > perPage && (
                <div className="flex items-center justify-between gap-4 py-4 px-6 border-t border-border bg-background">
                  <span className="text-[13px] text-muted-foreground">
                    {totalCount === 0 ? 0 : from + 1}–{Math.min(to + 1, totalCount)} of {totalCount} activities
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </Button>
                    <span className="text-[13px] text-muted-foreground">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages || isLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
