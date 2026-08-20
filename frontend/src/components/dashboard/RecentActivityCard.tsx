"use client"

import * as React from "react"
import Link from "next/link"
import { Clock, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { activitiesService } from "@/services/activities"
import { formatDistanceToNow } from "date-fns"
import { DataTable } from "@/components/shared/DataTable"
import { getBadgeClasses } from "@/lib/badge-colors"
import type { Activity } from "@/lib/types/crm"
import type { ColumnDef, CellContext } from "@tanstack/react-table"

type ActivityRow = Pick<Activity, "id" | "type" | "title" | "description" | "created_at" | "entity_name">

export function RecentActivityCard() {
  const { workspaceId } = useAuth()
  const [activities, setActivities] = React.useState<ActivityRow[]>([])

  React.useEffect(() => {
    if (!workspaceId) return
    const controller = new AbortController()
    activitiesService.getAll({ workspace_id: workspaceId, limit: 10 }).then(({ data }) => {
      if (!controller.signal.aborted && data) {
        setActivities(data.map(a => ({
          id: a.id,
          type: a.type,
          title: a.title,
          description: a.description,
          created_at: a.created_at,
          entity_name: a.entity_name,
        })))
      }
    }).catch(() => {})
    return () => controller.abort()
  }, [workspaceId])

  const columns: ColumnDef<ActivityRow, any>[] = React.useMemo(() => [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: CellContext<ActivityRow, any>) => (
        <Badge variant="outline" className={`text-[11px] px-1.5 py-0 capitalize ${getBadgeClasses('activity_type', row.original.type, 'bordered')}`}>
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "title",
      header: "Activity",
      cell: ({ row }: CellContext<ActivityRow, any>) => (
        <span className="text-foreground text-[13px] font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "entity_name",
      header: "Lead",
      cell: ({ row }: CellContext<ActivityRow, any>) => (
        <span className="text-muted-foreground text-[13px]">{row.original.entity_name || "--"}</span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Time",
      cell: ({ row }: CellContext<ActivityRow, any>) => (
        <span className="text-muted-foreground text-[13px]">
          {formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true })}
        </span>
      ),
    },
  ], [])

  return (
    <Card className="border border-border shadow-sm flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-[16px] font-bold text-foreground flex items-center gap-2">
          <Clock className="h-[16px] w-[16px] text-muted-foreground" />
          Recent activity
          <Badge variant="outline" className="text-[11px] px-1.5 py-0 text-muted-foreground border-border">
            {activities.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto max-h-[350px]">
          <DataTable
            columns={columns}
            data={activities}
            pagination={false}
            emptyTitle="No recent activity"
            emptyDescription="There is no recent activity to show right now."
          />
        </div>

        <div className="text-center mt-4">
          <Link
            href="/activity-feed"
            className="text-[13px] font-bold text-primary hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            See all recent activity <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
