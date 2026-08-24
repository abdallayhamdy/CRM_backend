"use client"

import * as React from "react"
import { TrendingUp, DollarSign, Target, CheckCircle2 } from "lucide-react"
import { dashboardService } from "@/services/dashboard"
import { useAuth } from "@/hooks/use-auth"
import { formatCurrency } from "@/lib/utils"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

export function SalesStatsCardsSkeleton() {
  return (
    <LoadingSkeleton
      count={4}
      height="6rem"
      containerClassName="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      className="rounded-xl bg-background border border-border"
    />
  )
}

export function SalesStatsCards() {
  const { workspaceId } = useAuth()
  const [stats, setStats] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const controller = new AbortController()
    async function loadStats() {
      if (!workspaceId) return
      try {
        const { data } = await dashboardService.getOverview(workspaceId)
        if (!controller.signal.aborted) setStats(data)
      } catch (err) {
        if (!controller.signal.aborted) {
          // Expected in standalone mode
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    loadStats()
    return () => controller.abort()
  }, [workspaceId])

  if (loading) {
    return (
      <LoadingSkeleton
        count={4}
        height="6rem"
        containerClassName="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        className="rounded-xl bg-background border border-border"
      />
    )
  }

  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || 0),
      label: "Closed-won deals",
      icon: <DollarSign className="h-5 w-5 text-status-success" />,
      gradient: "from-status-success/5 to-background",
      border: "border-status-success/20"
    },
    {
      title: "Pipeline Value",
      value: formatCurrency(stats?.pipelineValue || 0),
      label: `${stats?.openDeals || 0} open deals`,
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      gradient: "from-primary/5 to-background",
      border: "border-primary/20"
    },
    {
      title: "Conversion Rate",
      value: `${(stats?.conversionRate || 0).toFixed(1)}%`,
      label: "Win probability",
      icon: <Target className="h-5 w-5 text-status-purple" />,
      gradient: "from-status-purple/5 to-background",
      border: "border-status-purple/20"
    },
    {
      title: "Open Tickets",
      value: stats?.openTickets || 0,
      label: "Customer support",
      icon: <CheckCircle2 className="h-5 w-5 text-status-info" />,
      gradient: "from-status-info/5 to-background",
      border: "border-status-info/20"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <Card
          key={i}
          className={`${card.border} shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br ${card.gradient}`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">{card.title}</span>
              <div className="p-2 rounded-lg bg-background shadow-sm border border-border">
                {card.icon}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-foreground tracking-tight">{card.value}</span>
              <span className="text-[12px] text-muted-foreground font-medium mt-1">{card.label}</span>
              <Link href="/reports" className="text-[12px] text-muted-foreground/70 hover:text-primary font-medium mt-2 transition-colors">
                View report →
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
