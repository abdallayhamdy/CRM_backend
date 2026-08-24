"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { usePanelCards } from "@/hooks/use-panel-cards"
import { CrmDetailLayout, CrmDetailLeftPanel, CrmDetailCenterPanel, CrmDetailRightPanel } from "@/components/crm/CrmDetailLayout"
import { Avatar } from "@/components/crm/Avatar"
import { ticketsService } from "@/services/tickets"
import { activitiesService } from "@/services/activities"
import { notesService } from "@/services/notes"
import { Ticket } from "@/lib/types/crm"
import { logAudit } from "@/lib/audit"
import { DetailPageSkeleton } from "@/components/crm/Skeletons"
import { Badge } from "@/components/crm/Badge"
import { getBadgeClasses } from "@/lib/badge-colors"
import { toast } from "sonner"
import { exportToCSV } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { authService } from "@/services/auth"
import { Profile } from "@/lib/types/crm"
import { useRealtime } from "@/hooks/use-realtime"
import { ActivityFeedCenterPanel } from "@/components/crm/ActivityFeedCenterPanel"
import { ALL_ACTIVITY_TYPES } from "@/components/activity/ActivityFilterPopover"
import { PropertyHistoryDialog } from "@/components/crm/detail/PropertyHistoryDialog"
import { DeleteConfirmDialog } from "@/components/crm/detail/DeleteConfirmDialog"
import { RecordAccessDialog } from "@/components/crm/detail/RecordAccessDialog"
import { CustomCardsRenderer } from "@/components/crm/detail/CustomCardsRenderer"
import { CustomFieldsDisplay } from "@/components/properties/CustomFieldsDisplay"
import { EditRecordSheet, type EditFieldConfig } from "@/components/properties/EditRecordSheet"
import {
  LifeBuoy, ChevronLeft, ChevronDown, Settings, Search, Plus, Users, Pencil
} from "lucide-react"
import dynamic from "next/dynamic"
const NoteEditorSheet = dynamic(() => import("@/components/activities/NoteEditorSheet").then(m => ({ default: m.NoteEditorSheet })), { ssr: false })
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { workspaceId, loading: authLoading } = useAuth()
  const { isEnabled, customLeftCards, customRightCards, leftAddedIds, ready } = usePanelCards('tickets')
  const activeWorkspace = useAuth().activeWorkspace

  const [ticket, setTicket] = React.useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [currentUser, setCurrentUser] = React.useState<any>(null)
  const [profiles, setProfiles] = React.useState<Profile[]>([])
  const [activities, setActivities] = React.useState<any[]>([])
  const [notes, setNotes] = React.useState<any[]>([])
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>(ALL_ACTIVITY_TYPES)
  const [activeEditor, setActiveEditor] = React.useState<'note' | 'email' | 'task' | 'call' | 'meeting' | 'ticket' | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [timeFilter, setTimeFilter] = React.useState('all')
  const [assignedToFilter, setAssignedToFilter] = React.useState('all')
  const [isCollapsedAll, setIsCollapsedAll] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [propertyHistoryOpen, setPropertyHistoryOpen] = React.useState(false)
  const [summarizeOpen, setSummarizeOpen] = React.useState(false)
  const [recordAccessOpen, setRecordAccessOpen] = React.useState(false)
  const [isNoteSheetOpen, setIsNoteSheetOpen] = React.useState(false)

  const [aboutEditOpen, setAboutEditOpen] = React.useState(false)
  const ticketAboutFields: EditFieldConfig[] = [
    { name: "subject", label: "Subject", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
  ]

  React.useEffect(() => {
    if (!authLoading && !workspaceId) {
      router.replace("/login")
    }
  }, [authLoading, workspaceId, router])

  const fetchData = React.useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const [ticketRes, userRes, profilesRes, activitiesRes, notesRes] = await Promise.all([
        ticketsService.getById(id, workspaceId),
        authService.getCurrentUser(),
        authService.listProfiles(workspaceId),
        activitiesService.getAll({ workspace_id: workspaceId, ticket_id: id }),
        notesService.getAll({ workspace_id: workspaceId, ticket_id: id }),
      ])

      if (ticketRes.error) throw ticketRes.error
      setTicket(ticketRes.data as unknown as Ticket)
      setCurrentUser(userRes.data)
      setProfiles(profilesRes.data || [])
      setActivities(activitiesRes.data || [])
      setNotes(notesRes.data || [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load ticket data")
    } finally {
      setIsLoading(false)
    }
  }, [id, workspaceId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  useRealtime(React.useCallback((_payload: any) => {
    const silentRefresh = async () => {
      if (!workspaceId) return
      try {
        const [ticketRes] = await Promise.all([
          ticketsService.getById(id, workspaceId)
        ])
        if (ticketRes.data) {
          setTicket(ticketRes.data as unknown as Ticket)
        }
      } catch (err) {
        console.error("Silent refresh failed:", err)
      }
    }
    silentRefresh()
  }, [id, workspaceId]))

  const handleDeleteTicket = React.useCallback(() => {
    if (!ticket) return
    setDeleteDialogOpen(true)
  }, [ticket])

  const handleUpdateTicket = React.useCallback(async (data: Partial<Ticket>) => {
    if (!ticket || !workspaceId) return
    try {
      const res = await ticketsService.update(ticket.id, data, workspaceId)
      if (res.error) throw res.error
      setTicket(prev => prev ? { ...prev, ...data } : null)
      toast.success("Ticket updated")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update ticket")
    }
  }, [ticket, workspaceId])

  const execDeleteTicket = React.useCallback(async () => {
    if (!ticket || !workspaceId) return
    try {
      const { error } = await ticketsService.delete(ticket.id, workspaceId)
      if (error) throw error
      if (workspaceId) {
        await logAudit({ workspace_id: workspaceId, action: 'Delete', category: 'Ticket', subcategory: 'Ticket Deleted', source: 'web', modifiedBy: currentUser, recordId: ticket.id, recordType: 'Ticket' })
      }
      toast.success("Ticket deleted")
      router.push("/tickets")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete ticket")
    }
  }, [ticket, router, workspaceId, currentUser])

  const handleExportTicket = React.useCallback(() => {
    if (!ticket) return
    const flat: Record<string, unknown> = {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      owner_id: ticket.owner_id,
      contact_id: ticket.contact_id,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
    }
    exportToCSV([flat], `ticket_${ticket.id}`)
    if (workspaceId) {
      logAudit({ workspace_id: workspaceId, action: 'Export', category: 'Ticket', subcategory: 'Ticket Exported', source: 'web', modifiedBy: currentUser, recordId: ticket.id, recordType: 'Ticket' })
    }
    toast.success("Ticket data exported")
  }, [ticket, workspaceId, currentUser])

  const loadPropertyHistory = React.useCallback(() => {
    setPropertyHistoryOpen(true)
  }, [])

  const combinedFeed = React.useMemo(() => {
    if (!ticket) return []
    const notesItems = notes.map(n => ({ ...n, feedType: 'note' as const }))
    const activitiesItems = activities.map(a => ({ ...a, feedType: 'activity' as const }))

    let all = [...notesItems, ...activitiesItems].sort((a, b) => {
      const dateA = new Date(a.created_at || (a as any).due_date).getTime()
      const dateB = new Date(b.created_at || (b as any).due_date).getTime()
      return dateB - dateA
    })

    if (activeTab !== 'all') {
      all = all.filter(item => {
        if (activeTab === 'notes') return item.feedType === 'note'
        if (activeTab === 'tasks') return item.feedType === 'activity' && item.type === 'task'
        if (activeTab === 'emails') return item.feedType === 'activity' && item.type === 'email'
        if (activeTab === 'calls') return item.feedType === 'activity' && item.type === 'call'
        if (activeTab === 'meetings') return item.feedType === 'activity' && item.type === 'meeting'
        return true
      })
    }

    all = all.filter(item => {
      if (item.feedType === 'note') {
        return selectedFilters.includes("Notes")
      }
      const typeMap: Record<string, string> = {
        'call': 'Calls',
        'email': 'Emails',
        'meeting': 'Meetings',
        'task': 'Tasks',
      }
      const label = typeMap[item.type]
      if (label) return selectedFilters.includes(label)
      return false
    })

    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      all = all.filter(item => {
        const content = ('content' in item ? item.content : '') || ''
        const title = ('title' in item ? item.title : '') || ''
        const description = ('description' in item ? item.description : '') || ''
        return content.toLowerCase().includes(lower) ||
          title.toLowerCase().includes(lower) ||
          description.toLowerCase().includes(lower)
      })
    }

    if (timeFilter !== 'all') {
      const now = new Date()
      all = all.filter(item => {
        const itemDate = new Date(item.created_at || (item as any).due_date)
        if (timeFilter === 'today') return itemDate.toDateString() === now.toDateString()
        if (timeFilter === 'yesterday') {
          const y = new Date(now); y.setDate(now.getDate() - 1)
          return itemDate.toDateString() === y.toDateString()
        }
        if (timeFilter === 'this-week') {
          const w = new Date(now); w.setDate(now.getDate() - 7)
          return itemDate >= w
        }
        if (timeFilter === 'this-month') {
          return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
        }
        return true
      })
    }

    if (assignedToFilter !== 'all') {
      all = all.filter(item => {
        const ownerId = ('owner_id' in item ? item.owner_id : null)
        const createdBy = ('created_by' in item ? item.created_by : null)
        return ownerId === assignedToFilter || createdBy === assignedToFilter
      })
    }

    return all
  }, [ticket, selectedFilters, searchTerm, timeFilter, assignedToFilter, activeTab, notes, activities])

  const feedCounts = React.useMemo(() => {
    if (!ticket) return { all: 0, notes: 0, tasks: 0, tickets: 0, calls: 0 }
    const notesItems = notes.map(n => ({ ...n, feedType: 'note' as const }))
    const activitiesItems = activities.map(a => ({ ...a, feedType: 'activity' as const }))
    const all = [...notesItems, ...activitiesItems]
    const notesCount = all.filter(i => i.feedType === 'note').length
    const tasksCount = all.filter(i => i.feedType === 'activity' && i.type === 'task').length
    const ticketsCount = all.filter(i => i.feedType === 'activity' && i.type === 'ticket').length
    const callsCount = all.filter(i => i.feedType === 'activity' && i.type === 'call').length
    return {
      all: notesCount + tasksCount + ticketsCount + callsCount,
      notes: notesCount,
      tasks: tasksCount,
      tickets: ticketsCount,
      calls: callsCount,
    }
  }, [ticket, notes, activities])

  const upcomingTasks = combinedFeed.filter(item =>
    item.feedType === 'activity' && item.type === 'task' && !item.completed
  )

  const historyItems = combinedFeed.filter(item =>
    !(item.feedType === 'activity' && item.type === 'task' && !item.completed)
  )

  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, any[]> = {}
    historyItems.forEach(item => {
      const date = new Date(item.created_at || (item as any).due_date)
      const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
      if (!groups[monthYear]) groups[monthYear] = []
      groups[monthYear].push(item)
    })
    return groups
  }, [historyItems])

  const getAssociations = React.useCallback(() => {
    if (!ticket) return []
    const assocs: { name: string; type: string }[] = []
    assocs.push({ name: ticket.subject, type: 'Ticket' })
    if (ticket.contact) {
      assocs.push({ name: `${ticket.contact.first_name} ${ticket.contact.last_name || ''}`.trim(), type: 'Contact' })
    }
    return assocs
  }, [ticket])

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!ticket) {
    return (
      <CrmDetailLayout backLine="Tickets" backHref="/tickets">
        <div className="w-full flex flex-col items-center justify-center h-full text-muted-foreground">
          <h2 className="text-xl font-bold mb-2 text-foreground">Ticket not found</h2>
          <p>The ticket you are looking for does not exist or has been deleted.</p>
        </div>
      </CrmDetailLayout>
    )
  }

  const ownerName = ticket.owner ? `${ticket.owner.first_name} ${ticket.owner.last_name}` : "Unassigned"

  return (
    <CrmDetailLayout backLine="Tickets" backHref="/tickets">

      {/* LEFT PANEL: Properties */}
      <CrmDetailLeftPanel>

        {/* Profile Card Summary */}
        <div className="bg-background border border-border rounded-md shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link href="/tickets" className="flex items-center text-foreground text-[14px] font-bold">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Tickets
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[14px] font-bold text-foreground flex items-center gap-1 outline-none">
                  Actions <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px] p-1 shadow-lg border-border z-[200]">
                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent"
                  onClick={loadPropertyHistory}
                >
                  View property history
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent"
                  onClick={() => setSummarizeOpen(true)}
                >
                  Summarize record
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent"
                  onClick={() => setRecordAccessOpen(true)}
                >
                  Record access
                </DropdownMenuItem>

                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent"
                  onClick={handleExportTicket}
                >
                  Export to CSV
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem className="text-[14px] text-destructive hover:bg-destructive/10" onClick={handleDeleteTicket}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <div className="flex flex-col mt-1 min-w-0 flex-1">
                <div className="flex items-center gap-1 group min-w-0 w-full">
                  <h1 className="text-[20px] font-bold text-foreground leading-tight truncate">
                    {ticket.subject}
                  </h1>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge className={`capitalize text-[11px] ${getBadgeClasses('ticket_status', ticket.status ?? 'open')}`}>
                    {ticket.status ?? 'open'}
                  </Badge>
                  <Badge className={`capitalize text-[11px] ${getBadgeClasses('ticket_priority', ticket.priority ?? 'medium')}`}>
                    {ticket.priority ?? 'medium'}
                  </Badge>
                </div>
                {ticket.contact && (
                  <div className="flex items-center gap-1.5 mt-2 group min-w-0 w-full">
                    <a href={`mailto:${ticket.contact.email}`} className="text-[14px] font-bold text-primary hover:underline underline-offset-2 truncate">
                      {ticket.contact.email || "--"}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* About this ticket Card */}
        <div className="bg-background border border-border rounded-md shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
              <h3 className="font-bold text-[16px] text-foreground">About this ticket</h3>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAboutEditOpen(true)}
                className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-muted/30 text-muted-foreground"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Subject</label>
              <div className="text-[14px] text-foreground">
                {ticket.subject}
              </div>
            </div>
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Description</label>
              <div className="text-[14px] text-foreground">
                {ticket.description || "--"}
              </div>
            </div>
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Status</label>
              <div className="text-[14px] text-foreground capitalize">
                {ticket.status ?? 'open'}
              </div>
            </div>
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Priority</label>
              <div className="text-[14px] text-foreground capitalize">
                {ticket.priority ?? 'medium'}
              </div>
            </div>
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Ticket owner</label>
              <div className="flex items-center gap-1.5 text-[14px] text-foreground">
                {ticket.owner ? (
                  <Avatar firstName={ticket.owner.first_name} lastName={ticket.owner.last_name} size="sm" />
                ) : null}
                {ownerName}
              </div>
            </div>
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Created</label>
              <div className="text-[14px] text-foreground">
                {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : "--"}
              </div>
            </div>

            <CustomFieldsDisplay objectType="ticket" values={ticket.custom_fields || {}} />
          </div>
        </div>

        <CustomCardsRenderer cards={customLeftCards} addedIds={leftAddedIds} basePath={`/tickets/${id}/settings`} ready={ready} side="left" />

      </CrmDetailLeftPanel>

      {/* CENTER PANEL: Activity & Feed */}
      <CrmDetailCenterPanel>
        <ActivityFeedCenterPanel
          entityType="ticket"
          entityId={id}
          workspaceId={ticket?.workspace_id ?? undefined}
          profiles={profiles}
          currentUser={currentUser}
          showTabs={['notes', 'tasks', 'tickets']}
          showFilterTabs={['all', 'notes', 'tasks', 'tickets', 'calls']}
          feedItems={combinedFeed}
          feedCounts={feedCounts}
          upcomingTasks={upcomingTasks}
          groupedHistory={groupedHistory}
          activeEditor={activeEditor}
          setActiveEditor={setActiveEditor}
          isCollapsedAll={isCollapsedAll}
          setIsCollapsedAll={setIsCollapsedAll}
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          onRefresh={fetchData}
          getAssociations={getAssociations}
        />
      </CrmDetailCenterPanel>

      {/* RIGHT PANEL: Associated Objects */}
      <CrmDetailRightPanel>
        {isEnabled("notes") && (
          <div className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                <h3 className="font-bold text-[14px] text-foreground">Notes ({notes.length || 0})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNoteSheetOpen(true)}
                  className="text-[14px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
                <button
                  onClick={() => router.push(`/tickets/${id}/settings`)}
                  className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-muted/30 text-muted-foreground transition-colors shrink-0"
                  title="Customize right panel"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {notes && notes.length > 0 ? (
              <div className="p-4 space-y-2">
                {notes.slice(0, 10).map((note: any) => (
                  <div key={note.id} className="p-3 bg-background border border-border rounded shadow-sm hover:shadow transition-shadow">
                    <p className="text-[13px] text-foreground line-clamp-2">{note.content}</p>
                    <span className="text-[11px] text-muted-foreground mt-1 block">
                      {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center text-center">
                <p className="text-[13px] text-muted-foreground">No notes found.</p>
                <button
                  onClick={() => setIsNoteSheetOpen(true)}
                  className="mt-3 text-[13px] font-bold text-primary hover:underline"
                >
                  + Create a note
                </button>
              </div>
            )}
          </div>
        )}

        {isEnabled("contacts") && (
          <div className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                <h3 className="font-bold text-[14px] text-foreground">Contacts ({ticket.contact ? 1 : 0})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/tickets/${id}/settings`)}
                  className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-muted/30 text-muted-foreground transition-colors shrink-0"
                  title="Customize right panel"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {ticket.contact ? (
              <div className="p-4">
                <div className="p-3 bg-background border border-border rounded shadow-sm hover:shadow transition-shadow">
                  <span
                    className="text-[14px] font-bold text-primary hover:underline cursor-pointer block"
                    onClick={() => router.push(`/contacts/${ticket.contact?.id}`)}
                  >
                    {ticket.contact.first_name} {ticket.contact.last_name || ''}
                  </span>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{ticket.contact.email || "No email"}</p>
                </div>
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 relative">
                  <Search className="w-8 h-8 text-border" />
                  <div className="absolute top-0 right-0 w-6 h-6 bg-background border border-border rounded flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[200px]">
                  No contacts associated.
                </p>
              </div>
            )}
          </div>
        )}

        {isEnabled("deals") && (
          <div className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                <h3 className="font-bold text-[14px] text-foreground">Deals (0)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/tickets/${id}/settings`)}
                  className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-muted/30 text-muted-foreground transition-colors shrink-0"
                  title="Customize right panel"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="p-6 flex flex-col items-center text-center">
              <p className="text-[13px] text-muted-foreground">No deals associated.</p>
            </div>
          </div>
        )}

        {isEnabled("companies") && (
          <div className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                <h3 className="font-bold text-[14px] text-foreground">Companies (0)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/tickets/${id}/settings`)}
                  className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-muted/30 text-muted-foreground transition-colors shrink-0"
                  title="Customize right panel"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="p-6 flex flex-col items-center text-center">
              <p className="text-[13px] text-muted-foreground">No companies associated.</p>
            </div>
          </div>
        )}

        <CustomCardsRenderer cards={customRightCards} addedIds={[]} basePath={`/tickets/${id}/settings`} ready={ready} side="right" />
      </CrmDetailRightPanel>

      {/* Activity Editor Sheets */}
      <NoteEditorSheet
        open={isNoteSheetOpen}
        onClose={() => setIsNoteSheetOpen(false)}
        onSaved={fetchData}
        entityType="ticket"
        entityId={id}
        workspaceId={workspaceId}
      />

      <EditRecordSheet
        open={aboutEditOpen}
        onOpenChange={setAboutEditOpen}
        objectType="ticket"
        title="Ticket"
        fields={ticketAboutFields}
        initialValues={ticket || {}}
        onSave={handleUpdateTicket}
      />

      <PropertyHistoryDialog
        open={propertyHistoryOpen}
        onOpenChange={setPropertyHistoryOpen}
        entityType="ticket"
        entityId={id}
        entityLabel="ticket"
        entityTitle={ticket?.subject || ""}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityLabel="ticket"
        entityDisplayName={ticket?.subject || 'this ticket'}
        onConfirm={execDeleteTicket}
      />

      {/* Summarize dialog */}
      <Dialog open={summarizeOpen} onOpenChange={setSummarizeOpen}>
        <DialogContent className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Ticket summary</DialogTitle>
            <DialogDescription>Auto-generated from this ticket&apos;s current data.</DialogDescription>
          </DialogHeader>
          {ticket && (
            <div className="space-y-3 text-[14px]">
              <p className="font-medium text-foreground">{ticket.subject}</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Status: {ticket.status || 'open'}</li>
                <li>Priority: {ticket.priority || 'medium'}</li>
                {ticket.contact && <li>Contact: {ticket.contact.first_name} {ticket.contact.last_name || ''}</li>}
                <li>Created: {new Date(ticket.created_at).toLocaleDateString()}</li>
              </ul>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSummarizeOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RecordAccessDialog
        open={recordAccessOpen}
        onOpenChange={setRecordAccessOpen}
        entityLabel="ticket"
        workspaceName={activeWorkspace?.name}
        memberCount={profiles.length}
      />
    </CrmDetailLayout>
  )
}
