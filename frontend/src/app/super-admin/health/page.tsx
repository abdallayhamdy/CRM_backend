"use client"

import * as React from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Activity, Clock, AlertTriangle, Server, Loader2 } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltipContent, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReportsKpiCard } from "@/app/reports/reports-kpi-card"
import { ReportsChartCard } from "@/app/reports/reports-chart-card"
import { DataTable } from "@/components/shared/DataTable"
import { superAdminService, type HealthSummary, type UptimeDay, type HourlyResponse, type ErrorLog, type JobQueue } from "@/services/super-admin"

const uptimeConfig = { uptime: { label: "Uptime %", color: "var(--color-chart-1)" } } satisfies ChartConfig
const responseConfig = { avg_ms: { label: "Avg Response (ms)", color: "var(--color-chart-2)" } } satisfies ChartConfig

type LogLevel = ErrorLog["level"]
type QueueStatus = JobQueue["status"]

const LOG_LEVEL_BADGE: Record<LogLevel, { className: string }> = {
  Error: { className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
  Warning: { className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  Info: { className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
}

const QUEUE_STATUS_BADGE: Record<QueueStatus, { className: string }> = {
  Healthy: { className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
  Delayed: { className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  Failing: { className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
}

function buildLogColumns(levelFilter: LogLevel | "all", setLevelFilter: (v: LogLevel | "all") => void): ColumnDef<ErrorLog, unknown>[] {
  return [
    { accessorKey: "timestamp", header: "Timestamp", cell: ({ row }) => <span className="text-muted-foreground text-[13px] font-mono whitespace-nowrap">{new Date(row.original.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}</span> },
    {
      accessorKey: "level", header: () => (
        <div className="flex items-center gap-2">
          <span>Level</span>
          <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as LogLevel | "all")}>
            <SelectTrigger className="h-7 w-[90px] text-[11px] border-0 bg-transparent p-0 hover:bg-transparent focus:ring-0" onClick={(e) => e.stopPropagation()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="Error">Error</SelectItem><SelectItem value="Warning">Warning</SelectItem><SelectItem value="Info">Info</SelectItem></SelectContent>
          </Select>
        </div>
      ),
      cell: ({ row }) => <Badge variant="outline" className={LOG_LEVEL_BADGE[row.original.level].className}>{row.original.level}</Badge>,
    },
    { accessorKey: "message", header: "Message", cell: ({ row }) => <span className="text-foreground text-[13px] max-w-[360px] truncate block">{row.original.message}</span> },
    { accessorKey: "source", header: "Source", cell: ({ row }) => <span className="text-muted-foreground text-[13px] font-mono">{row.original.source}</span> },
    { accessorKey: "tenant_id", header: "Company", cell: ({ row }) => { const tid = row.original.tenant_id; if (!tid) return <span className="text-muted-foreground">—</span>; return <Link href={`/super-admin/tenants/${tid}`} className="text-primary hover:underline font-medium text-[13px]">{tid}</Link> } },
  ]
}

export default function HealthPage() {
  const [summary, setSummary] = React.useState<HealthSummary | null>(null)
  const [dailyUptime, setDailyUptime] = React.useState<UptimeDay[]>([])
  const [hourlyResponse, setHourlyResponse] = React.useState<HourlyResponse[]>([])
  const [errorLogs, setErrorLogs] = React.useState<ErrorLog[]>([])
  const [jobQueues, setJobQueues] = React.useState<JobQueue[]>([])
  const [loading, setLoading] = React.useState(true)
  const [levelFilter, setLevelFilter] = React.useState<LogLevel | "all">("all")

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      const [s, u, r, e, q] = await Promise.all([
        superAdminService.getHealthSummary(), superAdminService.getUptime(),
        superAdminService.getHourlyResponse(), superAdminService.getErrorLogs(), superAdminService.getJobQueues(),
      ])
      if (cancelled) return
      if (s.data) setSummary(s.data)
      if (!u.error) setDailyUptime(u.data)
      if (!r.error) setHourlyResponse(r.data)
      if (!e.error) setErrorLogs(e.data)
      if (!q.error) setJobQueues(q.data)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filteredLogs = React.useMemo(() => levelFilter === "all" ? errorLogs : errorLogs.filter((l) => l.level === levelFilter), [errorLogs, levelFilter])
  const logColumns = React.useMemo(() => buildLogColumns(levelFilter, setLevelFilter), [levelFilter])

  const uptimeChartData = dailyUptime.map((d) => ({ date: new Date(d.date).toLocaleString("en-US", { month: "short", day: "numeric" }), uptime: d.uptime }))

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div><h1 className="text-[15px] font-semibold text-foreground">System Health</h1><p className="text-xs text-muted-foreground">Uptime, performance, and error monitoring</p></div>
      </div>
      <div className="flex-1 overflow-y-auto crm-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ReportsKpiCard title="Uptime" value={`${summary?.uptime ?? 0}%`} trend="Last 30 days" trendUp icon={Activity} />
              <ReportsKpiCard title="Avg Response Time" value={`${summary?.avg_response_ms ?? 0}ms`} trend="Last 24 hours" trendUp={(summary?.avg_response_ms ?? 0) < 200} icon={Clock} />
              <ReportsKpiCard title="Errors (24h)" value={String(summary?.error_count_24h ?? 0)} trend="Across all sources" trendUp={(summary?.error_count_24h ?? 0) < 5} icon={AlertTriangle} />
              <ReportsKpiCard title="Active Queues" value={String(summary?.active_queues ?? 0)} trend="Background job queues" trendUp icon={Server} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ReportsChartCard title="Uptime (30 days)">
                <p className="text-[12px] text-muted-foreground mb-4">Daily uptime percentage over the last 30 days</p>
                <div className="h-[250px]">
                  <ChartContainer config={uptimeConfig} className="h-full w-full">
                    <AreaChart data={uptimeChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.25} /><stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} interval={4} />
                      <YAxis domain={[99.5, 100.1]} axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend content={<ChartLegendContent />} />
                      <Area type="monotone" dataKey="uptime" stroke="var(--color-chart-1)" strokeWidth={2} fill="url(#uptimeGrad)" dot={{ fill: "var(--color-chart-1)", r: 2 }} name="Uptime %" />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </ReportsChartCard>
              <ReportsChartCard title="API Response Time (24h)">
                <p className="text-[12px] text-muted-foreground mb-4">Average response time per hour over the last 24 hours</p>
                <div className="h-[250px]">
                  <ChartContainer config={responseConfig} className="h-full w-full">
                    <AreaChart data={hourlyResponse} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs><linearGradient id="responseGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.25} /><stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                      <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} interval={3} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickFormatter={(v: number) => `${v}ms`} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend content={<ChartLegendContent />} />
                      <Area type="monotone" dataKey="avg_ms" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#responseGrad)" dot={{ fill: "var(--color-chart-2)", r: 2 }} name="Avg Response (ms)" />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </ReportsChartCard>
            </div>
            <ReportsChartCard title="Background Jobs &amp; Queues">
              <p className="text-[12px] text-muted-foreground mb-4">Queue health and processing status</p>
              <div className="space-y-3">
                {jobQueues.map((q) => (
                  <div key={q.name} className="flex items-center justify-between py-3 px-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={QUEUE_STATUS_BADGE[q.status].className}>{q.status}</Badge>
                      <span className="text-[14px] font-medium text-foreground">{q.name}</span>
                    </div>
                    <div className="flex items-center gap-6 text-[13px] text-muted-foreground">
                      <div className="text-center"><p className="text-[11px] uppercase tracking-wider font-bold mb-0.5">Pending</p><p className="font-medium text-foreground">{q.pending_count}</p></div>
                      <div className="text-center"><p className="text-[11px] uppercase tracking-wider font-bold mb-0.5">Failed (24h)</p><p className="font-medium text-foreground">{q.failed_count_24h}</p></div>
                      <div className="text-center"><p className="text-[11px] uppercase tracking-wider font-bold mb-0.5">Avg Time</p><p className="font-medium text-foreground">{q.avg_process_time}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </ReportsChartCard>
            <ReportsChartCard title="Error Logs">
              <DataTable columns={logColumns} data={filteredLogs} emptyTitle="No logs found" emptyDescription="No log entries match your current filters." />
            </ReportsChartCard>
          </div>
        )}
      </div>
    </div>
  )
}
