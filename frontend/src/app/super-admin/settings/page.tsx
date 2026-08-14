"use client"

import * as React from "react"
import { toast } from "sonner"
import { Settings2, Mail, Key, Webhook as WebhookIcon, Plus, Copy, Check, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getSaBadgeClassName } from "@/lib/badge-colors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { superAdminService, type GeneralPlatformSettings, type EmailTemplate, type ApiKey, type Webhook, WEBHOOK_EVENTS } from "@/services/super-admin"
import { useAuth } from "@/hooks/use-auth"

function GeneralSettingsSection({ settings, onSaved }: { settings: GeneralPlatformSettings; onSaved: () => void }) {
  const [form, setForm] = React.useState({ ...settings, platform_name: settings.platform_name ?? "", support_email: settings.support_email ?? "" })
  const [saving, setSaving] = React.useState(false)
  const handleSave = async () => {
    if (!form.platform_name.trim()) { toast.error("Platform name is required"); return }
    if (!form.support_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.support_email)) { toast.error("A valid support email is required"); return }
    const trialDays = Math.min(90, Math.max(1, form.default_trial_days))
    if (trialDays !== form.default_trial_days) setForm((prev) => ({ ...prev, default_trial_days: trialDays }))
    setSaving(true)
    const r = await superAdminService.updateGeneralSettings({ ...form, default_trial_days: trialDays })
    setSaving(false)
    if (r.error) { toast.error(r.error.message) } else { toast.success("General settings saved"); onSaved() }
  }
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Settings2 className="h-4 w-4 text-primary" /></div><CardTitle className="text-[15px] font-bold text-foreground">General Platform Settings</CardTitle></div></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label className="text-[13px] font-medium text-foreground">Platform Name</Label><Input value={form.platform_name} onChange={(e) => setForm((prev) => ({ ...prev, platform_name: e.target.value }))} className="h-8 text-[13px]" /></div>
          <div className="space-y-2"><Label className="text-[13px] font-medium text-foreground">Support Email</Label><Input type="email" value={form.support_email} onChange={(e) => setForm((prev) => ({ ...prev, support_email: e.target.value }))} className="h-8 text-[13px]" /></div>
          <div className="space-y-2"><Label className="text-[13px] font-medium text-foreground">Default Trial Days</Label><Input type="number" min={1} max={90} value={form.default_trial_days} onChange={(e) => { const v = Number(e.target.value); if (!isNaN(v)) setForm((prev) => ({ ...prev, default_trial_days: Math.min(90, Math.max(1, v)) })) }} className="h-8 text-[13px]" /></div>
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-foreground">Default Plan</Label>
            <Select value={form.default_plan} onValueChange={(v) => setForm((prev) => ({ ...prev, default_plan: v as GeneralPlatformSettings["default_plan"] }))}>
              <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="starter">Starter</SelectItem><SelectItem value="pro">Pro</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end pt-2"><Button size="sm" className="h-8 px-4 text-[12px] font-bold" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button></div>
      </CardContent>
    </Card>
  )
}

function EmailTemplatesSection({ templates, onRefresh }: { templates: EmailTemplate[]; onRefresh: () => void }) {
  const [editOpen, setEditOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<EmailTemplate | null>(null)
  const [subject, setSubject] = React.useState("")
  const [body, setBody] = React.useState("")

  const handleEdit = (template: EmailTemplate) => {
    setEditing(template)
    setSubject(template.subject)
    setBody(template.body)
    setEditOpen(true)
  }

  const handleSave = async () => {
    if (!editing) return
    const r = await superAdminService.updateEmailTemplate(editing.id, { subject, body })
    if (r.error) {
      toast.error(r.error.message)
      return
    }
    toast.success(`"${editing.name}" updated`)
    setEditOpen(false)
    onRefresh()
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-[15px] font-bold text-foreground">Email Templates</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {templates.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-foreground">{t.name}</p>
                <p className="text-[12px] text-muted-foreground truncate max-w-[400px]">Subject: {t.subject}</p>
                <p className="text-[11px] text-muted-foreground">Last edited: {t.updated_at ? new Date(t.updated_at).toLocaleDateString() : "Never"}</p>
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs shrink-0" onClick={() => handleEdit(t)}>Edit</Button>
            </div>
          ))}
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Edit Template — {editing?.name}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-foreground">Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="h-8 text-[13px]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-foreground">Body</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="text-[13px] font-mono resize-y" />
                <p className="text-[11px] text-muted-foreground">
                  Available tokens: {"{{companyName}}"}, {"{{userName}}"}, {"{{invoiceId}}"}, {"{{amount}}"}, {"{{resetLink}}"}, {"{{supportEmail}}"}, {"{{daysLeft}}"}, {"{{nextBillingDate}}"}, {"{{reason}}"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" className="h-8 text-[12px] font-bold" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button size="sm" className="h-8 text-[12px] font-bold" onClick={handleSave}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

function ApiKeysSection({ keys, onRefresh }: { keys: ApiKey[]; onRefresh: () => void }) {
  const [createOpen, setCreateOpen] = React.useState(false)
  const [newKeyName, setNewKeyName] = React.useState("")
  const [fullKey, setFullKey] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  const [revokeTarget, setRevokeTarget] = React.useState<ApiKey | null>(null)
  const [revokeOpen, setRevokeOpen] = React.useState(false)

  const handleGenerate = async () => {
    if (!newKeyName.trim()) return
    const r = await superAdminService.createApiKey(newKeyName.trim())
    if (r.error) {
      toast.error(r.error.message)
      return
    }
    setFullKey(r.data?.full_key ?? null)
    setNewKeyName("")
    onRefresh()
  }

  const handleCopyKey = () => {
    if (!fullKey) return
    navigator.clipboard.writeText(fullKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return
    const r = await superAdminService.revokeApiKey(revokeTarget.id)
    if (r.error) {
      toast.error(r.error.message)
      return
    }
    toast.success(`"${revokeTarget.name}" revoked`)
    setRevokeOpen(false)
    onRefresh()
  }

  const handleCloseKeyDialog = () => {
    setCreateOpen(false)
    setFullKey(null)
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-[15px] font-bold text-foreground">API Keys</CardTitle>
          </div>
          <Button size="sm" className="h-8 px-3 text-[12px] font-bold gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Generate New Key
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium text-foreground">{k.name}</p>
                  <Badge variant="outline" className={k.status === "Active" ? "text-[10px] px-1.5 py-0 " + getSaBadgeClassName('sa:api_key_status', 'active') : "text-[10px] px-1.5 py-0 " + getSaBadgeClassName('sa:api_key_status', 'inactive')}>{k.status}</Badge>
                </div>
                <p className="text-[12px] text-muted-foreground font-mono">{k.key_preview}</p>
                <p className="text-[11px] text-muted-foreground">Created: {k.created_at.slice(0, 10)} · Last used: {k.last_used_at ? k.last_used_at.slice(0, 10) : "Never"}</p>
              </div>
              <Button variant="ghost" size="sm" className={`h-7 px-2 text-xs shrink-0 ${k.status === "Revoked" ? "text-muted-foreground cursor-not-allowed" : "text-status-danger hover:text-status-danger/80 hover:bg-badge-danger-bg"}`} disabled={k.status === "Revoked"} onClick={() => { setRevokeTarget(k); setRevokeOpen(true) }}>Revoke</Button>
            </div>
          ))}
        </div>

        {/* Generate Key Dialog */}
        <Dialog open={createOpen} onOpenChange={handleCloseKeyDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Generate New API Key</DialogTitle></DialogHeader>
            {fullKey ? (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-[12px] text-muted-foreground mb-2">Your new API key (copy it now — it won&apos;t be shown again):</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[13px] font-mono bg-background px-2 py-1.5 rounded border border-border break-all">{fullKey}</code>
                    <Button variant="outline" size="sm" className="h-8 px-2 shrink-0" onClick={handleCopyKey}>{copied ? <Check className="h-3.5 w-3.5 text-status-success" /> : <Copy className="h-3.5 w-3.5" />}</Button>
                  </div>
                </div>
                <DialogFooter><Button size="sm" className="h-8 text-[12px] font-bold" onClick={handleCloseKeyDialog}>Done</Button></DialogFooter>
              </div>
            ) : (
              <>
                <div className="space-y-2 py-2">
                  <Label className="text-[13px] font-medium text-foreground">Key Name</Label>
                  <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production Key" className="h-8 text-[13px]" onKeyDown={(e) => { if (e.key === "Enter") handleGenerate() }} />
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" className="h-8 text-[12px] font-bold" onClick={handleCloseKeyDialog}>Cancel</Button>
                  <Button size="sm" className="h-8 text-[12px] font-bold" onClick={handleGenerate}>Generate</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Revoke Confirmation */}
        <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke API key?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently revoke &quot;{revokeTarget?.name}&quot;. Any integrations using this key will stop working immediately.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Revoke</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

function WebhooksSection({ webhooks, onRefresh }: { webhooks: Webhook[]; onRefresh: () => void }) {
  const [addOpen, setAddOpen] = React.useState(false)
  const [webhookUrl, setWebhookUrl] = React.useState("")
  const [selectedEvents, setSelectedEvents] = React.useState<string[]>([])

  const [deleteTarget, setDeleteTarget] = React.useState<Webhook | null>(null)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const handleToggleEvent = (event: string) => {
    setSelectedEvents((prev) => prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event])
  }

  const handleAdd = async () => {
    if (!webhookUrl.trim() || selectedEvents.length === 0) return
    const r = await superAdminService.createWebhook(webhookUrl.trim(), selectedEvents)
    if (r.error) {
      toast.error(r.error.message)
      return
    }
    toast.success("Webhook created")
    setAddOpen(false)
    setWebhookUrl("")
    setSelectedEvents([])
    onRefresh()
  }

  const handleToggle = async (id: string) => {
    const r = await superAdminService.toggleWebhookStatus(id)
    if (r.error) {
      toast.error(r.error.message)
      return
    }
    if (r.data) {
      toast.success(`Webhook ${r.data.status === "Active" ? "enabled" : "disabled"}`)
      onRefresh()
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const r = await superAdminService.deleteWebhook(deleteTarget.id)
    if (r.error) {
      toast.error(r.error.message)
      return
    }
    toast.success("Webhook deleted")
    setDeleteOpen(false)
    onRefresh()
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <WebhookIcon className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-[15px] font-bold text-foreground">Webhooks</CardTitle>
          </div>
          <Button size="sm" className="h-8 px-3 text-[12px] font-bold gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Webhook
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {webhooks.map((w) => (
            <div key={w.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-foreground font-mono truncate max-w-[400px]">{w.url}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {w.events.map((event) => (
                    <Badge key={event} variant="outline" className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground">{event}</Badge>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Last triggered: {w.last_triggered_at ? new Date(w.last_triggered_at).toLocaleString() : "Never"}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch size="sm" checked={w.status === "Active"} onCheckedChange={() => handleToggle(w.id)} />
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px] text-status-danger hover:text-status-danger/80 hover:bg-badge-danger-bg" onClick={() => { setDeleteTarget(w); setDeleteOpen(true) }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Webhook Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add Webhook</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-foreground">Endpoint URL</Label>
                <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://example.com/webhook" className="h-8 text-[13px] font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium text-foreground">Events</Label>
                <div className="space-y-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <label key={event} className="flex items-center gap-2.5 cursor-pointer">
                      <Checkbox checked={selectedEvents.includes(event)} onCheckedChange={() => handleToggleEvent(event)} />
                      <span className="text-[13px] text-foreground font-mono">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" className="h-8 text-[12px] font-bold" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button size="sm" className="h-8 text-[12px] font-bold" onClick={handleAdd} disabled={!webhookUrl.trim() || selectedEvents.length === 0}>Add Webhook</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete webhook?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently remove the webhook endpoint. Any integrations relying on this URL will stop receiving events.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

function DangerZoneSection() {
  const { signOut } = useAuth()
  const [open, setOpen] = React.useState(false)
  const [password, setPassword] = React.useState("")
  const [confirmText, setConfirmText] = React.useState("")
  const [terminating, setTerminating] = React.useState(false)

  const handleTerminate = async () => {
    if (confirmText !== "TERMINATE") {
      toast.error("Please type TERMINATE to confirm")
      return
    }
    if (!password) {
      toast.error("Password is required")
      return
    }
    setTerminating(true)
    const r = await superAdminService.terminateSelf(password)
    setTerminating(false)
    if (r.error) {
      toast.error(r.error.message)
    } else {
      toast.success("Account terminated. You will be logged out.")
      setOpen(false)
      setTimeout(() => { signOut() }, 1500)
    }
  }

  return (
    <>
      <Card className="border-red-200 dark:border-red-900/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-[15px] font-bold text-foreground">Danger Zone</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50/50 dark:bg-red-950/20">
            <div>
              <p className="text-[13px] font-medium text-foreground">Terminate My Platform Owner Account</p>
              <p className="text-xs text-muted-foreground mt-1">
                This will remove your Platform Owner privileges and log you out. You can be restored later via the artisan command.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0 h-8 px-4 text-[12px] font-bold"
              onClick={() => setOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Terminate
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold">Terminate Platform Owner Account</DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              This action will revoke your Platform Owner privileges. You must type <span className="font-bold text-foreground">TERMINATE</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Password</Label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-8 text-[13px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Type TERMINATE to confirm</Label>
              <Input
                placeholder="TERMINATE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="h-8 text-[13px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 text-[12px]" onClick={() => { setOpen(false); setPassword(""); setConfirmText("") }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-[12px] font-bold"
              onClick={handleTerminate}
              disabled={terminating || confirmText !== "TERMINATE" || !password}
            >
              {terminating ? "Terminating..." : "Terminate Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<GeneralPlatformSettings | null>(null)
  const [templates, setTemplates] = React.useState<EmailTemplate[]>([])
  const [keys, setKeys] = React.useState<ApiKey[]>([])
  const [webhooks, setWebhooks] = React.useState<Webhook[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshKey, setRefreshKey] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      const [s, t, k, w] = await Promise.all([
        superAdminService.getGeneralSettings(),
        superAdminService.getEmailTemplates(),
        superAdminService.getApiKeys(),
        superAdminService.getWebhooks(),
      ])
      if (cancelled) return
      if (s.data) setSettings(s.data)
      if (t.data) setTemplates(t.data)
      if (k.data) setKeys(k.data)
      if (w.data) setWebhooks(w.data)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [refreshKey])

  const triggerRefresh = () => setRefreshKey((k) => k + 1)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div><h1 className="text-[15px] font-semibold text-foreground">Settings</h1><p className="text-xs text-muted-foreground">Platform-wide configuration, email templates, API keys, and webhooks</p></div>
      </div>
      <div className="flex-1 overflow-y-auto crm-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="p-6 space-y-6 max-w-5xl">
            {settings && <GeneralSettingsSection settings={settings} onSaved={triggerRefresh} />}
            <EmailTemplatesSection templates={templates} onRefresh={triggerRefresh} />
            <ApiKeysSection keys={keys} onRefresh={triggerRefresh} />
            <WebhooksSection webhooks={webhooks} onRefresh={triggerRefresh} />
            <DangerZoneSection />
          </div>
        )}
      </div>
    </div>
  )
}
