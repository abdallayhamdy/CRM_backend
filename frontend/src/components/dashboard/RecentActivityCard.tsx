"use client"

import * as React from "react"
import { Clock, Loader2, AlertCircle, ExternalLink } from "lucide-react"
import Link from "next/link"

import { dashboardService } from "@/services/dashboard"
import { useAuth } from "@/hooks/use-auth"
import { formatDistanceToNow } from "date-fns"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

interface ActivityOwner {
  id: string
  first_name: string
  last_name: string
}

interface ActivityItem {
  id: string
  type: string
  title: string
  description: string | null
  entity_type: string | null
  entity_name: string | null
  entity_route: string | null
  owner: ActivityOwner | null
  activity_date: string | null
  created_at: string
}

const actionLabels: Record<string, { label: string; color: string }> = {
  email: { label: "sent an email", color: "text-primary" },
  call: { label: "logged a call", color: "text-status-success" },
  note: { label: "added a note", color: "text-status-warning" },
  task: { label: "updated a task", color: "text-status-purple" },
  meeting: { label: "scheduled a meeting", color: "text-status-purple" },
  system: { label: "system activity", color: "text-muted-foreground" },
}

const entityIcons: Record<string, string> = {
  contact: "👤",
  company: "🏢",
  deal: "💼",
  task: "✅",
  ticket: "🎫",
  order: "📦",
  product: "📋",
  note: "📝",
  document: "📄",
}

function ActivityCard({ item }: { item: ActivityItem }) {
  const actionStyle = actionLabels[item.type] ?? { label: item.type, color: "text-muted-foreground" }
  const icon = entityIcons[item.entity_type ?? ''] ?? '📌'
  const date = item.activity_date ?? item.created_at
  const ownerName = item.owner
    ? [item.owner.first_name, item.owner.last_name].filter(Boolean).join(' ')
    : 'Someone'

  const content = (
    <Card className="border-border hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[13px] font-medium text-muted-foreground">{ownerName}</span>
          <span className={`text-[12px] font-bold ${actionStyle.color}`}>{actionStyle.label}</span>
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm">{icon}</span>
          <span className="text-[15px] font-bold text-foreground truncate">
            {item.entity_name ?? item.title}
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground/60 mt-auto pt-2">
          {date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : ''}
        </p>
      </CardContent>
    </Card>
  )

  if (item.entity_route) {
    return (
      <Link href={item.entity_route} className="block">
        {content}
      </Link>
    )
  }

  return content
}

export function RecentActivityCard() {
  const { workspaceId } = useAuth()
  const [activities, setActivities] = React.useState<ActivityItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchActivities = React.useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await dashboardService.getRecentActivity(workspaceId)
      if (fetchError) throw new Error(fetchError.message)
      setActivities(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  React.useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-[16px] w-[16px] text-muted-foreground" />
          <h2 className="text-[16px] font-bold text-foreground">Recent activity</h2>
        </div>
        <LoadingSkeleton
          count={4}
          height="8rem"
          containerClassName="grid grid-cols-4 gap-3"
          className="rounded-lg bg-background border border-border"
        />
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-[16px] w-[16px] text-muted-foreground" />
        <h2 className="text-[16px] font-bold text-foreground">Recent activity</h2>
      </div>

      {error ? (
        <Card className="border-destructive/20">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-[13px] text-destructive text-center">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchActivities}>Try again</Button>
          </CardContent>
        </Card>
      ) : activities.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-0">
            <EmptyState
              title="No recent activity"
              description="Activity from your contacts, deals, tasks and other records will appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-1">
            {activities.map((item) => (
              <ActivityCard key={item.id} item={item} />
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="text-center mt-4">
        <Link
          href="/activity-feed"
          className="text-[13px] font-bold text-primary hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          See all recent activity <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}