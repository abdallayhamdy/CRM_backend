"use client"

import * as React from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { DollarSign, CalendarClock, AlertTriangle, TrendingUp, Plus, Loader2 } from "lucide-react"
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltipContent, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ReportsKpiCard } from "@/app/reports/reports-kpi-card"
import { ReportsChartCard } from "@/app/reports/reports-chart-card"
import { DataTable } from "@/components/shared/DataTable"
import { superAdminService, type Invoice, type BillingSummary, type PlanDistribution, type RevenueTrend, type Tenant, PLAN_PRICE } from "@/services/super-admin"

const revenueConfig = { mrr: { label: "MRR", color: "var(--color-chart-1)" } } satisfies ChartConfig
const PLAN_COLORS: Record<string, string> = { Starter: "var(--color-chart-2)", Pro: "var(--color-chart-1)", Enterprise: "var(--color-chart-3)" }
type InvoiceStatus = Invoice["status"]

const STATUS_BADGE: Record<InvoiceStatus, { className: string }> = {
  Paid: { className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" },
  Pending: { className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  Overdue: { className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
}

function formatCurrency(v: number): string { return `$${v.toLocaleString()}` }

function buildInvoiceColumns(statusFilter: InvoiceStatus | "all", setStatusFilter: (v: InvoiceStatus | "all") => void, onMarkAsPaid: (id: string) => void): ColumnDef<Invoice, unknown>[] {
  return [
    { accessorKey: "tenant_name", header: "Company", cell: ({ row }) => <Link href={`/super-admin/tenants/${row.original.tenant_id}`} className="text-primary hover:underline font-medium">{row.original.tenant_name}</Link> },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => <span className="font-medium text-foreground">{formatCurrency(row.original.amount)}</span> },
    {
      accessorKey: "status", header: () => (
        <div className="flex items-center gap-2">
          <span>Status</span>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InvoiceStatus | "all")}>
            <SelectTrigger className="h-7 w-[100px] text-[11px] border-0 bg-transparent p-0 hover:bg-transparent focus:ring-0" onClick={(e) => e.stopPropagation()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
      cell: ({ row }) => <Badge variant="outline" className={STATUS_BADGE[row.original.status].className}>{row.original.status}</Badge>,
    },
    { accessorKey: "issued_date", header: "Issued", cell: ({ row }) => <span className="text-muted-foreground">{new Date(row.original.issued_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span> },
    { accessorKey: "due_date", header: "Due", cell: ({ row }) => <span className="text-muted-foreground">{new Date(row.original.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span> },
    { id: "actions", header: "", cell: ({ row }) => { const inv = row.original; if (inv.status === "Paid") return null; return <div className="flex items-center justify-end"><button onClick={() => onMarkAsPaid(inv.id)} className="text-xs font-medium text-primary hover:underline">Mark as Paid</button></div> } },
  ]
}

function CreateInvoiceDialog({ open, onOpenChange, onCreated, tenants }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: () => void; tenants: Tenant[] }) {
  const billableTenants = React.useMemo(() => tenants.filter((t) => t.status === "active" || t.status === "suspended"), [tenants])
  const today = React.useMemo(() => new Date().toISOString().split("T")[0], [])
  const [tenantId, setTenantId] = React.useState("")
  const [amount, setAmount] = React.useState<number>(0)
  const [issuedDate, setIssuedDate] = React.useState(today)
  const [dueDate, setDueDate] = React.useState(() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split("T")[0] })
  const [markPaid, setMarkPaid] = React.useState(false)
  const [paidDate, setPaidDate] = React.useState(today)
  const [submitting, setSubmitting] = React.useState(false)

  const handleTenantChange = (id: string) => { setTenantId(id); const tenant = billableTenants.find((t) => t.id === id); if (tenant) setAmount(PLAN_PRICE[tenant.plan] || 0) }
  const handleIssuedChange = (date: string) => { setIssuedDate(date); const d = new Date(date); d.setDate(d.getDate() + 14); setDueDate(d.toISOString().split("T")[0]) }

  const resetForm = () => { setTenantId(""); setAmount(0); setIssuedDate(today); const d = new Date(); d.setDate(d.getDate() + 14); setDueDate(d.toISOString().split("T")[0]); setMarkPaid(false); setPaidDate(today) }

  const handleSubmit = async () => {
    if (!tenantId || amount <= 0) return
    if (dueDate < issuedDate) { toast.error("Due date must be on or after the issued date"); return }
    setSubmitting(true)
    const result = await superAdminService.createInvoice({ tenant_id: tenantId, amount, issued_date: issuedDate, due_date: dueDate, paid_date: markPaid ? paidDate : undefined })
    setSubmitting(false)
    if (result.error) { toast.error(result.error.message) } else { toast.success("Invoice created"); resetForm(); onOpenChange(false); onCreated() }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) resetForm(); onOpenChange(next) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-foreground">Tenant</Label>
            <Select value={tenantId} onValueChange={handleTenantChange}>
              <SelectTrigger className="h-8 text-[13px]"><SelectValue placeholder="Select a tenant" /></SelectTrigger>
              <SelectContent>{billableTenants.map((t) => <SelectItem key={t.id} value={t.id}>{t.company_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-foreground">Amount ($)</Label>
            <Input type="number" min={1} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} placeholder="0" className="h-8 text-[13px]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="text-[13px] font-medium text-foreground">Issued Date</Label><Input type="date" value={issuedDate} onChange={(e) => handleIssuedChange(e.target.value)} className="h-8 text-[13px]" /></div>
            <div className="space-y-2"><Label className="text-[13px] font-medium text-foreground">Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-8 text-[13px]" /></div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer"><Checkbox checked={markPaid} onCheckedChange={(v) => setMarkPaid(!!v)} /><span className="text-[13px] text-foreground">Mark as already paid</span></label>
            {markPaid && <div className="space-y-2 pl-6"><Label className="text-[13px] font-medium text-foreground">Paid Date</Label><Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} className="h-8 text-[13px] max-w-[200px]" /></div>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="h-8 text-[12px] font-bold" onClick={() => { resetForm(); onOpenChange(false) }}>Cancel</Button>
          <Button size="sm" className="h-8 text-[12px] font-bold" onClick={handleSubmit} disabled={!tenantId || amount <= 0 || dueDate < issuedDate || submitting}>{submitting ? "Creating..." : "Create Invoice"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function BillingPage() {
  const [summary, setSummary] = React.useState<BillingSummary | null>(null)
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [planDist, setPlanDist] = React.useState<PlanDistribution[]>([])
  const [revenueTrend, setRevenueTrend] = React.useState<RevenueTrend[]>([])
  const [tenants, setTenants] = React.useState<Tenant[]>([])
  const [loading, setLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<InvoiceStatus | "all">("all")
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [createOpen, setCreateOpen] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      const [s, i, p, r, t] = await Promise.all([
        superAdminService.getBillingSummary(), superAdminService.getInvoices(),
        superAdminService.getPlanDistribution(), superAdminService.getRevenueTrend(), superAdminService.getTenants({ limit: 200 }),
      ])
      if (cancelled) return
      if (s.data) setSummary(s.data)
      if (!i.error) setInvoices(i.data)
      if (!p.error) setPlanDist(p.data)
      if (!r.error) setRevenueTrend(r.data)
      if (!t.error) setTenants(t.data)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [refreshKey])

  const filteredInvoices = React.useMemo(() => statusFilter === "all" ? invoices : invoices.filter((inv) => inv.status === statusFilter), [invoices, statusFilter])
  const handleMarkAsPaid = React.useCallback(async (id: string) => { const r = await superAdminService.markInvoiceAsPaid(id); if (r.error) { toast.error(r.error.message) } else { setRefreshKey((k) => k + 1); toast.success("Invoice marked as paid") } }, [])
  const columns = React.useMemo(() => buildInvoiceColumns(statusFilter, setStatusFilter, handleMarkAsPaid), [statusFilter, handleMarkAsPaid])
  const donutData = planDist.map((p) => ({ name: p.plan, value: p.count }))
  const mrrDelta = revenueTrend.length >= 2 ? revenueTrend[revenueTrend.length - 1].mrr - revenueTrend[revenueTrend.length - 2].mrr : 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div><h1 className="text-[15px] font-semibold text-foreground">Billing &amp; Subscriptions</h1><p className="text-xs text-muted-foreground">Revenue, plans, and invoice management</p></div>
      </div>
      <div className="flex-1 overflow-y-auto crm-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ReportsKpiCard title="MRR" value={formatCurrency(summary?.mrr ?? 0)} trend={`+${formatCurrency(mrrDelta)} this quarter`} trendUp={mrrDelta > 0} icon={DollarSign} />
              <ReportsKpiCard title="ARR" value={formatCurrency(summary?.arr ?? 0)} trend="Projected annual" trendUp icon={TrendingUp} />
              <ReportsKpiCard title="Overdue Invoices" value={String(summary?.overdue_invoice_count ?? 0)} trend={summary && summary.overdue_invoice_count > 0 ? `${summary.overdue_invoice_count} past due` : "0 issues"} trendUp={!summary || summary.overdue_invoice_count === 0} icon={AlertTriangle} />
              <ReportsKpiCard title="Avg Rev / Tenant" value={formatCurrency(summary?.avg_revenue_per_tenant ?? 0)} trend={`Across ${summary?.active_tenant_count ?? 0} active tenants`} trendUp icon={CalendarClock} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <ReportsChartCard title="Plan Distribution">
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    <div className="relative w-full h-[180px]">
                      <ChartContainer config={{}} className="h-full w-full">
                        <PieChart><Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">{donutData.map((entry) => <Cell key={entry.name} fill={PLAN_COLORS[entry.name] || "var(--color-chart-4)"} />)}</Pie><Tooltip content={<ChartTooltipContent />} /></PieChart>
                      </ChartContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="text-center"><p className="text-[11px] text-muted-foreground">Total</p><p className="text-[18px] font-bold text-foreground">{planDist.reduce((s, p) => s + p.count, 0)}</p></div></div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-3">{donutData.map((d) => <div key={d.name} className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: PLAN_COLORS[d.name] || "var(--color-chart-4)" }} />{d.name} ({d.value})</div>)}</div>
                  </div>
                </ReportsChartCard>
              </div>
              <div className="lg:col-span-2">
                <ReportsChartCard title="Revenue Trend">
                  <p className="text-[12px] text-muted-foreground mb-4">Monthly recurring revenue over time</p>
                  <div className="h-[300px]">
                    <ChartContainer config={revenueConfig} className="h-full w-full">
                      <AreaChart data={revenueTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <defs><linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.25} /><stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}K`} />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Legend content={<ChartLegendContent />} />
                        <Area type="monotone" dataKey="mrr" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#mrrGrad)" dot={{ fill: "var(--color-chart-1)", r: 3 }} name="MRR" />
                      </AreaChart>
                    </ChartContainer>
                  </div>
                </ReportsChartCard>
              </div>
            </div>
            <ReportsChartCard title="Invoices" action={<Button size="sm" className="h-8 px-3 text-[12px] font-bold gap-1.5" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5" />Create Invoice</Button>}>
              <DataTable columns={columns} data={filteredInvoices} searchKey="tenant_name" emptyTitle="No invoices found" emptyDescription="No invoices match your current filters." />
            </ReportsChartCard>
          </div>
        )}
      </div>
      <CreateInvoiceDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => setRefreshKey((k) => k + 1)} tenants={tenants} />
    </div>
  )
}
