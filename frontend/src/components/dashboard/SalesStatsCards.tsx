"use client"

import * as React from "react"
import { DollarSign, Handshake, TicketCheck, CheckSquare } from "lucide-react"
import { reportsService } from "@/services/reports"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { ReportsKpiCard } from "@/app/reports/reports-kpi-card"
import { Button } from "@/components/ui/button"

const iconMap: Record<string, React.ElementType> = {
  DollarSign,
  Handshake,
  TicketCheck,
  CheckSquare,
}

export function SalesStatsCardsSkeleton() {
  return (
    <LoadingSkeleton
      count={4}
      height="7rem"
      containerClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      className="rounded-xl bg-background border border-border"
    />
  )
}

export function SalesStatsCards() {
  const [kpis, setKpis] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()
    async function loadKpis() {
      setError(null)
      try {
        const { data, error: fetchError } = await reportsService.getExecutive("this_month")
        if (controller.signal.aborted) return
        if (fetchError) throw new Error(fetchError.message)
        setKpis(data?.kpis ?? [])
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load KPIs')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    loadKpis()
    return () => controller.abort()
  }, [])

  if (loading) {
    return (
      <LoadingSkeleton
        count={4}
        height="7rem"
        containerClassName="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        className="rounded-xl bg-background border border-border"
      />
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 mb-8 border border-destructive/20 rounded-xl bg-destructive/5">
        <p className="text-[13px] text-destructive mb-3">{error}</p>
        <Button variant="outline" size="sm" onClick={() => { setError(null); setLoading(true) }}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {kpis.map((kpi: any) => {
        const Icon = iconMap[kpi.icon] || DollarSign
        return (
          <ReportsKpiCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.formatted ?? kpi.value}
            trend={kpi.trend ?? ""}
            trendUp={kpi.trendUp}
            icon={Icon}
          />
        )
      })}
    </div>
  )
}
