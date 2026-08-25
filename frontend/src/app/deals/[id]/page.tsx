"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { usePanelCards } from "@/hooks/use-panel-cards"
import { CrmDetailLayout, CrmDetailLeftPanel, CrmDetailCenterPanel, CrmDetailRightPanel } from "@/components/crm/CrmDetailLayout"
import { Avatar } from "@/components/crm/Avatar"
import { dealsService } from "@/services/deals"
import { contactsService } from "@/services/contacts"
import { activitiesService } from "@/services/activities"
import { Deal } from "@/lib/types/crm"
import { DetailPageSkeleton } from "@/components/crm/Skeletons"
import { Button } from "@/components/ui/button"
import {
  DollarSign, Mail, Phone, Calendar, CheckSquare, AlignLeft, Users, Building2,
  ChevronLeft, ChevronDown, Settings, MoreHorizontal,
  Search, Pencil, LinkIcon, MessageSquare, MessageCircle,
  PhoneOutgoing, CalendarPlus, Mailbox, Repeat, ExternalLink,
  FileText, Sparkles, Copy, Lock, ChevronRight, Columns,
  RefreshCw, Ticket
} from "lucide-react"
import { ActivityTaskCard } from "@/components/activity/ActivityTaskCard"
import { ActivityLogCard } from "@/components/activity/ActivityLogCard"
import { ActivityFilterPopover, ALL_ACTIVITY_TYPES } from "@/components/activity/ActivityFilterPopover"
import { CustomFieldsDisplay } from "@/components/properties/CustomFieldsDisplay"
import { EditRecordSheet, type EditFieldConfig } from "@/components/properties/EditRecordSheet"

import dynamic from "next/dynamic"
const NoteEditorSheet = dynamic(() => import("@/components/activities/NoteEditorSheet").then(m => ({ default: m.NoteEditorSheet })), { ssr: false })
const TaskEditorSheet = dynamic(() => import("@/components/activities/TaskEditorSheet").then(m => ({ default: m.TaskEditorSheet })), { ssr: false })
const CallEditorSheet = dynamic(() => import("@/components/activities/CallEditorSheet").then(m => ({ default: m.CallEditorSheet })), { ssr: false })
const EmailEditorSheet = dynamic(() => import("@/components/activities/EmailEditorSheet").then(m => ({ default: m.EmailEditorSheet })), { ssr: false })
const MeetingEditorSheet = dynamic(() => import("@/components/activities/MeetingEditorSheet").then(m => ({ default: m.MeetingEditorSheet })), { ssr: false })
import { AddContactToDealSheet } from "./add-contact-to-deal-sheet"
import { AddCompanyToDealSheet } from "./add-company-to-deal-sheet"
import { AddTicketSheet } from "@/app/contacts/[id]/add-ticket-sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { authService } from "@/services/auth"
import { Profile } from "@/lib/types/crm"
import { cn } from "@/lib/utils"
import { useRealtime } from "@/hooks/use-realtime"
import { useAuth } from "@/hooks/use-auth"

import { getBadgeClasses } from "@/lib/badge-colors"

export default function DealDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { isEnabled, customLeftCards, customRightCards, leftAddedIds, ready } = usePanelCards('deals')
  const { workspaceId, loading: authLoading } = useAuth()
  const [deal, setDeal] = React.useState<Deal | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [currentUser, setCurrentUser] = React.useState<any>(null)
  const [profiles, setProfiles] = React.useState<Profile[]>([])
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>(ALL_ACTIVITY_TYPES)
  const [activeEditor, setActiveEditor] = React.useState<'note' | 'email' | 'task' | 'call' | 'meeting' | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [timeFilter, setTimeFilter] = React.useState('all')

  React.useEffect(() => {
    if (!authLoading && !workspaceId) {
      router.replace("/login")
    }
  }, [authLoading, workspaceId, router])
  const [assignedToFilter, setAssignedToFilter] = React.useState('all')
  const [isCollapsedAll, setIsCollapsedAll] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('all')
  const [showAddContact, setShowAddContact] = React.useState(false)
  const [showAddCompany, setShowAddCompany] = React.useState(false)
  const [isTicketSheetOpen, setIsTicketSheetOpen] = React.useState(false)

  const [aboutEditOpen, setAboutEditOpen] = React.useState(false)
  const dealAboutFields: EditFieldConfig[] = [
    { name: "title", label: "Deal name", type: "text" },
    { name: "amount", label: "Amount", type: "number" },
    { name: "close_date", label: "Close Date", type: "date" },
  ]

  const fetchData = React.useCallback(async () => {
    if (!workspaceId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const dealRes = await dealsService.getById(id, workspaceId!)
      if (dealRes.error) throw dealRes.error
      setDeal(dealRes.data as unknown as Deal)

      const dealWorkspaceId = (dealRes.data as unknown as Deal)?.workspace_id
      const [userRes, profilesRes] = await Promise.all([
        authService.getCurrentUser(),
        dealWorkspaceId ? authService.listProfiles(dealWorkspaceId) : Promise.resolve({ data: [] as Profile[] | null, error: null })
      ])

      setCurrentUser(userRes.data)
      setProfiles(profilesRes.data || [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load deal data")
    } finally {
      setIsLoading(false)
    }
  }, [id, workspaceId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Real-time synchronization
  useRealtime(React.useCallback((payload: any) => {
    const silentRefresh = async () => {
      try {
        const [dealRes] = await Promise.all([
          dealsService.getById(id, workspaceId!)
        ])
        if (dealRes.data) {
          setDeal(dealRes.data as unknown as Deal)
        }
      } catch (err) {
        console.error("Silent refresh failed:", err);
      }
    };
    silentRefresh();
  }, [id]))

  const handleUpdateDeal = React.useCallback(async (data: Partial<Deal>) => {
    if (!deal) return
    try {
      const res = await dealsService.update(deal.id, data, workspaceId ?? undefined)
      if (res.error) throw res.error
      setDeal(prev => prev ? { ...prev, ...data } : null)
      toast.success("Deal updated")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update deal")
    }
  }, [deal, workspaceId])

  const handleDeleteDeal = React.useCallback(async () => {
    if (!deal) return
    if (!confirm("Are you sure you want to delete this deal?")) return
    try {
      const { error } = await dealsService.delete(deal.id, deal.workspace_id!)
      if (error) throw error
      toast.success("Deal deleted")
      router.push("/deals")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete deal")
    }
  }, [deal, router])

  const combinedFeed = React.useMemo(() => {
    if (!deal) return []
    const notes = (Array.isArray((deal as any).notes) ? (deal as any).notes : []).map((n: any) => ({ ...n, feedType: 'note' as const }))
    const activities = ((deal as any).activities || []).map((a: any) => ({ ...a, feedType: 'activity' as const }))
    const tasks = ((deal as any).tasks || []).map((t: any) => ({
      ...t,
      feedType: 'activity' as const,
      type: 'task',
      owner: t.assigned_to ? { first_name: t.assigned_to.name, last_name: '' } : null,
      completed: t.status === 'completed'
    }))

    let all = [...notes, ...activities, ...tasks].sort((a, b) => {
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
        'lifecycle_change': 'Lifecycle changes',
        'ticket_activity': 'Ticket activity'
      }
      const label = typeMap[item.type]
      if (label) return selectedFilters.includes(label)
      return true
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
  }, [deal, selectedFilters, searchTerm, timeFilter, assignedToFilter, activeTab])

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
    if (!deal) return []
    const assocs: { name: string; type: string }[] = []
    assocs.push({ name: deal.title, type: 'Deal' })
    if (deal.contact) {
      assocs.push({ name: `${deal.contact?.first_name} ${deal.contact?.last_name || ''}`.trim(), type: 'Contact' })
    }
    if (deal.company) {
      assocs.push({ name: deal.company?.name, type: 'Company' })
    }
    return assocs
  }, [deal])

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!deal) {
    return (
      <CrmDetailLayout backLine="Deals" backHref="/deals">
        <div className="w-full flex flex-col items-center justify-center h-full text-muted-foreground">
          <h2 className="text-xl font-bold mb-2 text-foreground">Deal not found</h2>
          <p>The deal you are looking for does not exist or has been deleted.</p>
        </div>
      </CrmDetailLayout>
    )
  }

  const ownerName = deal.owner ? `${deal.owner.first_name} ${deal.owner.last_name}` : "Unassigned"

  return (
    <CrmDetailLayout backLine="Deals" backHref="/deals">

      {/* LEFT PANEL: Properties */}
      <CrmDetailLeftPanel>

        {/* Profile Card Summary */}
        <div className="bg-background border border-border rounded-md shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link href="/deals" className="flex items-center text-foreground text-[14px] font-bold">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Deals
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[14px] font-bold text-foreground flex items-center gap-1 outline-none">
                  Actions <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px] p-1 shadow-lg border-border z-[200]">
                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent">
                  Unfollow
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent">
                  View all properties
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent">
                  View property history
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent">
                  View association history
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent">
                  Review associations
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent flex items-center gap-3">
                  <Sparkles className="w-4 h-4" />
                  Summarize
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent flex items-center justify-between">
                  Search in Google
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/70" />
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent">
                  Opt out of email
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent flex items-center justify-between">
                  Restore activity
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/70" />
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent">
                  View record access
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent">
                  Merge
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent">
                  Clone
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[14px] text-destructive px-4 py-2 cursor-pointer hover:bg-destructive/10" onClick={handleDeleteDeal}>
                  Delete
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent">
                  Export deal data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="flex flex-col mt-1 min-w-0 flex-1">
                <h1 className="text-[20px] font-bold text-foreground leading-tight truncate">
                  {deal.title}
                </h1>
                <div className="mt-1.5">
                  <span className={cn(
                    "inline-flex items-center px-[10px] py-[3px] rounded-full text-[12px] font-bold uppercase tracking-wider",
                    getBadgeClasses('deal_stage', deal.stage ?? 'new')
                  )}>
                    {(deal.stage ?? 'discovery').replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-[14px] text-foreground mt-1.5">
                  ${deal.amount?.toLocaleString() ?? '0'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 mt-6">
              {[
                { icon: AlignLeft, label: "Note", onClick: () => setActiveEditor('note') },
                { icon: CheckSquare, label: "Task", onClick: () => setActiveEditor('task') },
                { icon: Ticket, label: "Ticket", onClick: () => setIsTicketSheetOpen(true) },
              ].map((btn, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                  onClick={btn.onClick}
                >
                  <div className="w-[48px] h-[48px] rounded-full border border-border flex items-center justify-center transition-colors bg-background text-foreground/70 group-hover:bg-muted group-hover:text-foreground">
                    <btn.icon className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <span className="text-[13px] text-foreground font-medium whitespace-nowrap">{btn.label}</span>
                </div>
              ))}

              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex flex-col items-center gap-1.5 group cursor-pointer w-[42px] border-none bg-transparent p-0 outline-none">
                    <div className="w-[38px] h-[38px] rounded-full border border-muted-foreground/50 flex items-center justify-center text-foreground bg-background group-hover:bg-secondary transition-colors">
                      <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <span className="text-[12px] text-foreground font-medium tracking-tight whitespace-nowrap">More</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="center" className="w-[280px] p-0 rounded-md shadow-lg border-border">
                  <div className="p-3 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                      <input type="text" placeholder="Search" className="w-full pl-9 pr-3 py-1.5 text-[14px] border border-border rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-foreground" />
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto py-2 flex flex-col crm-scrollbar">
                    {[
                      { icon: Repeat, label: "Enroll in a sequence", rightIcon: <Lock className="w-3.5 h-3.5" /> },
                      { icon: LinkIcon, label: "Engage on LinkedIn", rightIcon: <ChevronRight className="w-4 h-4" /> },
                      { icon: MessageSquare, label: "Log SMS" },
                      { icon: LinkIcon, label: "Log a LinkedIn message" },
                      { icon: MessageCircle, label: "Log a WhatsApp message" },
                      { icon: PhoneOutgoing, label: "Log a call", onClick: () => setActiveEditor('call') },
                      { icon: CalendarPlus, label: "Log a meeting", onClick: () => setActiveEditor('meeting') },
                      { icon: Mail, label: "Log an email", onClick: () => setActiveEditor('email') },
                      { icon: Mailbox, label: "Log postal mail" },
                      { icon: MessageCircle, label: "Create a WhatsApp message" },
                    ].map((item, idx) => (
                      <button key={idx} onClick={item.onClick} className="w-full flex items-center justify-between px-4 py-2 hover:bg-accent text-left group">
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                          <span className="text-[14px] text-foreground">{item.label}</span>
                        </div>
                        {item.rightIcon && <span className="text-muted-foreground/70">{item.rightIcon}</span>}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-border bg-background p-3 hover:bg-accent cursor-pointer rounded-b-md">
                    <span className="text-[14px] font-bold text-foreground block w-full text-left">Reorder activity buttons</span>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* About this deal Card */}
        <div className="bg-background border border-border rounded-md shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <ChevronDown className="w-4 h-4 text-foreground" strokeWidth={2.5} />
              <h3 className="font-bold text-[16px] text-foreground">About this deal</h3>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAboutEditOpen(true)}
                className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted text-muted-foreground"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Deal name</label>
              <div className="text-[14px] text-foreground">
                {deal.title || "--"}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Amount</label>
              <div className="text-[14px] text-foreground">
                ${deal.amount?.toLocaleString() ?? '0'}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Close Date</label>
              <div className="text-[14px] text-foreground">
                {deal.close_date ? new Date(deal.close_date).toLocaleDateString() : "--"}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Deal Owner</label>
              <div className="text-[14px] text-foreground flex items-center gap-1.5">
                {deal.owner ? (
                  <Avatar firstName={deal.owner.first_name} lastName={deal.owner.last_name} size="sm" />
                ) : null}
                {ownerName}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Probability</label>
              <div className="text-[14px] text-foreground">
                {deal.probability || "--"}%
              </div>
            </div>

            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Pipeline</label>
              <div className="text-[14px] text-foreground">
                {deal.pipeline || "--"}
              </div>
            </div>

            <CustomFieldsDisplay objectType="deal" values={deal.custom_fields || {}} />
          </div>
        </div>

        {/* Custom Left Cards from Layout Editor */}
        {ready && Array.isArray(customLeftCards) && customLeftCards
          .filter(card => leftAddedIds.includes(card.id))
          .map(card => (
            <div key={card.id} className="bg-background border border-border rounded-md shadow-sm">
              <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <ChevronDown className="w-4 h-4 text-foreground" strokeWidth={2.5} />
                  <h3 className="font-bold text-[16px] text-foreground">{card.label}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.push(`/deals/${id}/settings?edit=${card.id}`)}
                    className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted text-muted-foreground"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-5">
                {card.properties && card.properties.length > 0 ? (
                  card.properties.map((prop: any) => (
                    <div key={prop.id} className="group relative">
                      <label className="text-[13px] text-muted-foreground block mb-1">{prop.label}</label>
                      <div className="text-[14px] text-foreground">
                        {prop.value || "--"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-[13px] text-center italic bg-secondary py-4 rounded">
                    No properties selected for {card.label}.
                  </div>
                )}
              </div>
            </div>
          ))}

      </CrmDetailLeftPanel>

      {/* CENTER PANEL: Activity & Feed */}
      <CrmDetailCenterPanel>
        {/* Header Bar */}
        <div className="bg-background border-b border-border">
          <div className="px-6 py-2 flex items-center justify-center">
            <h2 className="text-[14px] font-bold text-foreground">History</h2>
          </div>

          {/* Tabs */}
          <div className="px-6 flex items-center gap-6">
            {[
              { id: 'all', label: 'All' },
              { id: 'Notes', label: 'Notes' },
              { id: 'Calls', label: 'Calls' },
              { id: 'Tasks', label: 'Tasks' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'all') {
                    setSelectedFilters(ALL_ACTIVITY_TYPES);
                  } else {
                    setSelectedFilters([tab.id]);
                  }
                }}
                className={cn(
                  "pb-2 text-[14px] font-bold transition-all relative",
                  activeTab === tab.id
                    ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-muted/50 p-5 min-h-full">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="relative w-full sm:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                <input
                  type="text"
                  placeholder="Search activities"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-[14px] border border-border rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-foreground"
                />
              </div>
              <button
                onClick={() => setIsCollapsedAll(prev => !prev)}
                className="flex items-center gap-1.5 text-[14px] font-bold text-foreground"
              >
                {isCollapsedAll ? 'Expand all' : 'Collapse all'} <ChevronDown className={cn("h-4 w-4 transition-transform", isCollapsedAll && "rotate-180")} />
              </button>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <ActivityFilterPopover
                selectedItems={selectedFilters}
                onSelectionChange={setSelectedFilters}
              />

              {/* Time range dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-1.5 text-[14px] font-bold",
                    timeFilter !== 'all' ? "text-primary" : "text-foreground"
                  )}>
                    {timeFilter === 'all' ? 'All time' :
                      timeFilter === 'today' ? 'Today' :
                        timeFilter === 'yesterday' ? 'Yesterday' :
                          timeFilter === 'this-week' ? 'This week' : 'This month'}
                    <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[180px]">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Time Range</DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTimeFilter('all')}>All time</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeFilter('today')}>Today</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeFilter('yesterday')}>Yesterday</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeFilter('this-week')}>This week</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTimeFilter('this-month')}>This month</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Assigned to dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-1.5 text-[14px] font-bold",
                    assignedToFilter !== 'all' ? "text-primary" : "text-foreground"
                  )}>
                    Activity assigned to
                    {assignedToFilter !== 'all' && ` (${profiles.find(p => p.id === assignedToFilter)?.first_name || ''})`}
                    <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[220px] max-h-[280px] overflow-y-auto">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Assigned To</DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setAssignedToFilter('all')}>All users</DropdownMenuItem>
                  {profiles.map(p => (
                    <DropdownMenuItem key={p.id} onClick={() => setAssignedToFilter(p.clerk_user_id || p.id)}>
                      {p.first_name} {p.last_name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {(searchTerm || timeFilter !== 'all' || assignedToFilter !== 'all') && (
                <button
                  onClick={() => { setSearchTerm(''); setTimeFilter('all'); setAssignedToFilter('all') }}
                  className="text-[13px] text-hs-danger font-medium hover:underline"
                >
                  × Clear filters
                </button>
              )}

              <button className="text-[14px] font-bold text-primary hover:underline" onClick={() => fetchData()}>Refresh</button>
            </div>
          </div>

          <div className="flex flex-col gap-6 relative">
            {upcomingTasks.length > 0 && (
              <div className="flex flex-col gap-4">
                <h4 className="text-[14px] text-muted-foreground font-medium">Upcoming</h4>
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
                    onSuccess={fetchData}
                    initialTaskSubtype={task.task_subtype || 'To-do'}
                    initialPriority={task.task_priority || 'None'}
                    initialQueue={task.task_queue || 'None'}
                    initialReminder={task.task_reminder || 'At task due time'}
                    initialRepeat={task.task_repeat || false}
                    initialCompleted={task.completed || false}
                  />
                ))}
              </div>
            )}

            {historyItems.length > 0 ? (
              <div className="flex flex-col gap-4">
                {Object.keys(groupedHistory).length > 0 ? (
                  <div className="flex flex-col gap-8">
                    {Object.entries(groupedHistory).map(([monthYear, items]) => (
                      <div key={monthYear} className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <h4 className="text-[14px] text-foreground font-bold whitespace-nowrap">{monthYear}</h4>
                          <div className="h-[1px] w-full bg-border" />
                        </div>

                        <div className="flex flex-col gap-4">
                          {items.map((item: any) => (
                            item.feedType === 'note' ? (
                              <ActivityLogCard
                                key={item.id}
                                id={item.id}
                                feedType="note"
                                type="Note"
                                author={item.author?.first_name ? `${item.author.first_name} ${item.author.last_name || ""}` : "System"}
                                date={new Date(item.created_at).toLocaleString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit', hour12: true
                                }) + " GMT+2"}
                                icon={<FileText className="w-5 h-5" />}
                                content={item.content}
                                isExpanded={!isCollapsedAll}
                                associations={getAssociations()}
                                onSuccess={fetchData}
                              />
                            ) : (
                              <ActivityLogCard
                                key={item.id}
                                id={item.id}
                                feedType="activity"
                                type={item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                author={item.owner?.first_name ? `${item.owner.first_name} ${item.owner.last_name || ""}` : "System"}
                                date={new Date(item.created_at || item.due_date).toLocaleString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit', hour12: true
                                }) + " GMT+2"}
                                icon={
                                  item.type === 'task' ? <CheckSquare className="w-5 h-5 text-status-success" /> :
                                    item.type === 'call' ? <Phone className="w-5 h-5" /> :
                                      item.type === 'email' ? <Mail className="w-5 h-5" /> :
                                        item.type === 'meeting' ? <Calendar className="w-5 h-5" /> :
                                          item.type === 'lifecycle_change' ? <RefreshCw className="w-5 h-5 text-status-purple" /> :
                                            item.type === 'ticket_activity' ? <Ticket className="w-5 h-5 text-status-warning" /> :
                                              <Repeat className="w-5 h-5" />
                                }
                                content={item.formatted_description || item.description || item.title}
                                isExpanded={!isCollapsedAll}
                                associations={getAssociations()}
                              />
                            )
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (upcomingTasks.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No activity matches your filters. <button className="text-primary font-bold hover:underline" onClick={() => setSelectedFilters(ALL_ACTIVITY_TYPES)}>Clear all filters</button></p>
                  </div>
                ))}
              </div>
            ) : (upcomingTasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No activity matches your filters. <button className="text-primary font-bold hover:underline" onClick={() => setSelectedFilters(ALL_ACTIVITY_TYPES)}>Clear all filters</button></p>
              </div>
            ))}
          </div>
        </div>
      </CrmDetailCenterPanel>

      {/* RIGHT PANEL: Associated Objects */}
      <CrmDetailRightPanel>
        {isEnabled("contacts") && (
          <div className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-foreground" strokeWidth={2.5} />
                <h3 className="font-bold text-[14px] text-foreground">Contacts ({deal.contact ? 1 : 0})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddContact(true)}
                  className="text-[14px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  Add
                </button>
                <button
                  onClick={() => router.push(`/deals/${id}/settings`)}
                  className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors shrink-0"
                  title="Customize right panel"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {deal.contact ? (
              <div className="p-4">
                <div className="p-3 bg-background border border-border rounded shadow-sm hover:shadow transition-shadow">
                  <span
                    className="text-[14px] font-bold text-primary hover:underline cursor-pointer block"
                    onClick={() => router.push(`/contacts/${deal.contact?.id}`)}
                  >
                    {deal.contact?.first_name} {deal.contact?.last_name || ''}
                  </span>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{deal.contact?.email || "No email"}</p>
                </div>
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4 relative">
                  <Search className="w-8 h-8 text-border" />
                  <div className="absolute top-0 right-0 w-6 h-6 bg-background border border-border rounded flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[200px]">
                  No contacts associated.
                </p>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="mt-3 text-[13px] font-bold text-primary hover:underline"
                >
                  + Add contact
                </button>
              </div>
            )}
          </div>
        )}

        {isEnabled("companies") && (
          <div className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-foreground" strokeWidth={2.5} />
                <h3 className="font-bold text-[14px] text-foreground">Companies ({deal.company ? 1 : 0})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddCompany(true)}
                  className="text-[14px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  Add
                </button>
                <button
                  onClick={() => router.push(`/deals/${id}/settings`)}
                  className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors shrink-0"
                  title="Customize right panel"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {deal.company ? (
              <div className="p-4">
                <div className="p-3 bg-background border border-border rounded shadow-sm hover:shadow transition-shadow">
                  <span
                    className="text-[14px] font-bold text-primary hover:underline cursor-pointer block"
                    onClick={() => router.push(`/companies/${deal.company?.id}`)}
                  >
                    {deal.company?.name}
                  </span>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{deal.company?.domain || "No domain"}</p>
                </div>
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-3">
                  <Building2 className="w-6 h-6 text-border" />
                </div>
                <p className="text-[13px] text-muted-foreground">No companies associated.</p>
                <button
                  onClick={() => setShowAddCompany(true)}
                  className="mt-3 text-[13px] font-bold text-primary hover:underline"
                >
                  + Add company
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tickets Card */}
        {isEnabled("tickets") && (
          <div className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-foreground" strokeWidth={2.5} />
                <h3 className="font-bold text-[14px] text-foreground">Tickets (0)</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1">
                  Add
                </span>
                <button
                  onClick={() => router.push(`/deals/${id}/settings`)}
                  className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors shrink-0"
                  title="Customize right panel"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="p-6 flex flex-col items-center text-center">
              <p className="text-[13px] text-muted-foreground">No tickets found.</p>
            </div>
          </div>
        )}


        {/* Custom Right Cards */}
        {ready && Array.isArray(customRightCards) && customRightCards.map(card => (
          <div key={card.id} className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-2">
                <ChevronDown className="w-4 h-4 text-foreground" strokeWidth={2.5} />
                <h3 className="font-bold text-[14px] text-foreground">{card.label}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/deals/${id}/settings`)}
                  className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted text-muted-foreground"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8 flex flex-col items-center text-center">
              {card.type === 'association' ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-muted/30 border border-border flex items-center justify-center mb-3">
                    <Search className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-[13px] text-muted-foreground">No associations found.</p>
                </>
              ) : (
                <p className="text-[13px] text-muted-foreground">No data yet.</p>
              )}
            </div>
          </div>
        ))}
      </CrmDetailRightPanel>

      {/* Add Contact Sheet */}
      <AddContactToDealSheet
        dealId={deal.id}
        open={showAddContact}
        onClose={() => setShowAddContact(false)}
        onSuccess={() => {
          fetchData()
          setShowAddContact(false)
        }}
      />

      {/* Add Company Sheet */}
      <AddCompanyToDealSheet
        dealId={deal.id}
        open={showAddCompany}
        onClose={() => setShowAddCompany(false)}
        onSuccess={() => {
          fetchData()
          setShowAddCompany(false)
        }}
      />

      <NoteEditorSheet
        open={activeEditor === 'note'}
        onClose={() => setActiveEditor(null)}
        onSaved={fetchData}
        entityType="deal"
        entityId={id as string}
        workspaceId={deal?.workspace_id ?? ""}
      />

      <EditRecordSheet
        open={aboutEditOpen}
        onOpenChange={setAboutEditOpen}
        objectType="deal"
        title="Deal"
        fields={dealAboutFields}
        initialValues={deal || {}}
        onSave={handleUpdateDeal}
      />
      <EmailEditorSheet
        open={activeEditor === 'email'}
        onClose={() => setActiveEditor(null)}
        onSaved={fetchData}
        entityType="deal"
        entityId={id as string}
        workspaceId={deal?.workspace_id ?? ""}
      />
      <TaskEditorSheet
        open={activeEditor === 'task'}
        onClose={() => setActiveEditor(null)}
        onSaved={fetchData}
        entityType="deal"
        entityId={id as string}
        workspaceId={deal?.workspace_id ?? ""}
      />
      <CallEditorSheet
        open={activeEditor === 'call'}
        onClose={() => setActiveEditor(null)}
        onSaved={fetchData}
        entityType="deal"
        entityId={id as string}
        workspaceId={deal?.workspace_id ?? ""}
      />
      <MeetingEditorSheet
        open={activeEditor === 'meeting'}
        onClose={() => setActiveEditor(null)}
        onSaved={fetchData}
        entityType="deal"
        entityId={id as string}
        workspaceId={deal?.workspace_id ?? ""}
      />
      <AddTicketSheet
        open={isTicketSheetOpen}
        onClose={() => setIsTicketSheetOpen(false)}
        contactId={deal?.contact?.id ?? ""}
        contactName={deal?.contact ? `${deal.contact.first_name ?? ''} ${deal.contact.last_name ?? ''}`.trim() : undefined}
        companyId={deal?.company?.id}
        workspaceId={deal?.workspace_id ?? ""}
        onSuccess={() => { fetchData(); setIsTicketSheetOpen(false) }}
      />
    </CrmDetailLayout>
  )
}
