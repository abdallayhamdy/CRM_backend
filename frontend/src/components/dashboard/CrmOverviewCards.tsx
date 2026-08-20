"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Users, Handshake, CheckSquare, Headset, Maximize2, Minimize2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { dashboardService } from "@/services/dashboard"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { DEAL_STAGE_OPTIONS, LEAD_STATUS_OPTIONS } from "@/lib/crm-constants"
import { TICKET_STATUSES } from "@/lib/types/crm"
import { toast } from "sonner"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function CrmOverviewCardsSkeleton() {
  return (
    <LoadingSkeleton
      count={4}
      height="10rem"
      containerClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      className="rounded-xl bg-background border border-border"
    />
  )
}

export function CrmOverviewCards() {
  const { workspaceId } = useAuth()
  const [counts, setCounts] = React.useState({
    contacts: 0,
    companies: 0,
    deals: 0,
    tasks: 0,
    tickets: 0,
    duplicatedNumbers: 0,
  })
  const [dealStages, setDealStages] = React.useState<Record<string, number>>({})
  const [leadStatuses, setLeadStatuses] = React.useState<Record<string, number>>({})
  const [taskTypes, setTaskTypes] = React.useState<Record<string, number>>({})
  const [ticketStages, setTicketStages] = React.useState<Record<string, number>>({})
  const [ticketPriorities, setTicketPriorities] = React.useState<Record<string, number>>({})
  const [loading, setLoading] = React.useState(true)
  const [allExpanded, setAllExpanded] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const pathname = usePathname()

  React.useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1)
    document.addEventListener("visibilitychange", handler)
    return () => document.removeEventListener("visibilitychange", handler)
  }, [])

  React.useEffect(() => {
    if (!workspaceId) return

    const controller = new AbortController()
    const signal = controller.signal

    async function loadCounts() {
      try {
        const { data, error } = await dashboardService.getOverview(workspaceId!)

        if (signal.aborted) return
        if (error || !data) {
          toast.error("Failed to load overview data")
          return
        }

        setCounts({
          contacts: data.contacts?.total ?? 0,
          companies: data.contacts?.companies ?? 0,
          deals: data.deals?.total ?? 0,
          tasks: data.tasks?.total ?? 0,
          tickets: data.tickets?.total ?? 0,
          duplicatedNumbers: data.contacts?.duplicatedPhones ?? 0,
        })

        setDealStages(data.deals?.stages ?? {})
        setLeadStatuses(data.contacts?.leadStatuses ?? {})
        setTaskTypes(data.tasks?.statuses ?? {})
        setTicketStages(data.tickets?.statuses ?? {})
        setTicketPriorities(data.tickets?.priorities ?? {})
      } catch {
        if (!signal.aborted) toast.error("Failed to load overview data")
      } finally {
        if (!signal.aborted) setLoading(false)
      }
    }

    loadCounts()
    return () => controller.abort()
  }, [workspaceId, pathname, refreshKey])

  if (loading) {
    return <CrmOverviewCardsSkeleton />
  }

  const totalContactsCompanies = counts.contacts + counts.companies
  const totalDeals = counts.deals
  const contentClass = cn(
    "flex flex-col gap-1.5 overflow-hidden transition-all duration-300",
    allExpanded ? "max-h-[600px]" : "max-h-[120px]"
  )

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/contacts">
          <Card className="border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 bg-card cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-status-warning" />
                  <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">Contacts & Companies</span>
                </div>
                <span className="text-xl font-black text-foreground">{totalContactsCompanies}</span>
              </div>
              <div className={contentClass}>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-muted-foreground font-medium">Contacts</span>
                  <span className="text-[13px] font-bold text-foreground">{counts.contacts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-muted-foreground font-medium">Companies</span>
                  <span className="text-[13px] font-bold text-foreground">{counts.companies}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-muted-foreground font-medium">Duplicated Numbers</span>
                  <span className="text-[13px] font-bold text-foreground">{counts.duplicatedNumbers}</span>
                </div>
                <div className="border-t border-border/50 my-1" />
                {LEAD_STATUS_OPTIONS.slice(0, allExpanded ? undefined : 8).map((status) => (
                  <div key={status.value} className="flex justify-between items-center">
                    <span className="text-[12px] text-muted-foreground font-medium">{status.label}</span>
                    <span className="text-[13px] font-bold text-foreground">{leadStatuses[status.value] || 0}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/deals">
          <Card className="border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 bg-card cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Handshake className="h-4 w-4 text-status-success" />
                  <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">Deals Pipeline</span>
                </div>
                <span className="text-xl font-black text-foreground">{totalDeals}</span>
              </div>
              <div className={contentClass}>
                {DEAL_STAGE_OPTIONS.map((stage) => (
                  <div key={stage.value} className="flex justify-between items-center">
                    <span className="text-[12px] text-muted-foreground font-medium">{stage.label}</span>
                    <span className="text-[13px] font-bold text-foreground">{dealStages[stage.value] || 0}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tasks">
          <Card className="border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 bg-card cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">Tasks</span>
                </div>
                <span className="text-xl font-black text-foreground">{counts.tasks}</span>
              </div>
              <div className={contentClass}>
                {[
                  { value: "pending", label: "Pending" },
                  { value: "completed", label: "Completed" },
                ].map((t) => (
                  <div key={t.value} className="flex justify-between items-center">
                    <span className="text-[12px] text-muted-foreground font-medium">{t.label}</span>
                    <span className="text-[13px] font-bold text-foreground">{taskTypes[t.value] || 0}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tickets">
          <Card className="border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 bg-card cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Headset className="h-4 w-4 text-status-purple" />
                  <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">Tickets</span>
                </div>
                <span className="text-xl font-black text-foreground">{counts.tickets}</span>
              </div>
              <div className={contentClass}>
                {TICKET_STATUSES.map((status) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-[12px] text-muted-foreground font-medium capitalize">{status}</span>
                    <span className="text-[13px] font-bold text-foreground">{ticketStages[status] || 0}</span>
                  </div>
                ))}
                <div className="border-t border-border/50 my-1" />
                {["low", "medium", "high", "urgent"].map((p) => (
                  <div key={p} className="flex justify-between items-center">
                    <span className="text-[12px] text-muted-foreground font-medium capitalize">{p}</span>
                    <span className="text-[13px] font-bold text-foreground">{ticketPriorities[p] || 0}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Call Outcomes card hidden — no API endpoint available yet */}
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setAllExpanded(prev => !prev)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
        >
          {allExpanded ? (
            <>
              <Minimize2 className="h-4 w-4" />
              <span>Collapse all</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4" />
              <span>Expand all</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
