"use client"

import Link from "next/link"
import * as React from "react"
import { activitiesService } from "@/services/activities"
import { authService } from "@/services/auth"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { Activity, ActivityType } from "@/lib/types/crm"
import {
  isChangeDescription,
  parseChanges,
  getActionVerb,
  formatRelativeTime,
  groupActivitiesByDate,
  ChangeDetail,
} from "@/lib/activity-formatters"
import {
  Search,
  ChevronDown,
  Mail,
  User,
  Phone,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Zap,
  Bell,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  RefreshCw,
  Loader2,
  Trash2,
} from "lucide-react"
import { useRealtime } from "@/hooks/use-realtime"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

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
  const { canDeleteActivity } = usePermissions()
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

  const groupedActivities = React.useMemo(() => {
    return groupActivitiesByDate(activities)
  }, [activities])

  const handleDelete = React.useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this activity?")) return
    try {
      const { error } = await activitiesService.delete(id, workspaceId!)
      if (error) throw error
      toast.success("Activity deleted")
      fetchActivities()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete activity")
    }
  }, [workspaceId, fetchActivities])

  return (
    <div className="h-full bg-muted/50 flex flex-col overflow-y-auto">
      <div className="bg-background border-b border-border px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-2 shrink-0 z-20 shadow-sm">
        <h1 className="text-[20px] font-bold text-foreground">Activity Feed</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-9 border-border text-muted-foreground font-bold" onClick={fetchActivities}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
        <div className="max-w-[1000px] mx-auto pt-8 px-4 sm:px-6 pb-20">
          <div className="flex flex-col gap-4 mb-8">
            <div className="relative max-w-[600px] mx-auto w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Search by title, description or owner..."
                aria-label="Search activity feed"
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-full text-[14px] shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-center gap-4 text-[13px] font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Activity type:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 font-bold text-foreground hover:text-primary transition-colors">
                      {ACTIVITY_TYPES.find((t) => t.value === typeFilter)?.label}{" "}
                      <ChevronDown className="w-4 h-4" />
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
          </div>

          <div className="space-y-10">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 w-full bg-background border border-border rounded-xl animate-pulse" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-24 bg-background border border-border rounded-xl shadow-sm">
                <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                  <Zap className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">No activities found</h3>
                <p className="text-muted-foreground text-sm max-w-[300px] mx-auto">
                  Try adjusting your search or filters to see more results.
                </p>
              </div>
            ) : (
              groupedActivities.map(({ label, items }) => (
                <section key={label} className="space-y-3">
                  <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-3">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="whitespace-nowrap">{label}</span>
                    <div className="h-px flex-1 bg-border/50" />
                  </h2>
                  <div className="space-y-3">
                    {items.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        onDelete={handleDelete}
                        canDelete={canDeleteActivity}
                        nameMap={nameMap}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>

          {!isLoading && totalCount > perPage && (
            <div className="flex items-center justify-between gap-4 py-6 mt-8 border-t border-border">
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
        </div>
      </div>
    </div>
  )
}

function ActivityCard({
  activity,
  onDelete,
  canDelete,
  nameMap,
}: {
  activity: Activity
  onDelete: (id: string) => void
  canDelete: boolean
  nameMap?: Record<string, string>
}) {
  const ownerName = activity.owner
    ? `${activity.owner.first_name} ${activity.owner.last_name || ""}`
    : "System"

  const isUpdate = (activity.type as string) === "updated" && isChangeDescription(activity.description)
  const isCreate = (activity.type as string) === "created"
  const isDelete = (activity.type as string) === "deleted"
  const changes = isUpdate ? parseChanges(activity.description || "", nameMap) : []

  const getIcon = () => {
    switch (activity.type as string) {
      case "email":
        return <Mail className="w-4 h-4" />
      case "note":
        return <FileText className="w-4 h-4" />
      case "task":
        return <CheckCircle2 className="w-4 h-4" />
      case "call":
        return <Phone className="w-4 h-4" />
      case "meeting":
        return <Calendar className="w-4 h-4" />
      case "system":
        return <Bell className="w-4 h-4" />
      case "created":
        return <Plus className="w-4 h-4" />
      case "updated":
        return <RefreshCw className="w-4 h-4" />
      case "deleted":
        return <Trash2 className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  const getColors = () => {
    switch (activity.type as string) {
      case "email":
        return "text-primary bg-primary/10 border-primary/20"
      case "note":
        return "text-status-warning bg-status-warning/10 border-status-warning/20"
      case "task":
        return "text-status-purple bg-status-purple/10 border-status-purple/20"
      case "call":
        return "text-status-success bg-status-success/10 border-status-success/20"
      case "meeting":
        return "text-status-purple bg-status-purple/10 border-status-purple/20"
      case "system":
        return "text-muted-foreground bg-muted border-border"
      case "created":
        return "text-status-success bg-status-success/10 border-status-success/20"
      case "updated":
        return "text-primary bg-primary/10 border-primary/20"
      case "deleted":
        return "text-status-danger bg-status-danger/10 border-status-danger/20"
      default:
        return "text-muted-foreground bg-muted border-border"
    }
  }

  const getBorderColor = () => {
    switch (activity.type as string) {
      case "email":
        return "border-l-primary"
      case "note":
        return "border-l-status-warning"
      case "task":
        return "border-l-status-purple"
      case "call":
        return "border-l-status-success"
      case "meeting":
        return "border-l-status-purple"
      case "system":
        return "border-l-muted-foreground"
      case "created":
        return "border-l-status-success"
      case "updated":
        return "border-l-primary"
      case "deleted":
        return "border-l-status-danger"
      default:
        return "border-l-border"
    }
  }

  return (
    <div
      className={cn(
        "bg-background border border-border rounded-xl shadow-sm hover:shadow-md transition-all group overflow-hidden border-l-[3px]",
        getBorderColor()
      )}
    >
      <div className="p-4 flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center border",
              getColors()
            )}
          >
            {getIcon()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="text-[14px] leading-relaxed">
              <span className="font-bold text-foreground">{ownerName}</span>
              <span className="text-muted-foreground"> </span>
              <span className="text-muted-foreground">
                {getActionVerb(activity.type, activity.entity_name)}
              </span>
              {activity.entity_name && activity.entity_route && (
                <Link
                  href={activity.entity_route}
                  className="ml-1.5 inline-flex items-center gap-1 text-primary font-bold hover:underline"
                >
                  &quot;{activity.entity_name}&quot;
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              )}
            </div>

            {canDelete && (
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(activity.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>

          {isUpdate && changes.length > 0 && (
            <div className="mt-2 space-y-1">
              {changes.map((change) => (
                <ChangeRow key={change.field} change={change} />
              ))}
            </div>
          )}

          {!isUpdate && activity.description && !isChangeDescription(activity.description) && (
            <div className="text-[13px] text-muted-foreground mt-1.5 line-clamp-2">
              {activity.description}
            </div>
          )}

          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground/60 font-medium">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(activity.activity_date ?? activity.created_at)}
            </div>

            <span
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-tight",
                getColors()
              )}
            >
              {activity.type}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChangeRow({ change }: { change: ChangeDetail }) {
  return (
    <div className="flex items-center gap-2 text-[13px] py-1 px-2.5 rounded-md bg-muted/50">
      <span className="font-bold text-foreground whitespace-nowrap">{change.fieldLabel}:</span>
      <span className="text-muted-foreground line-through decoration-status-danger/50">{change.oldValue}</span>
      <span className="text-muted-foreground">→</span>
      <span className="font-medium text-foreground">{change.newValue}</span>
    </div>
  )
}
