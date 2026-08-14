"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import {
  AlignLeft, CheckSquare, Mail, Phone, Calendar,
  ChevronDown, FileText, RefreshCw, Repeat, Ticket
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import DateTimePicker from "@/components/ui/date-time-picker"
import { ActivityTaskCard } from "@/components/activity/ActivityTaskCard"
import { ActivityLogCard } from "@/components/activity/ActivityLogCard"
import { ActivityTicketCard } from "@/components/activity/ActivityTicketCard"
import { ALL_ACTIVITY_TYPES } from "@/components/activity/ActivityFilterPopover"
import { activitiesService } from "@/services/activities"
import { ticketsService } from "@/services/tickets"
import { notesService } from "@/services/notes"
import { tasksService } from "@/services/tasks"
import { toast } from "sonner"
import type { Profile } from "@/lib/types/crm"

const DynamicTiptapEditor = dynamic(
  () => import("@/components/ui/tiptap-editor").then(mod => ({ default: mod.TiptapEditor })),
  { ssr: false }
)

export type EditorType = 'note' | 'email' | 'task' | 'call' | 'meeting' | 'ticket' | null

export interface FeedItem {
  id: string
  feedType: 'note' | 'activity'
  type?: string | null
  content?: string | null
  title?: string | null
  description?: string | null
  created_at?: string | null
  due_date?: string | null
  completed?: boolean | null
  author?: { first_name?: string; last_name?: string }
  owner?: { first_name?: string; last_name?: string }
  task_subtype?: string
  task_priority?: string
  task_queue?: string
  task_reminder?: string
  task_repeat?: boolean
  call_direction?: string
  call_duration?: string
  call_outcome?: string
  assigned_to?: string
  status?: string
  priority?: string
  category?: string
  subject?: string
  workspace_id?: string | null
  contact_id?: string | null
  company_id?: string | null
  deal_id?: string | null
  ticket_id?: string | null
  created_by?: string | null
}

export interface FeedCounts {
  all: number
  notes: number
  tasks: number
  tickets?: number
  calls: number
}

export interface ActivityFeedCenterPanelProps {
  /** Entity type for creating activities */
  entityType: 'contact' | 'company' | 'ticket' | 'deal' | 'document' | 'order'
  /** Entity ID */
  entityId: string
  /** Entity workspace_id */
  workspaceId?: string
  /** Profiles list for assignee selection */
  profiles: Profile[]
  /** Current user for default assignee */
  currentUser?: any
  /** Which tabs to show in the tab bar */
  showTabs?: Array<'notes' | 'tasks' | 'tickets'>
  /** Which filter tabs to show in history */
  showFilterTabs?: Array<'all' | 'notes' | 'tasks' | 'tickets' | 'calls'>
  /** Feed data */
  feedItems: FeedItem[]
  /** Feed counts for filter tabs */
  feedCounts: FeedCounts
  /** Upcoming tasks for Focus section */
  upcomingTasks: FeedItem[]
  /** Grouped history items */
  groupedHistory: Record<string, FeedItem[]>
  /** Active editor state */
  activeEditor: EditorType
  /** Set active editor state */
  setActiveEditor: (editor: EditorType) => void
  /** Collapse all state */
  isCollapsedAll: boolean
  /** Set collapse all state */
  setIsCollapsedAll: (v: boolean | ((prev: boolean) => boolean)) => void
  /** Selected filters state */
  selectedFilters: string[]
  /** Set selected filters state */
  setSelectedFilters: (filters: string[]) => void
  /** Callback to refresh data after creating an activity */
  onRefresh: () => void
  /** Callback to get associations for activity cards */
  getAssociations: () => any[]
}

export function ActivityFeedCenterPanel({
  entityType,
  entityId,
  workspaceId,
  profiles,
  currentUser,
  showTabs = ['notes', 'tasks', 'tickets'],
  showFilterTabs = ['all', 'notes', 'tasks', 'tickets', 'calls'],
  feedItems,
  feedCounts,
  upcomingTasks,
  groupedHistory,
  activeEditor,
  setActiveEditor,
  isCollapsedAll,
  setIsCollapsedAll,
  selectedFilters,
  setSelectedFilters,
  onRefresh,
  getAssociations,
}: ActivityFeedCenterPanelProps) {
  const entityIdKey = `${entityType}_id`

  const TAB_CONFIG = {
    notes: { id: 'note', label: 'Notes', icon: AlignLeft },
    tasks: { id: 'task', label: 'Tasks', icon: CheckSquare },
    tickets: { id: 'ticket', label: 'Tickets', icon: Ticket },
  }

  const FILTER_TAB_CONFIG = {
    all: { id: 'all', label: `All (${feedCounts.all})` },
    notes: { id: 'notes', label: `Notes (${feedCounts.notes})` },
    tasks: { id: 'tasks', label: `Tasks (${feedCounts.tasks})` },
    tickets: { id: 'tickets', label: `Tickets (${feedCounts.tickets || 0})` },
    calls: { id: 'calls', label: `Calls (${feedCounts.calls})` },
  }

  const handleFilterTabClick = (tabId: string) => {
    if (tabId === 'all') {
      setSelectedFilters(ALL_ACTIVITY_TYPES)
    } else if (tabId === 'notes') {
      setSelectedFilters(['Notes'])
    } else if (tabId === 'tasks') {
      setSelectedFilters(['Tasks'])
    } else if (tabId === 'tickets') {
      setSelectedFilters(['Tickets'])
    } else if (tabId === 'calls') {
      setSelectedFilters(['Calls'])
    }
  }

  const isFilterTabActive = (tabId: string) => {
    if (tabId === 'all') return selectedFilters.length === ALL_ACTIVITY_TYPES.length
    if (tabId === 'notes') return selectedFilters.length === 1 && selectedFilters[0] === 'Notes'
    if (tabId === 'tasks') return selectedFilters.length === 1 && selectedFilters[0] === 'Tasks'
    if (tabId === 'tickets') return selectedFilters.length === 1 && selectedFilters[0] === 'Tickets'
    if (tabId === 'calls') return selectedFilters.length === 1 && selectedFilters[0] === 'Calls'
    return false
  }

  const historyItems = feedItems.filter(item =>
    !(item.feedType === 'activity' && item.type === 'task' && !item.completed)
  )

  return (
    <>
      {/* Tab Bar */}
      <div className="bg-background border-b border-border">
        <div className="px-6 flex items-center gap-1">
          {showTabs.map((tabId) => {
            const tab = TAB_CONFIG[tabId]
            if (!tab) return null
            return (
              <button
                key={tab.id}
                onClick={() => setActiveEditor(tab.id as EditorType)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-[14px] font-medium transition-all relative border-b-2",
                  activeEditor === tab.id
                    ? "text-foreground border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
                )}
              >
                <tab.icon className="w-4 h-4" strokeWidth={1.5} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Activity Input / Inline Editor */}
      <div className="bg-background border-b border-border px-6 py-3">
        {activeEditor ? (
          <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
            {/* Inline Note Editor */}
            {activeEditor === 'note' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[14px] font-semibold text-foreground">New Note</span>
                  </div>
                  <button onClick={() => setActiveEditor(null)} className="text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
                </div>
                <DynamicTiptapEditor
                  content=""
                  onChange={(html) => (window as any).__noteContent = html}
                  placeholder="Write your note..."
                  toolbarVariant="note"
                  minHeight="120px"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted-foreground">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " at " + new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                  <button
                    onClick={async () => {
                      const content = (window as any).__noteContent
                      if (!content?.trim()) return
                      const { sanitizeRichText } = await import("@/components/ui/tiptap-editor")
                      const html = sanitizeRichText(content)
                      const { error } = await notesService.create({
                        content: html,
                        notable_type: entityType,
                        notable_id: entityId,
                      })
                      if (error) throw error
                      ;(window as any).__noteContent = ""
                      setActiveEditor(null)
                      onRefresh()
                      toast.success("Note created")
                    }}
                    className="px-4 py-1.5 text-[13px] font-semibold bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                  >
                    Create note
                  </button>
                </div>
              </div>
            )}

            {/* Inline Task Editor */}
            {activeEditor === 'task' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[14px] font-semibold text-foreground">New Task</span>
                  </div>
                  <button onClick={() => setActiveEditor(null)} className="text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
                </div>
                <input
                  type="text"
                  placeholder="Task title"
                  className="w-full px-3 py-2 text-[14px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
                  onChange={(e) => (window as any).__taskTitle = e.target.value}
                />
                <div className="grid grid-cols-4 gap-6 mb-6 pb-4 border-b border-border">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-muted-foreground block">Task type</label>
                    <Select defaultValue="to_do" onValueChange={(v) => (window as any).__taskType = v}>
                      <SelectTrigger className="h-10 w-full bg-muted/50">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        <SelectItem value="to_do">To-do</SelectItem>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="follow_up">Follow up</SelectItem>
                        <SelectItem value="follow_up_after_meeting">Follow up after meeting</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="message">Message</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-muted-foreground block">Priority</label>
                    <Select defaultValue="none" onValueChange={(v) => (window as any).__taskPriority = v}>
                      <SelectTrigger className="h-10 w-full bg-muted/50">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-muted-foreground block">Queue</label>
                    <Select defaultValue="none" onValueChange={(v) => (window as any).__taskQueue = v}>
                      <SelectTrigger className="h-10 w-full bg-muted/50">
                        <SelectValue placeholder="Select queue" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-muted-foreground block">Assigned to</label>
                    <Select defaultValue="" onValueChange={(v) => (window as any).__taskAssignee = v}>
                      <SelectTrigger className="h-10 w-full bg-muted/50">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4}>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-6 pb-4 border-b border-border">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-muted-foreground block">Due date</label>
                    <DateTimePicker
                      value={(window as any).__taskDueDate || ""}
                      onChange={(val) => {
                        const parts = val.split(" ")
                        const dateStr = parts[0]
                        const timeStr = parts.slice(1).join(" ")
                        ;(window as any).__taskDueDate = dateStr
                        ;(window as any).__taskDueTime = timeStr
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-muted-foreground block">Reminder</label>
                    <DateTimePicker
                      value={(window as any).__taskReminder || ""}
                      onChange={(val) => (window as any).__taskReminder = val}
                      placeholder="No reminder"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 mb-6">
                  <label className="text-[12px] font-medium text-muted-foreground block">Task notes</label>
                  <div className="border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all rounded-lg overflow-hidden bg-background shadow-sm">
                    <DynamicTiptapEditor
                      content=""
                      onChange={(html) => (window as any).__taskNotes = html}
                      placeholder="Start typing to add notes..."
                      toolbarVariant="task"
                      minHeight="120px"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={async () => {
                      const title = (window as any).__taskTitle
                      if (!title?.trim()) return
                      const dueDate = (window as any).__taskDueDate
                      const dueTime = (window as any).__taskDueTime || "08:00 AM"
                      let dueDateStr = dueDate
                      if (!dueDate) {
                        const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
                        dueDateStr = d.toISOString().split("T")[0]
                      }
                      const dueDateTime = dueDateStr ? `${dueDateStr}T${dueTime}:00` : undefined
                      const { error } = await tasksService.create({
                        title,
                        description: (window as any).__taskNotes || "",
                        assigned_to: (window as any).__taskAssignee === "unassigned" ? null : ((window as any).__taskAssignee || currentUser?.id),
                        due_date: dueDateTime,
                        status: "pending",
                        taskable_type: entityType,
                        taskable_id: entityId,
                      })
                      if (error) throw error
                      setActiveEditor(null)
                      ;(window as any).__taskTitle = ""
                      ;(window as any).__taskNotes = ""
                      ;(window as any).__taskDueDate = ""
                      ;(window as any).__taskDueTime = ""
                      ;(window as any).__taskReminder = ""
                      onRefresh()
                      toast.success("Task created")
                    }}
                    className="h-8 px-4 text-[13px] bg-primary hover:bg-primary text-primary-foreground rounded"
                  >
                    Save
                  </Button>
                  <button
                    onClick={() => setActiveEditor(null)}
                    className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Inline Ticket Editor */}
            {activeEditor === 'ticket' && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[14px] font-semibold text-foreground">New Ticket</span>
                  </div>
                  <button onClick={() => setActiveEditor(null)} className="text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
                </div>
                <input
                  type="text"
                  placeholder="Ticket title"
                  className="w-full px-3 py-2 text-[14px] border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
                  onChange={(e) => (window as any).__ticketTitle = e.target.value}
                />
                <div className="grid grid-cols-3 gap-3">
                  <Select defaultValue="None" onValueChange={(v) => (window as any).__ticketPriority = v}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Priority" /></SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="open" onValueChange={(v) => (window as any).__ticketStatus = v}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="" onValueChange={(v) => (window as any).__ticketAssignee = v}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Assignee" /></SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <DynamicTiptapEditor
                  content=""
                  onChange={(html) => (window as any).__ticketDescription = html}
                  placeholder="Description..."
                  toolbarVariant="note"
                  minHeight="80px"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-muted-foreground">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <button
                    onClick={async () => {
                      const title = (window as any).__ticketTitle
                      if (!title?.trim()) return
                      await ticketsService.create({
                        title,
                        description: (window as any).__ticketDescription || "",
                        priority: (window as any).__ticketPriority || "None",
                        status: (window as any).__ticketStatus || "open",
                        owner_id: (window as any).__ticketAssignee || currentUser?.id,
                        [entityIdKey]: entityId,
                        workspace_id: workspaceId,
                      } as any)
                      setActiveEditor(null)
                      onRefresh()
                      toast.success("Ticket created")
                    }}
                    className="px-4 py-1.5 text-[13px] font-semibold bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                  >
                    Create ticket
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className="w-full px-4 py-2.5 text-[14px] text-muted-foreground bg-muted/50 border border-border rounded-md cursor-pointer hover:bg-muted transition-colors"
            onClick={() => setActiveEditor('note')}
          >
            Click here to add an activity...
          </div>
        )}
      </div>

      <div className="bg-muted/50 p-5 min-h-full">
        {/* Focus Section */}
        {upcomingTasks.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ChevronDown className="w-4 h-4 text-foreground" />
                <h3 className="text-[16px] font-bold text-foreground">Focus</h3>
              </div>
              <button
                onClick={() => setIsCollapsedAll(prev => !prev)}
                className="flex items-center gap-2 text-[14px] text-muted-foreground"
              >
                <span>Expand all items</span>
                <div className={cn(
                  "w-9 h-5 rounded-full transition-colors relative",
                  isCollapsedAll ? "bg-border" : "bg-primary"
                )}>
                  <div className={cn(
                    "w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform",
                    isCollapsedAll ? "left-0.5" : "left-[18px]"
                  )} />
                </div>
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {upcomingTasks.map((task: any) => (
                <ActivityTaskCard
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  description={task.description || ''}
                  assignedTo={task.owner?.first_name ? `${task.owner.first_name} ${task.owner.last_name || ""}` : "Unassigned"}
                  dueDate={task.due_date}
                  dueTime={new Date(task.due_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  isExpanded={!isCollapsedAll}
                  associations={getAssociations()}
                  onSuccess={onRefresh}
                  initialTaskSubtype={task.task_subtype || 'To-do'}
                  initialPriority={task.task_priority || 'None'}
                  initialQueue={task.task_queue || 'None'}
                  initialReminder={task.task_reminder || ''}
                  initialRepeat={task.task_repeat || false}
                  initialCompleted={task.completed || false}
                />
              ))}
            </div>
          </div>
        )}

        {/* History Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ChevronDown className="w-4 h-4 text-foreground" />
              <h3 className="text-[16px] font-bold text-foreground">History</h3>
            </div>
            <div className="flex items-center gap-2">
              {isCollapsedAll ? 'Expand all items' : 'Collapse all items'}
            </div>
          </div>

          {/* History Filter Tabs */}
          <div className="flex items-center gap-1 mb-4 bg-background border border-border rounded-lg p-1">
            {showFilterTabs.map((tabId) => {
              const tab = FILTER_TAB_CONFIG[tabId]
              if (!tab) return null
              return (
                <button
                  key={tab.id}
                  onClick={() => handleFilterTabClick(tab.id)}
                  className={cn(
                    "px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors",
                    isFilterTabActive(tab.id)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Activity Feed - Timeline */}
          <div className="flex flex-col gap-4 relative">
            {historyItems.length > 0 ? (
              Object.keys(groupedHistory).length > 0 ? (
                <div className="flex flex-col gap-8">
                  {Object.entries(groupedHistory).map(([monthYear, items]) => (
                    <div key={monthYear} className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <h4 className="text-[14px] text-foreground font-bold whitespace-nowrap">{monthYear}</h4>
                        <div className="h-[1px] w-full bg-border" />
                      </div>

                      <div className="relative pl-8">
                        <div className="flex flex-col gap-3">
                          {items.map((item: any, idx: number) => {
                            const isNote = item.feedType === 'note'
                            const isTask = item.type === 'task'
                            const isTicket = item.type === 'ticket' || item.type === 'ticket_activity'
                            const isCall = item.type === 'call'
                            const isEmail = item.type === 'email'
                            const isMeeting = item.type === 'meeting'
                            const isLifecycle = item.type === 'lifecycle_change'

                            const tlIcon = isNote ? FileText : isTicket ? Ticket : isTask ? CheckSquare : isCall ? Phone : isEmail ? Mail : isMeeting ? Calendar : isLifecycle ? RefreshCw : Repeat
                            const tlIconColor = isNote ? "text-status-warning" : isTicket ? "text-status-warning" : isTask ? "text-status-success" : isLifecycle ? "text-status-purple" : "text-primary"
                            const tlIconBg = isNote ? "bg-status-warning/10" : isTicket ? "bg-status-warning/10" : isTask ? "bg-status-success/10" : isLifecycle ? "bg-status-purple/10" : "bg-primary/10"

                            return (
                              <div key={item.id} className="relative">
                                {idx < items.length - 1 && (
                                  <div className="absolute left-[-25px] top-8 bottom-[-12px] w-px bg-border z-0" />
                                )}
                                <div className={cn("absolute -left-[37px] top-2 h-6 w-6 rounded-full flex items-center justify-center z-10", tlIconBg)}>
                                  {React.createElement(tlIcon, { className: cn("h-3 w-3", tlIconColor) })}
                                </div>

                                {isNote ? (
                                  <ActivityLogCard
                                    id={item.id}
                                    feedType="note"
                                    type="Note"
                                    author={item.author?.first_name ? `${item.author.first_name} ${item.author.last_name || ""}` : "System"}
                                    date={new Date(item.created_at).toLocaleString('en-US', {
                                      month: 'short', day: 'numeric', year: 'numeric',
                                      hour: '2-digit', minute: '2-digit', hour12: true
                                    }) + " GMT+2"}
                                    content={item.content}
                                    isExpanded={!isCollapsedAll}
                                    associations={getAssociations()}
                                    onSuccess={onRefresh}
                                  />
                                ) : isTask ? (
                                  <ActivityTaskCard
                                    id={item.id}
                                    title={item.title || ""}
                                    description={item.description || ""}
                                    assignedTo={item.owner?.first_name ? `${item.owner.first_name} ${item.owner.last_name || ""}` : "Unassigned"}
                                    dueDate={item.due_date || new Date().toISOString()}
                                    dueTime={new Date(item.due_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                    isExpanded={!isCollapsedAll}
                                    initialTaskSubtype={item.task_subtype || 'To-do'}
                                    initialPriority={item.task_priority || 'None'}
                                    initialQueue={item.task_queue || 'General'}
                                    initialReminder={item.task_reminder || ''}
                                    initialRepeat={item.task_repeat || false}
                                    initialCompleted={item.completed || false}
                                    associations={getAssociations()}
                                    onSuccess={onRefresh}
                                  />
                                ) : isTicket ? (
                                  <ActivityTicketCard
                                    id={item.id}
                                    subject={item.subject || item.title || ""}
                                    description={item.description || ""}
                                    assignedTo={item.assigned_to || "Unassigned"}
                                    status={item.status || "open"}
                                    priority={item.priority || "None"}
                                    category={item.category || "general"}
                                    createdAt={item.created_at}
                                    isExpanded={!isCollapsedAll}
                                    associations={getAssociations()}
                                    onSuccess={onRefresh}
                                  />
                                ) : (
                                  <ActivityLogCard
                                    id={item.id}
                                    feedType="activity"
                                    type={item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                    author={item.owner?.first_name ? `${item.owner.first_name} ${item.owner.last_name || ""}` : "System"}
                                    date={new Date(item.created_at || item.due_date).toLocaleString('en-US', {
                                      month: 'short', day: 'numeric', year: 'numeric',
                                      hour: '2-digit', minute: '2-digit', hour12: true
                                    }) + " GMT+2"}
                                    icon={
                                      isCall ? <Phone className="w-5 h-5" /> :
                                        isEmail ? <Mail className="w-5 h-5" /> :
                                          isMeeting ? <Calendar className="w-5 h-5" /> :
                                            isLifecycle ? <RefreshCw className="w-5 h-5 text-status-purple" /> :
                                              <Repeat className="w-5 h-5" />
                                    }
                                    content={item.description || item.title}
                                    isExpanded={!isCollapsedAll}
                                    associations={getAssociations()}
                                  />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No activity matches your filters. <button className="text-primary font-bold hover:underline" onClick={() => setSelectedFilters(ALL_ACTIVITY_TYPES)}>Clear all filters</button></p>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No activity matches your filters. <button className="text-primary font-bold hover:underline" onClick={() => setSelectedFilters(ALL_ACTIVITY_TYPES)}>Clear all filters</button></p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
