"use client"

import * as React from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { Shield, Monitor, Smartphone, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ReportsChartCard } from "@/app/reports/reports-chart-card"
import { DataTable } from "@/components/shared/DataTable"
import { superAdminService, type AuditLogEntry, type ActiveSession, type SecuritySettings } from "@/services/super-admin"

const ACTION_FILTER_OPTIONS = ["Workspace created", "Updated tenant plan", "Changed tenant status", "Updated user limit", "Deactivated user", "Reactivated user", "Marked invoice as paid"]

function buildAuditColumns(actionFilter: string, setActionFilter: (v: string) => void): ColumnDef<AuditLogEntry, unknown>[] {
  return [
    { accessorKey: "timestamp", header: "Timestamp", cell: ({ row }) => <span className="text-muted-foreground text-[13px] font-mono whitespace-nowrap">{new Date(row.original.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}</span> },
    { accessorKey: "actor_name", header: "Actor", cell: ({ row }) => <div><p className="text-[13px] font-medium text-foreground">{row.original.actor_name}</p><p className="text-[11px] text-muted-foreground">{row.original.actor_email}</p></div> },
    {
      accessorKey: "action", header: () => (
        <div className="flex items-center gap-2">
          <span>Action</span>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="h-7 w-[140px] text-[11px] border-0 bg-transparent p-0 hover:bg-transparent focus:ring-0" onClick={(e) => e.stopPropagation()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent><SelectItem value="all">All actions</SelectItem>{ACTION_FILTER_OPTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      ),
      cell: ({ row }) => <span className="text-[13px] text-foreground">{row.original.action}</span>,
    },
    {
      accessorKey: "target_label", header: "Target", cell: ({ row }) => {
        const { target_type, target_id, target_label } = row.original
        if ((target_type === "Tenant" || target_type === "User") && target_id) {
          const href = target_type === "Tenant" ? `/super-admin/tenants/${target_id}` : `/super-admin/users/${target_id}`
          return <div><Link href={href} className="text-primary hover:underline font-medium text-[13px]">{target_label}</Link><p className="text-[11px] text-muted-foreground">{target_type}</p></div>
        }
        return <div><span className="text-[13px] font-medium text-foreground">{target_label}</span><p className="text-[11px] text-muted-foreground">{target_type}</p></div>
      },
    },
    { accessorKey: "ip_address", header: "IP Address", cell: ({ row }) => <span className="text-muted-foreground text-[13px] font-mono">{row.original.ip_address}</span> },
  ]
}

export default function SecurityPage() {
  const [auditLog, setAuditLog] = React.useState<AuditLogEntry[]>([])
  const [sessions, setSessions] = React.useState<ActiveSession[]>([])
  const [settings, setSettings] = React.useState<SecuritySettings | null>(null)
  const [loading, setLoading] = React.useState(true)

  const [twoFactor, setTwoFactor] = React.useState(false)
  const [ipWhitelist, setIpWhitelist] = React.useState(false)
  const [whitelistedIps, setWhitelistedIps] = React.useState<string[]>([])
  const [newIp, setNewIp] = React.useState("")
  const [sessionTimeout, setSessionTimeout] = React.useState(30)
  const [actionFilter, setActionFilter] = React.useState("all")

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      const [s, a, sess] = await Promise.all([
        superAdminService.getSecuritySettings(), superAdminService.getAuditLog(), superAdminService.getActiveSessions(),
      ])
      if (cancelled) return
      if (s.data) { setSettings(s.data); setTwoFactor(s.data.two_factor_required); setIpWhitelist(s.data.ip_whitelist_enabled); setWhitelistedIps(s.data.whitelisted_ips); setSessionTimeout(s.data.session_timeout_minutes ?? 30) }
      if (!a.error) setAuditLog(a.data)
      if (!sess.error) setSessions(sess.data)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filteredLogs = React.useMemo(() => actionFilter === "all" ? auditLog : auditLog.filter((l) => l.action === actionFilter), [auditLog, actionFilter])
  const auditColumns = React.useMemo(() => buildAuditColumns(actionFilter, setActionFilter), [actionFilter])

  const handleSaveSettings = async () => {
    const clamped = Math.min(480, Math.max(5, sessionTimeout))
    if (clamped !== sessionTimeout) setSessionTimeout(clamped)
    const result = await superAdminService.updateSecuritySettings({ two_factor_required: twoFactor, ip_whitelist_enabled: ipWhitelist, whitelisted_ips: whitelistedIps, session_timeout_minutes: clamped })
    if (result.error) { toast.error(result.error.message) } else { toast.success("Security settings saved") }
  }

  const handleAddIp = () => { const ip = newIp.trim(); if (!ip) return; if (whitelistedIps.includes(ip)) { toast.error("IP already in whitelist"); return }; setWhitelistedIps([...whitelistedIps, ip]); setNewIp("") }
  const handleRemoveIp = (ip: string) => { setWhitelistedIps(whitelistedIps.filter((i) => i !== ip)) }

  const handleRevokeSession = async (id: string) => {
    const result = await superAdminService.revokeSession(id)
    if (result.error) { toast.error(result.error.message) } else { setSessions((prev) => prev.filter((s) => s.id !== id)); toast.success("Session revoked") }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div><h1 className="text-[15px] font-semibold text-foreground">Security</h1><p className="text-xs text-muted-foreground">Platform security settings and audit trail</p></div>
      </div>
      <div className="flex-1 overflow-y-auto crm-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="p-6 space-y-6 max-w-5xl">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4"><CardTitle className="text-[15px] font-bold text-foreground">Security Settings</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="space-y-0.5"><p className="text-[14px] font-bold text-foreground">Require 2FA for Super Admin team</p><p className="text-[12px] text-muted-foreground">All team members must enable two-factor authentication</p></div>
                  <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
                </div>
                <div className="py-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5"><p className="text-[14px] font-bold text-foreground">Enable IP whitelist</p><p className="text-[12px] text-muted-foreground">Restrict access to approved IP addresses only</p></div>
                    <Switch checked={ipWhitelist} onCheckedChange={setIpWhitelist} />
                  </div>
                  {ipWhitelist && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Input value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="e.g. 192.168.1.0/24" className="max-w-[240px] h-8 text-[13px]" onKeyDown={(e) => { if (e.key === "Enter") handleAddIp() }} />
                        <Button variant="outline" size="sm" className="h-8 text-[12px] font-bold" onClick={handleAddIp}>Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {whitelistedIps.map((ip) => (
                          <div key={ip} className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-md text-[12px] font-mono text-foreground">
                            {ip}
                            <button onClick={() => handleRemoveIp(ip)} className="ml-1 text-muted-foreground hover:text-destructive text-[14px] leading-none">×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5"><p className="text-[14px] font-bold text-foreground">Session timeout (minutes)</p><p className="text-[12px] text-muted-foreground">Auto-logout after period of inactivity</p></div>
                  <Input type="number" min={5} max={480} value={sessionTimeout} onChange={(e) => { const v = Number(e.target.value); if (!isNaN(v)) setSessionTimeout(Math.min(480, Math.max(1, v))) }} className="w-[80px] h-8 text-[13px] text-center" />
                </div>
                <div className="flex justify-end pt-2">
                  <Button size="sm" className="h-8 px-4 text-[12px] font-bold" onClick={handleSaveSettings}>Save changes</Button>
                </div>
              </CardContent>
            </Card>

            <ReportsChartCard title="Active Sessions">
              <div className="space-y-0">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-4 border-b border-border last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        {s.device.includes("iPhone") || s.device.includes("Android") ? <Smartphone className="h-4 w-4 text-muted-foreground" /> : <Monitor className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-foreground">{s.user_name}</p>
                          {s.is_current_session && <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">Current</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{s.device} · {s.ip_address} · {s.location}</p>
                        <p className="text-[11px] text-muted-foreground">Last active: {s.last_active}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px] text-red-600 hover:text-red-700 hover:bg-red-50" disabled={s.is_current_session} onClick={() => handleRevokeSession(s.id)}>Revoke</Button>
                  </div>
                ))}
              </div>
            </ReportsChartCard>

            <ReportsChartCard title="Audit Log">
              <DataTable columns={auditColumns} data={filteredLogs} searchKey="actor_name" emptyTitle="No log entries found" emptyDescription="No audit entries match your current filters." />
            </ReportsChartCard>
          </div>
        )}
      </div>
    </div>
  )
}
