"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink, RefreshCw, Copy, Download, ChevronDown, MoreHorizontal, Search } from 'lucide-react';
import { toast } from 'sonner';
import { laravelApi } from '@/lib/laravel-api';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AuditLog {
  id: string
  category: string
  subcategory: string | null
  action: string
  modified_by_name: string | null
  modified_by_email: string | null
  modified_by_avatar: string | null
  assisted_by: string | null
  source: string | null
  source_url: string | null
  date_of_change: string
}

const TABS = ['All Logs', 'Login History', 'Security Activity'] as const
type Tab = typeof TABS[number]

const CATEGORIES = ['All', 'Crm Record View', 'Login', 'Security', 'Settings', 'Deal', 'Contact', 'Company', 'Task']
const SUBCATEGORIES = ['All', 'Contact', 'Login Succeeded', 'Login Failed', 'Deal', 'Company', 'Task', 'Setting']
const ACTIONS = ['All', 'Update', 'Create', 'Delete', 'Perform', 'View', 'Export']
const MODIFIED_BY = ['All', 'Anyone', 'Me']
const ASSISTED_BY = ['All', 'None', 'Assist Bot']
const DATE_RANGES = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Last 365 days']

const AVATAR_COLORS = ['#0091AE', '#FF7A59', '#F5A623', '#7C98B6', '#2E7D32', '#D12B3C', '#6B5B9E', '#E87C3E']

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

function getDateRange(dateRange: string): Date {
  const now = new Date()
  switch (dateRange) {
    case 'Last 7 days': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case 'Last 30 days': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case 'Last 90 days': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case 'Last 365 days': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
}

export default function AuditLogPage() {
  const { workspaceId } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('All Logs')
  const [category, setCategory] = useState('All')
  const [subcategory, setSubcategory] = useState('All')
  const [action, setAction] = useState('All')
  const [modifiedBy, setModifiedBy] = useState('All')
  const [assistedBy, setAssistedBy] = useState('All')
  const [dateRange, setDateRange] = useState('Last 30 days')

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const PAGE_SIZE = 50

  const fetchLogs = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    try {
      const params: Record<string, string | number> = {
        workspace_id: workspaceId,
        date_from: getDateRange(dateRange).toISOString(),
        page: page + 1,
        page_size: PAGE_SIZE,
      }
      if (category !== 'All') params.category = category
      if (subcategory !== 'All') params.subcategory = subcategory
      if (action !== 'All') params.action = action
      if (modifiedBy === 'Me') params.modified_by_me = 'true'
      if (assistedBy === 'None') params.has_assisted_by = 'false'
      else if (assistedBy === 'Assist Bot') params.has_assisted_by = 'true'
      if (activeTab === 'Login History') params.tab_category = 'Login'
      else if (activeTab === 'Security Activity') params.tab_category = 'Security'

      const { data, error } = await laravelApi.get<{ logs: AuditLog[]; total: number }>('/audit-log', params)

      if (error) throw new Error(error)
      setLogs(data?.logs || [])
      setTotalCount(data?.total ?? 0)
    } catch (err: unknown) {
      toast.error('Failed to load audit logs')
      // Expected in standalone mode
    } finally {
      setLoading(false)
    }
  }, [workspaceId, activeTab, category, subcategory, action, modifiedBy, assistedBy, dateRange, page])

  useEffect(() => {
    setPage(0)
  }, [activeTab, category, subcategory, action, modifiedBy, assistedBy, dateRange])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleCopy = async () => {
    const text = JSON.stringify(logs, null, 2)
    await navigator.clipboard.writeText(text)
    toast.success('Logs copied to clipboard')
  }

  const handleExport = () => {
    const csv = [
      ['Category', 'Subcategory', 'Action', 'Modified By', 'Date', 'Source'].join(','),
      ...logs.map(l => [
        l.category, l.subcategory || '', l.action,
        l.modified_by_name || '', formatDate(l.date_of_change), l.source || '',
      ].map(v => `"${v}"`).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Audit log exported')
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          View user actions taken in your account over the last 365 days.
        </p>
      </div>

      {/* Segmented Tabs + Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-muted/50 border border-border rounded-md p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[13px] font-semibold rounded-xs transition-all ${
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={fetchLogs} className="h-8 w-8">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8">
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleExport} className="h-8 w-8">
                  <Download className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-[13px] text-muted-foreground font-semibold gap-1">
                More <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => toast.success('Report generated')}>
                Generate report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success('Filter saved')}>
                Save filter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success('Subscribed')}>
                Subscribe to alerts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 border-border text-[12px] text-foreground gap-1">
              Category: {category} <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {CATEGORIES.map(c => (
              <DropdownMenuItem key={c} onClick={() => setCategory(c)}>{c}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 border-border text-[12px] text-foreground gap-1">
              Subcategory: {subcategory} <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {SUBCATEGORIES.map(s => (
              <DropdownMenuItem key={s} onClick={() => setSubcategory(s)}>{s}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 border-border text-[12px] text-foreground gap-1">
              Action: {action} <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {ACTIONS.map(a => (
              <DropdownMenuItem key={a} onClick={() => setAction(a)}>{a}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 border-border text-[12px] text-foreground gap-1">
              Modified by: {modifiedBy} <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {MODIFIED_BY.map(m => (
              <DropdownMenuItem key={m} onClick={() => setModifiedBy(m)}>{m}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 border-border text-[12px] text-foreground gap-1">
              Assisted by: {assistedBy} <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {ASSISTED_BY.map(a => (
              <DropdownMenuItem key={a} onClick={() => setAssistedBy(a)}>{a}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 border-border text-[12px] text-foreground gap-1">
              Date: {dateRange} <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {DATE_RANGES.map(d => (
              <DropdownMenuItem key={d} onClick={() => setDateRange(d)}>{d}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" className="h-8 border-border text-[12px] text-primary font-bold ml-auto">
          Export report
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-background border border-border rounded-xs p-12 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 border-2 border-border border-t-primary rounded-full animate-spin" />
            <span className="text-[13px]">Loading audit logs...</span>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-background border border-border rounded-xs p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-border" />
          </div>
          <h3 className="text-[15px] font-bold text-foreground mb-1">No audit logs found</h3>
          <p className="text-[13px] text-muted-foreground max-w-sm">
            No events match your current filters. Try adjusting the date range or clearing filters.
          </p>
        </div>
      ) : (
        <div className="bg-background border border-border rounded-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-[var(--table-header-bg)]/75 backdrop-blur-sm">
              <TableRow className="border-b border-border">
                <TableHead className="text-[11px] font-bold text-foreground uppercase tracking-wider px-4 py-3">
                  Category
                </TableHead>
                <TableHead className="text-[11px] font-bold text-foreground uppercase tracking-wider px-4 py-3">
                  <span className="flex items-center gap-1">
                    Subcategory
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex cursor-help">
                            <svg viewBox="0 0 24 24" className="h-3 w-3 text-muted-foreground/60" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Subcategory classification</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </TableHead>
                <TableHead className="text-[11px] font-bold text-foreground uppercase tracking-wider px-4 py-3">
                  Action
                </TableHead>
                <TableHead className="text-[11px] font-bold text-foreground uppercase tracking-wider px-4 py-3">
                  Modified by
                </TableHead>
                <TableHead className="text-[11px] font-bold text-foreground uppercase tracking-wider px-4 py-3">
                  Date of change
                  <span className="text-primary ml-1">↓</span>
                </TableHead>
                <TableHead className="text-[11px] font-bold text-foreground uppercase tracking-wider px-4 py-3">
                  <span className="flex items-center gap-1">
                    Source
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex cursor-help">
                            <svg viewBox="0 0 24 24" className="h-3 w-3 text-muted-foreground/60" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Source of the action</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="border-b border-border last:border-b-0 hover:bg-accent">
                  <TableCell className="px-4 py-4 text-[13px] text-foreground">
                    {log.category}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-[13px] text-foreground">
                    {log.subcategory || '—'}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-[13px] text-foreground">
                    {log.action}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-primary-foreground text-[11px] font-bold flex-none"
                        style={{ backgroundColor: getAvatarColor(log.modified_by_name || log.modified_by_email || '?') }}
                      >
                        {getInitials(log.modified_by_name)}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-primary">
                          {log.modified_by_name || 'Unknown'}
                        </div>
                        {log.modified_by_email && (
                          <div className="text-[11px] text-muted-foreground">{log.modified_by_email}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-[13px] text-foreground whitespace-nowrap">
                    {formatDate(log.date_of_change)}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    {log.source_url ? (
                      <a
                        href={log.source_url}
                        className="text-primary text-[13px] font-bold hover:underline inline-flex items-center gap-1"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {log.source || 'Link'} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">{log.source || '—'}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 text-[13px] text-muted-foreground">
          <span>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px]"
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[12px]"
              disabled={(page + 1) * PAGE_SIZE >= totalCount}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
