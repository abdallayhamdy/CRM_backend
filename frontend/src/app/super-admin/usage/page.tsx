"use client"

import * as React from "react"
import { Building2, Users, UserCheck, AlertTriangle, Loader2 } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltipContent, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"
import { ReportsKpiCard } from "@/app/reports/reports-kpi-card"
import { ReportsChartCard } from "@/app/reports/reports-chart-card"
import { superAdminService, type GrowthData, type TenantUsage, type FeatureAdoption, type UsageSummary } from "@/services/super-admin"

const growthConfig = { new_tenants: { label: "New Tenants", color: "var(--color-chart-1)" }, total_active_users: { label: "Total Active Users", color: "var(--color-chart-2)" } } satisfies ChartConfig
const usageConfig = { audit_events: { label: "Audit Events", color: "var(--color-chart-1)" } } satisfies ChartConfig
const DONUT_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-chart-6, var(--color-chart-1))"]

export default function UsagePage() {
  const [growthData, setGrowthData] = React.useState<GrowthData[]>([])
  const [tenantUsage, setTenantUsage] = React.useState<TenantUsage[]>([])
  const [featureAdoption, setFeatureAdoption] = React.useState<FeatureAdoption[]>([])
  const [stats, setStats] = React.useState<UsageSummary | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      const [s, g, tu, fa] = await Promise.all([
        superAdminService.getUsageSummary(), superAdminService.getGrowthData(),
        superAdminService.getTenantUsage(), superAdminService.getFeatureAdoption(),
      ])
      if (cancelled) return
      if (s.data) setStats(s.data)
      if (!g.error) setGrowthData(g.data)
      if (!tu.error) setTenantUsage(tu.data)
      if (!fa.error) setFeatureAdoption(fa.data)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const usersDelta = growthData.length >= 2 ? growthData[growthData.length - 1].total_active_users - growthData[growthData.length - 2].total_active_users : 0
  const tenantsDelta = growthData.length > 0 ? growthData[growthData.length - 1].new_tenants : 0
  const adoptionTotal = featureAdoption.reduce((s, f) => s + f.adopted, 0)

  const topUsage = React.useMemo(() =>
    [...tenantUsage].filter((t) => t.audit_events > 0 && t.tenant_name).sort((a, b) => b.audit_events - a.audit_events).slice(0, 10).map((t) => ({ name: t.tenant_name.length > 18 ? t.tenant_name.slice(0, 16) + "…" : t.tenant_name, audit_events: t.audit_events })),
    [tenantUsage]
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div><h1 className="text-[15px] font-semibold text-foreground">Usage &amp; Analytics</h1><p className="text-xs text-muted-foreground">Platform-wide metrics and tenant adoption</p></div>
      </div>
      <div className="flex-1 overflow-y-auto crm-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ReportsKpiCard title="Total Tenants" value={String(stats?.total_tenants ?? 0)} trend={`+${tenantsDelta} this quarter`} trendUp={tenantsDelta > 0} icon={Building2} />
              <ReportsKpiCard title="Total Active Users" value={(stats?.total_active_users ?? 0).toLocaleString()} trend={`+${usersDelta} this quarter`} trendUp={usersDelta > 0} icon={Users} />
              <ReportsKpiCard title="Avg Users / Tenant" value={String(stats?.avg_users_per_tenant ?? 0)} trend="Across all tenants" trendUp icon={UserCheck} />
              <ReportsKpiCard title="Churn Rate" value={`${stats?.churn_rate ?? 0}%`} trend={`${stats?.churn_rate ?? 0}% churn rate`} trendUp={false} icon={AlertTriangle} />
            </div>

            <ReportsChartCard title="Growth Over Time">
              <p className="text-[12px] text-muted-foreground mb-4">New tenants added and total active users, by quarter</p>
              <div className="h-[350px]">
                <ChartContainer config={growthConfig} className="h-full w-full">
                  <AreaChart data={growthData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tenantsGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.25} /><stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} /></linearGradient>
                      <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.25} /><stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                    <YAxis yAxisId="tenants" axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                    <YAxis yAxisId="users" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend content={<ChartLegendContent />} />
                    <Area yAxisId="tenants" type="monotone" dataKey="new_tenants" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#tenantsGrad)" dot={{ fill: "var(--color-chart-1)", r: 3 }} name="New Tenants" />
                    <Area yAxisId="users" type="monotone" dataKey="total_active_users" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#usersGrad)" dot={{ fill: "var(--color-chart-2)", r: 3 }} name="Total Active Users" />
                  </AreaChart>
                </ChartContainer>
              </div>
            </ReportsChartCard>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ReportsChartCard title="Usage by Tenant">
                  <p className="text-[12px] text-muted-foreground mb-4">Top 10 tenants by audit events in the last 30 days</p>
                  <div className="h-[350px]">
                    <ChartContainer config={usageConfig} className="h-full w-full">
                      <BarChart data={topUsage} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} width={130} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="audit_events" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} name="Audit Events" />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </ReportsChartCard>
              </div>
              <div className="lg:col-span-1">
                <ReportsChartCard title="Feature Adoption">
                  <p className="text-[12px] text-muted-foreground mb-4">% of active tenants using each module</p>
                  <div className="h-[350px] flex flex-col items-center justify-center">
                    <div className="relative w-full h-[180px]">
                      <ChartContainer config={{}} className="h-full w-full">
                        <PieChart>
                          <Pie data={featureAdoption.map((f) => ({ name: f.feature, value: Math.round((f.adopted / f.total) * 100) }))} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                            {featureAdoption.map((_f, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                          </Pie>
                          <Tooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ChartContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="text-center"><p className="text-[11px] text-muted-foreground">Adoption</p><p className="text-[18px] font-bold text-foreground">{adoptionTotal}</p></div></div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-3">
                      {featureAdoption.map((f, i) => <div key={f.feature} className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />{f.feature} ({Math.round((f.adopted / f.total) * 100)}%)</div>)}
                    </div>
                  </div>
                </ReportsChartCard>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
