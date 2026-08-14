'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { laravelApi } from '@/lib/laravel-api'
import { toast } from 'sonner'
import { format, addDays } from 'date-fns'
import {
  Download,
  Upload,
  Info,
  ChevronDown,
  RefreshCw,
  Shield,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Avatar as CrmAvatar } from '@/components/crm/Avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

// ─── Types ───────────────────────────────────────────────
type Profile = {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

type Backup = {
  id: string
  workspace_id: string
  type: string
  status: string
  backup_date: string
  expires_on: string | null
  size: string | null
  created_by: string | null
  download_url: string | null
  created_at: string
  creatorProfile?: Profile | null
}

type RestoreHistory = {
  id: string
  workspace_id: string
  restore_type: string
  status: string
  source: string | null
  objects: string[] | null
  changed_by: string | null
  start_date: string | null
  end_date: string | null
  requested_by: string | null
  created_at: string
  requesterProfile?: Profile | null
}

type BackupSchedule = {
  id: string
  workspace_id: string
  is_enabled: boolean
  frequency: string
  day_of_week: string
  updated_at: string
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const RESTORE_OBJECTS = ['Calls', 'Companies', 'Contacts', 'Deals', 'Lead', 'Marketing events', 'Orders', 'Products', 'Tasks', 'Tickets']

const STATUS_COLORS: Record<string, string> = {
  processing: 'bg-status-warning',
  ready: 'bg-status-success',
  failed: 'bg-destructive',
}

// ─── Helpers ─────────────────────────────────────────────
function formatDate(dateStr: string) {
  return format(new Date(dateStr), 'MMM d, yyyy')
}

function formatDateTime(dateStr: string) {
  return format(new Date(dateStr), 'MMM d, yyyy h:mm a')
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Page ────────────────────────────────────────────────
export default function BackupRestorePage() {
  const { workspaceId, user } = useAuth()

  // Backup state
  const [backups, setBackups] = useState<Backup[]>([])
  const [schedule, setSchedule] = useState<BackupSchedule | null>(null)
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleFrequency, setScheduleFrequency] = useState('weekly')
  const [scheduleDay, setScheduleDay] = useState('Monday')
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [backupFilterType, setBackupFilterType] = useState('all')
  const [backupFilterStatus, setBackupFilterStatus] = useState('all')
  const [backupFilterUser, setBackupFilterUser] = useState('all')

  // Restore state
  const [restoreHistory, setRestoreHistory] = useState<RestoreHistory[]>([])
  const [restoreSheetOpen, setRestoreSheetOpen] = useState(false)
  const [restoreSheetType, setRestoreSheetType] = useState<'crm' | 'deleted'>('crm')
  const [restoreSource, setRestoreSource] = useState('')
  const [restoreObjects, setRestoreObjects] = useState<string[]>([])
  const [restoreChangedBy, setRestoreChangedBy] = useState('')
  const [restoreStartDate, setRestoreStartDate] = useState('')
  const [restoreStartTime, setRestoreStartTime] = useState('12:00')
  const [restoreEndDate, setRestoreEndDate] = useState('')
  const [restoreEndTime, setRestoreEndTime] = useState('12:00')
  const [showEndDate, setShowEndDate] = useState(false)
  const [restoreFilterType, setRestoreFilterType] = useState('all')
  const [restoreFilterStatus, setRestoreFilterStatus] = useState('all')
  const [restoreFilterDate, setRestoreFilterDate] = useState('all')
  const [restoreFilterUser, setRestoreFilterUser] = useState('all')
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false)
  const [restorePage, setRestorePage] = useState(1)
  const RESTORE_PAGE_SIZE = 10

  const [workspaceMembers, setWorkspaceMembers] = useState<{ id: string; name: string; email: string }[]>([])
  const [creatorOptions, setCreatorOptions] = useState<Profile[]>([])

  // Objects multi-select
  const [objectsSearch, setObjectsSearch] = useState('')
  const [objectsDropdownOpen, setObjectsDropdownOpen] = useState(false)

  const userId = user?.id || ''

  const canCreateBackup = () => {
    if (backups.length === 0) return true
    const lastBackup = backups[0]
    const lastDate = new Date(lastBackup.created_at)
    const now = new Date()
    const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60)
    return diffHours >= 24
  }

  const getNextBackupTime = () => {
    if (backups.length === 0) return ''
    const lastDate = new Date(backups[0].created_at)
    return format(addDays(lastDate, 1), 'MMM d, yyyy h:mm a') + ' GMT+3'
  }

  // ─── Click outside to close objects dropdown ──────────
  useEffect(() => {
    function handleClickOutside() {
      setObjectsDropdownOpen(false)
    }
    if (objectsDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [objectsDropdownOpen])

  // ─── Fetch data ──────────────────────────────────────
  useEffect(() => {
    if (!workspaceId) return
    fetchBackups()
    fetchSchedule()
    fetchRestoreHistory()
    fetchWorkspaceMembers()
  }, [workspaceId])

  async function fetchBackups() {
    const { data, error } = await laravelApi.get<{ data: any[] }>('/settings/backups')
    if (!error && data?.data) {
      setBackups(data.data.map((b: any) => ({
        ...b,
        creatorProfile: b.created_by ? { id: b.created_by, user_id: b.created_by, first_name: '', last_name: '', avatar_url: null } : null
      })) as Backup[])
      const ids = [...new Set(data.data.filter((b: any) => b.created_by).map((b: any) => b.created_by))]
      if (ids.length > 0) {
        const { data: membersData } = await laravelApi.get<any>('/workspace/members')
        const members = Array.isArray(membersData?.data) ? membersData.data : []
        const profiles: Profile[] = members.map((m: any) => ({
          id: m.id,
          user_id: m.id,
          first_name: m.name || '',
          last_name: '',
          avatar_url: null,
        }))
        setCreatorOptions(profiles)
        setBackups(data.data.map((b: any) => {
          const profile = profiles.find(p => p.id === b.created_by)
          return { ...b, creatorProfile: profile || null }
        }) as Backup[])
      }
    } else {
      setBackups([])
    }
  }

  async function fetchSchedule() {
    const { data, error } = await laravelApi.get<{ data: BackupSchedule }>('/settings/backup-schedule')
    if (!error && data?.data) {
      setSchedule(data.data)
      setScheduleEnabled(data.data.is_enabled)
      setScheduleFrequency(data.data.frequency)
      setScheduleDay(data.data.day_of_week)
    }
  }

  async function fetchRestoreHistory() {
    const { data, error } = await laravelApi.get<{ data: any[] }>('/settings/restore-history')
    if (!error && data?.data) {
      const { data: membersData } = await laravelApi.get<any>('/workspace/members')
      const members = Array.isArray(membersData?.data) ? membersData.data : []
      setRestoreHistory(data.data.map((r: any) => {
        const member = members.find((m: any) => m.id === r.requested_by)
        return {
          ...r,
          requesterProfile: member ? { id: member.id, user_id: member.id, first_name: member.name || '', last_name: '', avatar_url: null } : null,
        }
      }) as RestoreHistory[])
    } else {
      setRestoreHistory([])
    }
  }

  async function fetchWorkspaceMembers() {
    try {
      const { data } = await laravelApi.get<any>('/workspace/members')
      const members = Array.isArray(data?.data) ? data.data : []
      setWorkspaceMembers(members.map((m: any) => ({
        id: m.id,
        name: m.name || m.email || '',
        email: m.email || '',
      })))
    } catch {
      // fallback: leave empty
    }
  }

  async function handleCreateBackup() {
    const expiresOn = addDays(new Date(), 14).toISOString()
    const { error } = await laravelApi.post('/settings/backups', {
      type: 'manual',
      status: 'processing',
      backup_date: new Date().toISOString(),
      expires_on: expiresOn,
      created_by: userId,
    })
    if (error) {
      toast.error('Failed to create backup')
      return
    }

    toast.success('Backup started. You will be notified when it is ready.')
    setCreateDialogOpen(false)
    fetchBackups()
  }

  async function handleSaveSchedule() {
    const { error } = await laravelApi.patch('/settings/backup-schedule', {
      is_enabled: scheduleEnabled,
      frequency: scheduleFrequency,
      day_of_week: scheduleDay,
    })
    if (error) {
      toast.error('Failed to save schedule')
      return
    }
    toast.success('Schedule saved')
    setScheduleSheetOpen(false)
    fetchSchedule()
  }

  // ─── Restore actions ─────────────────────────────────
  function openRestoreSheet(type: 'crm' | 'deleted') {
    setRestoreSheetType(type)
    setRestoreSource('')
    setRestoreObjects([])
    setRestoreChangedBy('')
    setRestoreStartDate('')
    setRestoreStartTime('none')
    setRestoreEndDate('')
    setRestoreEndTime('none')
    setShowEndDate(false)
    setRestoreSheetOpen(true)
  }

  async function handlePrepareRestore() {
    const startTime = restoreStartTime === 'none' ? restoreStartDate : `${restoreStartDate}T${restoreStartTime}:00`
    const endTime = showEndDate && restoreEndDate
      ? (restoreEndTime === 'none' ? restoreEndDate : `${restoreEndDate}T${restoreEndTime}:00`)
      : null

    const { error } = await laravelApi.post('/settings/restore-history', {
      restore_type: restoreSheetType === 'crm' ? 'crm_changes' : 'deleted_records',
      status: 'processing',
      source: restoreSheetType === 'crm' ? restoreSource : null,
      objects: restoreSheetType === 'deleted' ? restoreObjects : null,
      changed_by: restoreSheetType === 'deleted' ? restoreChangedBy : null,
      start_date: startTime,
      end_date: endTime,
      requested_by: userId,
    })
    if (error) {
      toast.error('Failed to start restore')
      return
    }
    toast.success('Restore preview is being prepared. You will be notified when ready.')
    setRestoreSheetOpen(false)
    fetchRestoreHistory()
  }

  const canPrepareRestore = restoreSheetType === 'crm'
    ? !!restoreSource
    : restoreObjects.length > 0 && !!restoreStartDate

  // ─── Filtered data ──────────────────────────────────
  const filteredBackups = backups.filter(b => {
    if (backupFilterType !== 'all' && b.type !== backupFilterType) return false
    if (backupFilterStatus !== 'all' && b.status !== backupFilterStatus) return false
    if (backupFilterUser !== 'all') {
      const match = creatorOptions.find(p => p.user_id === backupFilterUser || p.id === backupFilterUser)
      if (!match || (b.created_by !== match.id && b.created_by !== match.user_id)) return false
    }
    return true
  })

  const filteredRestores = restoreHistory.filter(r => {
    if (restoreFilterType !== 'all' && r.restore_type !== restoreFilterType) return false
    if (restoreFilterStatus !== 'all' && r.status !== restoreFilterStatus) return false
    if (restoreFilterUser !== 'all') {
      const match = creatorOptions.find(p => p.user_id === restoreFilterUser || p.id === restoreFilterUser)
      if (!match || (r.requested_by !== match.id && r.requested_by !== match.user_id)) return false
    }
    return true
  })

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Backup & Restore</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Make a copy of your current CRM data. To protect your data, backups can only be downloaded or restored for 14 days.
        </p>
      </div>

      <Tabs defaultValue="backup" className="space-y-6">
        <TabsList>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="restore">Restore</TabsTrigger>
        </TabsList>

        {/* ═══════════════ TAB: BACKUP ═══════════════ */}
        <TabsContent value="backup" className="space-y-6">
          {/* Schedule card */}
          <div className="border rounded-lg p-4 flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Schedule automated backups</h3>
              <p className="text-xs text-muted-foreground max-w-xl">
                Keep your data safe at all times. Backups will start every Monday and may take 1-2 days to finish. You&apos;ll get an email if a backup does not work.
              </p>
            </div>
            <Switch
              checked={scheduleEnabled}
              onCheckedChange={(checked) => {
                setScheduleEnabled(checked)
                if (checked) setScheduleSheetOpen(true)
              }}
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <Select value={backupFilterType} onValueChange={setBackupFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Backup Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automated">Automated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={backupFilterStatus} onValueChange={setBackupFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={backupFilterUser} onValueChange={setBackupFilterUser}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Created by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {creatorOptions.map(p => (
                  <SelectItem key={p.id} value={p.user_id}>
                    {[p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={() => setCreateDialogOpen(true)}
                      disabled={!canCreateBackup()}
                    >
                      Create manual backup
                    </Button>
                  </div>
                </TooltipTrigger>
                {!canCreateBackup() && (
                  <TooltipContent>
                    <p>Backups can be created once each day. You can create another backup after {getNextBackupTime()}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Backups table */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Backup type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Backup date</TableHead>
                  <TableHead>Expires on</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created by</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBackups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No backups yet
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBackups.map(backup => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <Badge variant={backup.type === 'manual' ? 'secondary' : 'outline'}>
                          {backup.type === 'manual' ? 'Manual' : 'Automated'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[backup.status]}`} />
                          <span className="capitalize">{backup.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(backup.backup_date)}</TableCell>
                      <TableCell>{backup.expires_on ? formatDate(backup.expires_on) : '-'}</TableCell>
                      <TableCell>{backup.size || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CrmAvatar
                            firstName={backup.creatorProfile?.first_name}
                            lastName={backup.creatorProfile?.last_name}
                            avatarUrl={backup.creatorProfile?.avatar_url}
                            size="sm"
                          />
                          <span className="text-sm">
                            {backup.creatorProfile
                              ? [backup.creatorProfile.first_name, backup.creatorProfile.last_name].filter(Boolean).join(' ') || 'Unknown'
                              : 'Unknown'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ═══════════════ TAB: RESTORE ═══════════════ */}
        <TabsContent value="restore" className="space-y-6">
          {/* Restore cards */}
          <div>
            <h2 className="font-semibold mb-1">Prepare a restore</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose your type of restore to bring values back to a state and we&apos;ll prepare a preview of your restore.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => openRestoreSheet('crm')}
                className="border rounded-lg p-5 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">Restore CRM changes</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Restore actions that happened in your account (created, updated, deleted).
                </p>
              </button>

              <button
                onClick={() => openRestoreSheet('deleted')}
                className="border rounded-lg p-5 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-sm">Restore deleted records</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Restore records you recently deleted from your account, like contacts or companies.
                </p>
              </button>
            </div>
          </div>

          {/* Restore history */}
          <div>
            <h2 className="font-semibold mb-4">Restore History</h2>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-4">
              <Select value={restoreFilterType} onValueChange={setRestoreFilterType}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Restore type" />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="crm_changes">CRM Changes</SelectItem>
                  <SelectItem value="deleted_records">Deleted Records</SelectItem>
                </SelectContent>
              </Select>

              <Select value={restoreFilterStatus} onValueChange={setRestoreFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={restoreFilterDate} onValueChange={setRestoreFilterDate}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All dates</SelectItem>
                </SelectContent>
              </Select>

              <Select value={restoreFilterUser} onValueChange={setRestoreFilterUser}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Requested by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Restore table */}
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Restore ID</TableHead>
                    <TableHead>Restore Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Requested By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRestores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Shield className="w-10 h-10 opacity-30" />
                          <p className="font-medium">No restores</p>
                          <p className="text-xs">You haven&apos;t prepared any restore. Once you do, they&apos;ll appear here.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRestores
                      .slice((restorePage - 1) * RESTORE_PAGE_SIZE, restorePage * RESTORE_PAGE_SIZE)
                      .map(restore => (
                      <TableRow key={restore.id}>
                        <TableCell className="font-mono text-xs">{restore.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {restore.restore_type === 'crm_changes' ? 'CRM Changes' : 'Deleted Records'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[restore.status]}`} />
                            <span className="capitalize">{restore.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDateTime(restore.created_at)}</TableCell>
                        <TableCell>
                          {restore.requesterProfile
                            ? [restore.requesterProfile.first_name, restore.requesterProfile.last_name].filter(Boolean).join(' ') || 'Unknown'
                            : 'Unknown'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4 text-sm mt-4">
              <button
                className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setRestorePage(p => Math.max(1, p - 1))}
                disabled={restorePage === 1}
              >
                &lsaquo; Prev
              </button>
              <span className="text-muted-foreground">Page {restorePage}</span>
              <button
                className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setRestorePage(p => p + 1)}
                disabled={filteredRestores.length <= restorePage * RESTORE_PAGE_SIZE}
              >
                Next &rsaquo;
              </button>
              <span className="text-muted-foreground">{RESTORE_PAGE_SIZE} per page &#9662;</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══════════════ SCHEDULE SHEET ═══════════════ */}
      <Sheet open={scheduleSheetOpen} onOpenChange={setScheduleSheetOpen}>
        <SheetContent className="w-full sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Schedule automated backups</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-6 px-4">
            <div className="bg-primary/10 border border-primary/20 rounded-md p-3 text-sm text-primary dark:text-primary">
              <div className="flex gap-2">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Scheduled backups may take 1-2 days to completely finish. You&apos;ll receive an email if a backup fails.</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Choose how often backups should run</Label>
              <RadioGroup value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly" className="text-sm font-normal">Once a week</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="biweekly" id="biweekly" />
                  <Label htmlFor="biweekly" className="text-sm font-normal">Every two weeks</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Choose which day of the week</Label>
              <Select value={scheduleDay} onValueChange={setScheduleDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {DAYS_OF_WEEK.map(day => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setScheduleSheetOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSchedule}>Save</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ═══════════════ CREATE BACKUP DIALOG ═══════════════ */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a manual backup</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Your backup might take a while to finish if you have a lot of data. You&apos;ll get a notification when your backup is ready to download.
            </p>
            <p className="text-sm text-muted-foreground">
              After it&apos;s ready, you have <span className="font-semibold">14 days</span> to download it before the link expires.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBackup}>Create backup</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ RESTORE CRM CHANGES SHEET ═══════════════ */}
      <Sheet open={restoreSheetOpen && restoreSheetType === 'crm'} onOpenChange={(open) => { if (!open) setRestoreSheetOpen(false) }}>
        <SheetContent className="w-full sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Restore CRM changes</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-6 px-4">
            <div className="bg-primary/10 border border-primary/20 rounded-md p-3 text-sm text-primary dark:text-primary">
              <div className="flex gap-2">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Preparing a restore can take some time. We&apos;ll notify you when your preview is ready. You&apos;ll have 24 hours to review and restore.</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Tell us what you need to restore (within the last 14 days). We&apos;ll run the search and prepare a preview of the changes.
            </p>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Source *</Label>
              <Select value={restoreSource} onValueChange={setRestoreSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  <SelectItem value="crm_changes">CRM Changes</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setRestoreSheetOpen(false)}>Cancel</Button>
            <Button disabled={!canPrepareRestore} onClick={() => setRestoreConfirmOpen(true)}>Prepare preview</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ═══════════════ RESTORE DELETED RECORDS SHEET ═══════════════ */}
      <Sheet open={restoreSheetOpen && restoreSheetType === 'deleted'} onOpenChange={(open) => { if (!open) setRestoreSheetOpen(false) }}>
        <SheetContent className="w-full sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Restore deleted records</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-6 px-4">
            <div className="bg-primary/10 border border-primary/20 rounded-md p-3 text-sm text-primary dark:text-primary">
              <div className="flex gap-2">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Preparing a restore can take some time. We&apos;ll notify you when your preview is ready. You&apos;ll have 24 hours to review and restore.</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Tell us what you need to restore (within the last 14 days). We&apos;ll run the search and prepare a preview of the changes.
            </p>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Objects *</Label>
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setObjectsDropdownOpen(!objectsDropdownOpen) }}
                  className="w-full border rounded-md px-3 py-2 text-sm flex justify-between items-center bg-background text-foreground border-border"
                >
                  <span className={restoreObjects.length === 0 ? 'text-muted-foreground' : ''}>
                    {restoreObjects.length === 0 ? 'Select objects' : `${restoreObjects.length} selected`}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {objectsDropdownOpen && (
                  <div onClick={(e) => e.stopPropagation()} className="absolute z-50 w-full border rounded-md bg-background shadow-md mt-1">
                    <div className="p-2 border-b">
                      <input
                        autoFocus
                        placeholder="Search"
                        value={objectsSearch}
                        onChange={e => setObjectsSearch(e.target.value)}
                        className="w-full outline-none text-sm px-3 py-1.5 border rounded-md bg-background text-foreground"
                      />
                    </div>
                    <div className="p-2 border-b">
                      <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted px-2 py-1 rounded">
                        <input
                          type="checkbox"
                          checked={restoreObjects.length === RESTORE_OBJECTS.length}
                          onChange={() => {
                            if (restoreObjects.length === RESTORE_OBJECTS.length) {
                              setRestoreObjects([])
                            } else {
                              setRestoreObjects([...RESTORE_OBJECTS])
                            }
                          }}
                          className="rounded"
                        />
                        Select all
                      </label>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {RESTORE_OBJECTS
                        .filter(obj => obj.toLowerCase().includes(objectsSearch.toLowerCase()))
                        .map(obj => (
                          <label
                            key={obj}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={restoreObjects.includes(obj)}
                              onChange={() => {
                                setRestoreObjects(prev =>
                                  prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj]
                                )
                              }}
                              className="rounded"
                            />
                            {obj}
                          </label>
                        ))}
                    </div>
                    <div className="p-2 border-t">
                      <button
                        onClick={() => { setRestoreObjects([]); setObjectsSearch(''); setObjectsDropdownOpen(false) }}
                        className="text-sm text-primary hover:underline w-full text-left px-2 py-1"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Changed by</Label>
              <Select value={restoreChangedBy} onValueChange={setRestoreChangedBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user">
                    {restoreChangedBy && workspaceMembers.find(m => m.id === restoreChangedBy)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {workspaceMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex flex-col -my-0.5">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-[11px] text-muted-foreground leading-tight">{member.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Start date *</Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={restoreStartDate}
                  onChange={e => setRestoreStartDate(e.target.value)}
                  className="flex-1"
                />
                <Select value={restoreStartTime} onValueChange={setRestoreStartTime}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Select a time (optional)" />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="none">None</SelectItem>
                    {Array.from({ length: 24 }, (_, i) => {
                      const h = i.toString().padStart(2, '0')
                      return (
                        <React.Fragment key={h}>
                          <SelectItem value={`${h}:00`}>{h}:00</SelectItem>
                          <SelectItem value={`${h}:30`}>{h}:30</SelectItem>
                        </React.Fragment>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!showEndDate ? (
              <button
                onClick={() => setShowEndDate(true)}
                className="text-sm text-primary hover:underline"
              >
                + Add end date
              </button>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm font-medium">End date</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={restoreEndDate}
                    onChange={e => setRestoreEndDate(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={restoreEndTime} onValueChange={setRestoreEndTime}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Select a time (optional)" />
                    </SelectTrigger>
                    <SelectContent className="z-[200]">
                      <SelectItem value="none">None</SelectItem>
                      {Array.from({ length: 24 }, (_, i) => {
                        const h = i.toString().padStart(2, '0')
                        return (
                          <React.Fragment key={h}>
                            <SelectItem value={`${h}:00`}>{h}:00</SelectItem>
                            <SelectItem value={`${h}:30`}>{h}:30</SelectItem>
                          </React.Fragment>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setRestoreObjects([])
                setRestoreChangedBy('')
                setRestoreStartDate('')
                setRestoreStartTime('none')
                setRestoreEndDate('')
                setRestoreEndTime('none')
                setShowEndDate(false)
              }}
              className="text-sm text-primary hover:underline"
            >
              Clear all filters
            </button>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setRestoreSheetOpen(false)}>Cancel</Button>
            <Button disabled={!canPrepareRestore} onClick={() => setRestoreConfirmOpen(true)}>Prepare preview</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ═══════════════ RESTORE CONFIRMATION DIALOG ═══════════════ */}
      <Dialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restore from backup?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              This will prepare a preview of changes to review before restoring.
              You&apos;ll have 24 hours to review and finalize the restore.
            </p>
            <p className="text-sm font-medium text-foreground">
              This action cannot be undone once finalized.
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setRestoreConfirmOpen(false)}>Cancel</Button>
            <Button onClick={() => { setRestoreConfirmOpen(false); handlePrepareRestore() }}>Yes, prepare preview</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
