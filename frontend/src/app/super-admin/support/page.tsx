"use client"

import * as React from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { HeadphonesIcon, Send, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getSaBadgeClassName } from "@/lib/badge-colors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReportsKpiCard } from "@/app/reports/reports-kpi-card"
import { ReportsChartCard } from "@/app/reports/reports-chart-card"
import { DataTable } from "@/components/shared/DataTable"
import { superAdminService, type SupportTicket, type TicketStatus, type TicketPriority, type BroadcastMessage, type BroadcastAudience } from "@/services/super-admin"

// --- Badge styles ----------------------------------------------------

const PRIORITY_BADGE: Record<TicketPriority, { className: string }> = {
  Low: {
    className: getSaBadgeClassName('sa:support_priority', 'low'),
  },
  Medium: {
    className: getSaBadgeClassName('sa:support_priority', 'medium'),
  },
  High: {
    className: getSaBadgeClassName('sa:support_priority', 'high'),
  },
  Urgent: {
    className: getSaBadgeClassName('sa:support_priority', 'urgent'),
  },
}

const AUDIENCE_BADGE: Record<BroadcastAudience, { className: string }> = {
  "All Tenants": {
    className: getSaBadgeClassName('sa:broadcast_audience', 'all tenants'),
  },
  "Active Only": {
    className: getSaBadgeClassName('sa:broadcast_audience', 'active only'),
  },
  "Trial Only": {
    className: getSaBadgeClassName('sa:broadcast_audience', 'trial only'),
  },
}

// --- Ticket columns --------------------------------------------------

function buildTicketColumns(
  statusFilter: string,
  setStatusFilter: (v: string) => void,
  priorityFilter: string,
  setPriorityFilter: (v: string) => void,
  onStatusChange: (id: string, status: TicketStatus) => void
): ColumnDef<SupportTicket, unknown>[] {
  return [
    {
      accessorKey: "tenant_name",
      header: "Tenant",
      cell: ({ row }) => (
        <Link
          href={`/super-admin/tenants/${row.original.tenant_id}`}
          className="text-primary hover:underline font-medium text-[13px]"
        >
          {row.original.tenant_name ?? "—"}
        </Link>
      ),
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => (
        <span className="text-[13px] text-foreground max-w-[260px] truncate block">
          {row.original.subject}
        </span>
      ),
    },
    {
      accessorKey: "priority",
      header: () => (
        <div className="flex items-center gap-2">
          <span>Priority</span>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger
              className="h-7 w-[100px] text-[11px] border-0 bg-transparent p-0 hover:bg-transparent focus:ring-0"
              onClick={(e) => e.stopPropagation()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
      cell: ({ row }) => {
        const config = PRIORITY_BADGE[row.original.priority]
        return (
          <Badge variant="outline" className={config.className}>
            {row.original.priority}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: () => (
        <div className="flex items-center gap-2">
          <span>Status</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="h-7 w-[110px] text-[11px] border-0 bg-transparent p-0 hover:bg-transparent focus:ring-0"
              onClick={(e) => e.stopPropagation()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
      cell: ({ row }) => {
        const ticket = row.original
        return (
          <Select
            value={ticket.status}
            onValueChange={(v) => onStatusChange(ticket.id, v as TicketStatus)}
          >
            <SelectTrigger
              className="h-7 w-[120px] text-[12px] border-border bg-background"
              onClick={(e) => e.stopPropagation()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        )
      },
    },
    {
      accessorKey: "assigned_to",
      header: "Assigned To",
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground">
          {row.original.assigned_to ?? "Unassigned"}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground whitespace-nowrap">
          {new Date(row.original.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
  ]
}

// --- Page component --------------------------------------------------

export default function SupportPage() {
  const [allTickets, setAllTickets] = React.useState<SupportTicket[]>([])
  const [broadcasts, setBroadcasts] = React.useState<BroadcastMessage[]>([])
  const [loading, setLoading] = React.useState(true)

  const [statusFilter, setStatusFilter] = React.useState("all")
  const [priorityFilter, setPriorityFilter] = React.useState("all")
  const [refreshKey, setRefreshKey] = React.useState(0)

  // Broadcast dialog state
  const [broadcastOpen, setBroadcastOpen] = React.useState(false)
  const [bcTitle, setBcTitle] = React.useState("")
  const [bcMessage, setBcMessage] = React.useState("")
  const [bcAudience, setBcAudience] = React.useState<BroadcastAudience>("All Tenants")

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      const [t, b] = await Promise.all([
        superAdminService.getSupportTickets(),
        superAdminService.getBroadcasts(),
      ])
      if (cancelled) return
      if (t.data) setAllTickets(t.data)
      if (b.data) setBroadcasts(b.data)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [refreshKey])

  const filteredTickets = React.useMemo(() => {
    return allTickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false
      return true
    })
  }, [allTickets, statusFilter, priorityFilter])

  const columns = React.useMemo(
    () =>
      buildTicketColumns(
        statusFilter,
        setStatusFilter,
        priorityFilter,
        setPriorityFilter,
        async (id, status) => {
          const r = await superAdminService.updateTicketStatus(id, status)
          if (r.error) {
            toast.error(r.error.message)
            return
          }
          setRefreshKey((k) => k + 1)
          toast.success("Ticket status updated")
        }
      ),
    [statusFilter, priorityFilter]
  )

  const openCount = allTickets.filter((t) => t.status === "Open").length
  const urgentCount = allTickets.filter((t) => t.priority === "Urgent" && t.status !== "Closed" && t.status !== "Resolved").length

  const handleBroadcast = async () => {
    if (!bcTitle.trim() || !bcMessage.trim()) {
      toast.error("Please fill in all fields")
      return
    }
    const r = await superAdminService.createBroadcast({
      title: bcTitle.trim(),
      message: bcMessage.trim(),
      audience: bcAudience,
    })
    if (r.error) {
      toast.error(r.error.message)
      return
    }
    const created = r.data
    if (created) setBroadcasts((prev) => [created, ...prev])
    setBcTitle("")
    setBcMessage("")
    setBcAudience("All Tenants")
    setBroadcastOpen(false)
    toast.success("Broadcast sent")
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-[15px] font-semibold text-foreground">
            Support
          </h1>
          <p className="text-xs text-muted-foreground">
            Ticket management and tenant broadcasts
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto crm-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
        <div className="p-6 space-y-6">
          {/* Support Tickets KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportsKpiCard
              title="Open Tickets"
              value={String(openCount)}
              trend="Awaiting response"
              trendUp={openCount < 5}
              icon={HeadphonesIcon}
            />
            <ReportsKpiCard
              title="Urgent Tickets"
              value={String(urgentCount)}
              trend={
                urgentCount > 0
                  ? `${urgentCount} need immediate attention`
                  : "No urgent issues"
              }
              trendUp={urgentCount === 0}
              icon={HeadphonesIcon}
            />
          </div>

          {/* Tickets Table */}
          <ReportsChartCard title="Support Tickets">
            <DataTable
              columns={columns}
              data={filteredTickets}
              searchKey="subject"
              emptyTitle="No tickets found"
              emptyDescription="No tickets match your current filters."
            />
          </ReportsChartCard>

          {/* Broadcast Messages */}
          <ReportsChartCard
            title="Broadcast Messages"
            action={
              <Button
                size="sm"
                className="h-8 px-3 text-[12px] font-bold gap-1.5"
                onClick={() => setBroadcastOpen(true)}
              >
                <Send className="h-3.5 w-3.5" />
                New Broadcast
              </Button>
            }
          >
            <div className="space-y-0">
              {broadcasts.map((b) => (
                <div
                  key={b.id}
                  className="py-4 border-b border-border last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-foreground">
                        {b.title}
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">
                        {b.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={AUDIENCE_BADGE[b.audience].className}>
                        {b.audience}
                      </Badge>
                      <span className="text-[12px] text-muted-foreground whitespace-nowrap">
                        {b.recipient_count} recipients
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span>
                      Sent {new Date(b.sent_at ?? "").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span>by {b.sent_by}</span>
                  </div>
                </div>
              ))}
            </div>
          </ReportsChartCard>
        </div>
        )}
      </div>

      {/* New Broadcast Dialog */}
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Broadcast Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-foreground">
                Title
              </Label>
              <Input
                value={bcTitle}
                onChange={(e) => setBcTitle(e.target.value)}
                placeholder="e.g. Scheduled maintenance notice"
                className="h-9 text-[13px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-foreground">
                Message
              </Label>
              <Textarea
                value={bcMessage}
                onChange={(e) => setBcMessage(e.target.value)}
                placeholder="Write your broadcast message..."
                rows={4}
                className="text-[13px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-foreground">
                Audience
              </Label>
              <Select value={bcAudience} onValueChange={(v) => setBcAudience(v as BroadcastAudience)}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Tenants">All Tenants</SelectItem>
                  <SelectItem value="Active Only">Active Only</SelectItem>
                  <SelectItem value="Trial Only">Trial Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px] font-bold"
              onClick={() => setBroadcastOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-[12px] font-bold"
              onClick={handleBroadcast}
            >
              Send Broadcast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
