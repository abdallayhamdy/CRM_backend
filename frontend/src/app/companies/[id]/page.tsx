"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { usePanelCards } from "@/hooks/use-panel-cards"
import { CrmDetailLayout, CrmDetailLeftPanel, CrmDetailCenterPanel, CrmDetailRightPanel } from "@/components/crm/CrmDetailLayout"
import { Avatar } from "@/components/crm/Avatar"
import { companiesService } from "@/services/companies"
import { contactsService } from "@/services/contacts"
import { dealsService } from "@/services/deals"
import { ticketsService } from "@/services/tickets"
import { activitiesService } from "@/services/activities"
import { Company, Contact, Deal } from "@/lib/types/crm"
import { laravelApi } from "@/lib/laravel-api"
import { logAudit } from "@/lib/audit"
import { exportToCSV, formatCurrency } from "@/lib/utils"
import { DetailPageSkeleton } from "@/components/crm/Skeletons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Building2, Mail, Phone, Calendar, CheckSquare, AlignLeft,
  ChevronLeft, ChevronDown, Settings, MoreHorizontal,
  Search, Plus, Pencil, LinkIcon, MessageSquare, MessageCircle,
  PhoneOutgoing, CalendarPlus, Mailbox, Repeat, ExternalLink,
  FileText, Sparkles, Copy, Lock, ChevronRight, Columns, Users,
  RefreshCw, Ticket
} from "lucide-react"
import { ActivityTaskCard } from "@/components/activity/ActivityTaskCard"
import { ActivityLogCard } from "@/components/activity/ActivityLogCard"
import { ActivityFilterPopover, ALL_ACTIVITY_TYPES } from "@/components/activity/ActivityFilterPopover"

import dynamic from "next/dynamic"
const NoteEditorSheet = dynamic(() => import("@/components/activities/NoteEditorSheet").then(m => ({ default: m.NoteEditorSheet })), { ssr: false })
const TaskEditorSheet = dynamic(() => import("@/components/activities/TaskEditorSheet").then(m => ({ default: m.TaskEditorSheet })), { ssr: false })
const CallEditorSheet = dynamic(() => import("@/components/activities/CallEditorSheet").then(m => ({ default: m.CallEditorSheet })), { ssr: false })
const EmailEditorSheet = dynamic(() => import("@/components/activities/EmailEditorSheet").then(m => ({ default: m.EmailEditorSheet })), { ssr: false })
const MeetingEditorSheet = dynamic(() => import("@/components/activities/MeetingEditorSheet").then(m => ({ default: m.MeetingEditorSheet })), { ssr: false })
const AddDealSheet = dynamic(
  () => import("@/app/contacts/[id]/add-deal-sheet").then(mod => ({ default: mod.AddDealSheet })),
  { ssr: false }
)
import { AddTicketSheet } from "@/app/contacts/[id]/add-ticket-sheet"
const AddCompanySheet = dynamic(
  () => import("@/app/contacts/[id]/add-company-sheet").then(mod => ({ default: mod.AddCompanySheet })),
  { ssr: false }
)
const AddContactSheet = dynamic(
  () => import("@/app/companies/[id]/add-contact-sheet").then(mod => ({ default: mod.AddContactSheet })),
  { ssr: false }
)
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { authService } from "@/services/auth"
import { Profile } from "@/lib/types/crm"
import { cn } from "@/lib/utils"
import { useRealtime } from "@/hooks/use-realtime"
import { useAuth } from "@/hooks/use-auth"
import { PropertyHistoryDialog } from "@/components/crm/detail/PropertyHistoryDialog"
import { CustomFieldsDisplay } from "@/components/properties/CustomFieldsDisplay"
import { EditRecordSheet, type EditFieldConfig } from "@/components/properties/EditRecordSheet"

function QuickEditCompanyPopover({ company, onUpdate }: { company: Company, onUpdate: (data: Partial<Company>) => Promise<void> }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: company.name || '',
    domain: company.domain || '',
    industry: company.industry || '',
    phone: company.phone || ''
  })
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: company.name || '',
        domain: company.domain || '',
        industry: company.industry || '',
        phone: company.phone || ''
      })
    }
  }, [isOpen, company])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate({
        name: formData.name,
        domain: formData.domain,
        industry: formData.industry,
        phone: formData.phone
      })
      setIsOpen(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded text-muted-foreground hover:text-muted-foreground outline-none">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" side="bottom" sideOffset={8} className="w-[260px] p-4 shadow-[0_5px_20px_rgba(0,0,0,0.1)] border-border rounded-lg">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[12px] text-muted-foreground/60">Company Name</label>
            <Input
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(f => ({ ...f, name: e.target.value }))}
              className="h-8 text-[14px] px-2 py-1"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[12px] text-muted-foreground/60">Domain</label>
            <Input
              value={formData.domain}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(f => ({ ...f, domain: e.target.value }))}
              className="h-8 text-[14px] px-2 py-1"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[12px] text-muted-foreground/60">Industry</label>
            <Input
              value={formData.industry}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(f => ({ ...f, industry: e.target.value }))}
              className="h-8 text-[14px] px-2 py-1"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[12px] text-muted-foreground/60">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(f => ({ ...f, phone: e.target.value }))}
              className="h-8 text-[14px] px-2 py-1"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} className="h-7 text-[12px] px-3">Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-7 text-[12px] px-3 bg-primary hover:bg-primary/90 text-primary-foreground">
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function CompanyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { isEnabled, customLeftCards, customRightCards, leftAddedIds, ready } = usePanelCards('companies')
  const { workspaceId, loading: authLoading } = useAuth()
  const [company, setCompany] = React.useState<Company | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [currentUser, setCurrentUser] = React.useState<any>(null)
  const [profiles, setProfiles] = React.useState<Profile[]>([])
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>(ALL_ACTIVITY_TYPES)
  const [activeEditor, setActiveEditor] = React.useState<'note' | 'email' | 'task' | 'call' | 'meeting' | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')

  React.useEffect(() => {
    if (!authLoading && !workspaceId) {
      router.replace("/login")
    }
  }, [authLoading, workspaceId, router])
  const [timeFilter, setTimeFilter] = React.useState('all')
  const [assignedToFilter, setAssignedToFilter] = React.useState('all')
  const [isCollapsedAll, setIsCollapsedAll] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('all')
  const [isDealSheetOpen, setIsDealSheetOpen] = React.useState(false)
  const [isTicketSheetOpen, setIsTicketSheetOpen] = React.useState(false)
  const [isContactSheetOpen, setIsContactSheetOpen] = React.useState(false)

  // Actions dropdown modals / dialogs
  const [propertyHistoryOpen, setPropertyHistoryOpen] = React.useState(false)
  const [associationHistoryOpen, setAssociationHistoryOpen] = React.useState(false)
  const [reviewAssociationsOpen, setReviewAssociationsOpen] = React.useState(false)
  const [summarizeOpen, setSummarizeOpen] = React.useState(false)
  const [recordAccessOpen, setRecordAccessOpen] = React.useState(false)
  const [mergeOpen, setMergeOpen] = React.useState(false)
  const [mergeTargetId, setMergeTargetId] = React.useState<string>('')
  const [candidateCompanies, setCandidateCompanies] = React.useState<Company[]>([])
  const [mergeConfirmOpen, setMergeConfirmOpen] = React.useState(false)

  const [aboutEditOpen, setAboutEditOpen] = React.useState(false)
  const companyAboutFields: EditFieldConfig[] = [
    { name: "name", label: "Company name", type: "text" },
    { name: "domain", label: "Domain", type: "text" },
    { name: "industry", label: "Industry", type: "text" },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "address", label: "City", type: "text" },
  ]
  const [mergeSearch, setMergeSearch] = React.useState('')
  const [associationChangeLog, setAssociationChangeLog] = React.useState<any[]>([])
  const [associationSearch, setAssociationSearch] = React.useState('')
  const [candidateContacts, setCandidateContacts] = React.useState<Contact[]>([])
  const [candidateDeals, setCandidateDeals] = React.useState<Deal[]>([])
  const [linkedContacts, setLinkedContacts] = React.useState<Contact[]>([])
  const [linkedDeals, setLinkedDeals] = React.useState<Deal[]>([])

  const fetchData = React.useCallback(async () => {
    if (!workspaceId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const companyRes = await companiesService.getById(id, workspaceId!)
      if (companyRes.error) throw companyRes.error
      setCompany(companyRes.data as Company ?? null)

      const companyWorkspaceId = (companyRes.data as Company)?.workspace_id
      const [userRes, profilesRes] = await Promise.all([
        authService.getCurrentUser(),
        companyWorkspaceId ? authService.listProfiles(companyWorkspaceId) : Promise.resolve({ data: [] as Profile[] | null, error: null })
      ])

      setCurrentUser(userRes.data)
      setProfiles(profilesRes.data || [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load company data")
    } finally {
      setIsLoading(false)
    }
  }, [id, workspaceId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  React.useEffect(() => {
    if (reviewAssociationsOpen) {
      const linkedC = (company?.contacts || []) as Contact[]
      const linkedD = (company?.deals || []) as Deal[]
      setLinkedContacts(linkedC)
      setLinkedDeals(linkedD)
      contactsService.getAll({ workspace_id: company?.workspace_id ?? '' }).then((res) => {
        const all = (res.data || []) as Contact[]
        setCandidateContacts(all.filter((c) => !linkedC.some((l) => l.id === c.id)))
      })
      dealsService.getAll({}, { workspace_id: company?.workspace_id ?? '' }).then((res) => {
        const all = (res.data || []) as Deal[]
        setCandidateDeals(all.filter((d) => !linkedD.some((l) => l.id === d.id)))
      })
    }
  }, [reviewAssociationsOpen, company])

  React.useEffect(() => {
    if (mergeOpen) {
      setMergeSearch('')
      setMergeTargetId('')
      companiesService.getAll({ workspace_id: company?.workspace_id ?? '' }).then((res) => {
        const all = (res.data || []) as Company[]
        setCandidateCompanies(all.filter((c) => c.id !== id))
      })
    }
  }, [mergeOpen, id])

  // Real-time synchronization
  useRealtime(React.useCallback((payload: any) => {
    const silentRefresh = async () => {
      try {
        const [companyRes] = await Promise.all([
          companiesService.getById(id, workspaceId!)
        ])
        if (companyRes.data) {
          setCompany(companyRes.data as Company)
        }
      } catch (err) {
        console.error("Silent refresh failed:", err);
      }
    };
    silentRefresh();
  }, [id]))

  const handleUpdateCompany = React.useCallback(async (data: Partial<Company>) => {
    if (!company) return
    try {
      const res = await companiesService.update(company.id, data, company.workspace_id!)
      if (res.error) throw res.error
      setCompany(prev => prev ? { ...prev, ...data } : null)
      toast.success("Company updated")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update company")
    }
  }, [company])

  const handleDeleteCompany = React.useCallback(async () => {
    if (!company) return
    if (!confirm("Are you sure you want to delete this company?")) return
    try {
      const { error } = await companiesService.delete(company.id, company.workspace_id!)
      if (error) throw error
      toast.success("Company deleted")
      router.push("/companies")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete company")
    }
  }, [company, router])

  const combinedFeed = React.useMemo(() => {
    if (!company) return []
    const notes = (Array.isArray(company.notes) ? company.notes : []).map(n => ({ ...n, feedType: 'note' as const }))
    const activities = (company.activities || []).map(a => ({ ...a, feedType: 'activity' as const }))
    const tasks = (company.tasks || []).map(t => ({
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
        if (activeTab === 'Meetings') return item.feedType === 'activity' && item.type === 'meeting'
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
  }, [company, selectedFilters, searchTerm, timeFilter, assignedToFilter, activeTab])

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
    if (!company) return []
    const assocs: { name: string; type: string }[] = []
    assocs.push({ name: company.name, type: 'Company' })
    if (company.contacts && company.contacts.length > 0) {
      company.contacts.forEach(contact => {
        assocs.push({ name: `${contact.first_name} ${contact.last_name || ''}`.trim(), type: 'Contact' })
      })
    }
    if (company.deals && company.deals.length > 0) {
      company.deals.forEach(deal => {
        assocs.push({ name: deal.title, type: 'Deal' })
      })
    }
    return assocs
  }, [company])

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!company) {
    return (
      <CrmDetailLayout backLine="Companies" backHref="/companies">
        <div className="w-full flex flex-col items-center justify-center h-full text-muted-foreground">
          <h2 className="text-xl font-bold mb-2 text-foreground">Company not found</h2>
          <p>The company you are looking for does not exist or has been deleted.</p>
        </div>
      </CrmDetailLayout>
    )
  }

  const companyName = company.name || "Unnamed Company"
  const ownerName = company.owner ? `${company.owner.first_name} ${company.owner.last_name}` : "Unassigned"
  const domain = company.domain || "No domain"

  return (
    <CrmDetailLayout backLine="Companies" backHref="/companies">

      {/* LEFT PANEL: Properties */}
      <CrmDetailLeftPanel>

        {/* Profile Card Summary */}
        <div className="bg-background border border-border rounded-md shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link href="/companies" className="flex items-center text-foreground text-[14px] font-bold">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Companies
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[14px] font-bold text-foreground flex items-center gap-1 outline-none">
                  Actions <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px] p-1 shadow-lg border-border z-[200]">
                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent" onClick={async () => {
                  const next = !company?.isFollowing
                  await companiesService.update(id as string, { isFollowing: next })
                  setCompany((c) => (c ? { ...c, isFollowing: next } : c) as Company)
                  toast.success(next ? 'Now following company' : 'Unfollowed company')
                }}>
                  {company?.isFollowing ? 'Unfollow' : 'Follow'}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent" onClick={() => {
                  router.push('/settings/properties?object_type=company')
                }}>
                  View all properties
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent" onClick={() => {
                  setPropertyHistoryOpen(true)
                }}>
                  View property history
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent" onClick={async () => {
                  const { data } = await laravelApi.get<{ logs: any[] }>('/audit-log', {
                    workspace_id: company?.workspace_id ?? workspaceId ?? '',
                    category: 'company',
                    page: 1,
                    page_size: 200,
                  })
                  const logs = data?.logs || []
                  const mine = logs.filter(
                    (l: any) =>
                      l.action !== undefined &&
                      (l.record_id === id ||
                        (l.details && JSON.stringify(l.details).includes(String(id))))
                  )
                  setAssociationChangeLog(mine)
                  setAssociationHistoryOpen(true)
                }}>
                  View association history
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent" onClick={() => setReviewAssociationsOpen(true)}>
                  Review associations
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent flex items-center gap-3" onClick={() => setSummarizeOpen(true)}>
                  <Sparkles className="w-4 h-4" />
                  Summarize
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent flex items-center justify-between" onClick={() => {
                  const q = encodeURIComponent(company?.name ?? '')
                  window.open(`https://www.google.com/search?q=${q}`, '_blank')
                }}>
                  Search in Google
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent" onClick={async () => {
                  const next = !company?.emailOptOut
                  await companiesService.update(id as string, { emailOptOut: next })
                  setCompany((c) => (c ? { ...c, emailOptOut: next } : c) as Company)
                  toast.success(next ? 'Company opted out of email' : 'Company opted in to email')
                }}>
                  {company?.emailOptOut ? 'Opt in to email' : 'Opt out of email'}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent flex items-center justify-between" title="Restore activity is not available in this build" onClick={() => {
                  toast.info('Restore activity is not available in this build')
                }}>
                  Restore activity
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent" onClick={() => setRecordAccessOpen(true)}>
                  View record access
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent" onClick={() => setMergeOpen(true)}>
                  Merge
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent" onClick={async () => {
                  const clone: any = { ...company }
                  delete clone.id
                  delete clone.created_at
                  delete clone.updated_at
                  clone.name = `${company?.name ?? 'Company'} (Copy)`
                  await companiesService.create(clone as Company)
                  toast.success('Company cloned')
                  router.push('/companies')
                }}>
                  Clone
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[14px] text-destructive px-4 py-2 cursor-pointer hover:bg-destructive/10" onClick={handleDeleteCompany}>
                  Delete
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent" onClick={() => {
                  if (!company) return
                  const row: Record<string, unknown> = {
                    id: company.id,
                    name: company.name,
                    domain: company.domain ?? '',
                    industry: company.industry ?? '',
                    description: company.description ?? '',
                    phone: company.phone ?? '',
                    owner: company.owner ? `${company.owner.first_name}${company.owner.last_name ? ' ' + company.owner.last_name : ''}` : '',
                  }
                  exportToCSV([row], `company-${company.id}.csv`)
                  toast.success('Exported company to CSV')
                  logAudit({
                    workspace_id: company.workspace_id ?? '',
                    action: 'export_record',
                    category: 'company',
                  }).catch(() => {})
                }}>
                  Export company data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col mt-1 min-w-0 flex-1">
                <div className="flex items-center gap-1 group min-w-0 w-full">
                  <h1 className="text-[20px] font-bold text-foreground leading-tight truncate">
                    {companyName}
                  </h1>
                  <div className="shrink-0">
                    <QuickEditCompanyPopover company={company!} onUpdate={handleUpdateCompany} />
                  </div>
                </div>
                <p className="text-[14px] text-foreground mt-1.5 break-words">
                  {company.industry || "No industry"}
                </p>
                <div className="flex items-center gap-1.5 mt-2 group min-w-0 w-full">
                  <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer" className="text-[14px] font-bold text-primary hover:underline underline-offset-2 truncate">
                    {domain}
                  </a>
                  {company.domain && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Copy className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                      <ExternalLink className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                    </div>
                  )}
                </div>
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
                    <div className="w-[38px] h-[38px] rounded-full border border-muted-foreground/50 flex items-center justify-center text-foreground/80 bg-background group-hover:bg-muted transition-colors">
                      <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <span className="text-[12px] text-foreground font-medium tracking-tight whitespace-nowrap">More</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="center" className="w-[280px] p-0 rounded-md shadow-lg border-border">
                  <div className="p-3 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input type="text" placeholder="Search" className="w-full pl-9 pr-3 py-1.5 text-[14px] border border-input rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-muted-foreground text-foreground" />
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
                          <item.icon className="w-5 h-5 text-foreground/70" strokeWidth={1.5} />
                          <span className="text-[14px] text-foreground">{item.label}</span>
                        </div>
                        {item.rightIcon && <span className="text-muted-foreground">{item.rightIcon}</span>}
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

        {/* About this company Card */}
        <div className="bg-background border border-border rounded-md shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
              <h3 className="font-bold text-[16px] text-foreground">About this company</h3>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAboutEditOpen(true)}
                className="w-8 h-8 rounded border border-input flex items-center justify-center hover:bg-muted text-muted-foreground"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Company name</label>
              <div className="text-[14px] text-foreground">
                {company.name || "--"}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Domain</label>
              <div className="text-[14px]">
                {company.domain ? (
                  <a href={`https://${company.domain}`} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary hover:underline">
                    {company.domain}
                  </a>
                ) : "--"}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Industry</label>
              <div className="text-[14px] text-foreground">
                {company.industry || "--"}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Phone Number</label>
              <div className="text-[14px] text-foreground">
                {company.phone || "--"}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">Company owner</label>
              <div className="text-[14px] text-foreground">
                {ownerName}
              </div>
            </div>

            <div className="group relative">
              <label className="text-[13px] text-muted-foreground block mb-1">City</label>
              <div className="text-[14px] text-foreground">
                {company.address || "--"}
              </div>
            </div>

            <CustomFieldsDisplay objectType="company" values={company.custom_fields || {}} />
          </div>
        </div>

        {/* Custom Left Cards from Layout Editor */}
        {ready && Array.isArray(customLeftCards) && customLeftCards
          .filter(card => leftAddedIds.includes(card.id))
          .map(card => (
            <div key={card.id} className="bg-background border border-border rounded-md shadow-sm">
              <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                  <h3 className="font-bold text-[16px] text-foreground">{card.label}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.push(`/companies/${id}/settings?edit=${card.id}`)}
                    className="w-8 h-8 rounded border border-input flex items-center justify-center hover:bg-muted text-muted-foreground"
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
                  <div className="text-muted-foreground text-[13px] text-center italic bg-muted py-4 rounded">
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search activities"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-[14px] border border-input rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-muted-foreground text-foreground"
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
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
                <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                <h3 className="font-bold text-[14px] text-foreground">Contacts ({company.contacts?.length || 0})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsContactSheetOpen(true)}
                  className="text-[14px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
                <button
                  onClick={() => router.push(`/companies/${id}/settings`)}
                  className="w-8 h-8 rounded border border-input flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors shrink-0"
                  title="Customize right panel"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {company.contacts && company.contacts.length > 0 ? (
              <div className="p-4 space-y-2">
                {company.contacts.map((contact: Contact) => (
                  <div key={contact.id} className="p-3 bg-background border border-border rounded shadow-sm hover:shadow transition-shadow">
                    <span
                      className="text-[14px] font-bold text-primary hover:underline cursor-pointer block"
                      onClick={() => router.push(`/contacts/${contact.id}`)}
                    >
                      {contact.first_name} {contact.last_name || ''}
                    </span>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{contact.email || "No email"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 relative">
                  <Search className="w-8 h-8 text-border" />
                  <div className="absolute top-0 right-0 w-6 h-6 bg-background border border-border rounded flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[200px]">
                  No contacts associated.
                </p>
                <button
                  onClick={() => setIsContactSheetOpen(true)}
                  className="mt-3 text-[13px] font-bold text-primary hover:underline"
                >
                  + Add contact
                </button>
              </div>
            )}
          </div>
        )}

        {isEnabled("deals") && (
          <div className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                <h3 className="font-bold text-[14px] text-foreground">Deals ({company.deals?.length || 0})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDealSheetOpen(true)}
                  className="text-[14px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
                <button
                  onClick={() => router.push(`/companies/${id}/settings`)}
                  className="w-8 h-8 rounded border border-input flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors shrink-0"
                  title="Customize right panel"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {company.deals && company.deals.length > 0 ? (
              <div className="p-4 space-y-2">
                {company.deals.map((deal: Deal) => (
                  <div key={deal.id} className="p-3 bg-background border border-border rounded shadow-sm hover:shadow transition-shadow">
                    <span
                      className="text-[14px] font-bold text-primary hover:underline cursor-pointer block"
                      onClick={() => router.push(`/deals/${deal.id}`)}
                    >
                      {deal.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[13px] font-bold text-foreground">${deal.amount?.toLocaleString() ?? '0'}</span>
                      <span className="text-[11px] text-muted-foreground uppercase font-bold">• {deal.stage?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-border" />
                </div>
                <p className="text-[13px] text-muted-foreground">No deals associated.</p>
                <button
                  onClick={() => setIsDealSheetOpen(true)}
                  className="mt-3 text-[13px] font-bold text-primary hover:underline"
                >
                  + Create a deal
                </button>
              </div>
            )}
          </div>
        )}

        {isEnabled("tickets") && (
          <div className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                <h3 className="font-bold text-[14px] text-foreground">Tickets (0)</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add
                </span>
                <button
                  onClick={() => router.push(`/companies/${id}/settings`)}
                  className="w-8 h-8 rounded border border-input flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors shrink-0"
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
                <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                <h3 className="font-bold text-[14px] text-foreground">{card.label}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/companies/${id}/settings`)}
                  className="w-8 h-8 rounded border border-input flex items-center justify-center hover:bg-muted text-muted-foreground"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8 flex flex-col items-center text-center">
              {card.type === 'association' ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-muted/30 border border-border flex items-center justify-center mb-3">
                    <Search className="w-6 h-6 text-muted-foreground/50" />
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

      {/* Add Deal Sheet */}
      <AddDealSheet
        open={isDealSheetOpen}
        onClose={() => setIsDealSheetOpen(false)}
        companyId={id}
        companyName={companyName}
        workspaceId={company?.workspace_id ?? undefined}
        onSuccess={() => { fetchData(); setIsDealSheetOpen(false) }}
      />

      {/* Add Ticket Sheet */}
      <AddTicketSheet
        open={isTicketSheetOpen}
        onClose={() => setIsTicketSheetOpen(false)}
        companyId={id}
        contactId={undefined as any}
        workspaceId={company?.workspace_id ?? undefined}
        onSuccess={() => { fetchData(); setIsTicketSheetOpen(false) }}
      />

      {/* Add Contact Sheet */}
      <AddContactSheet
        open={isContactSheetOpen}
        onClose={() => setIsContactSheetOpen(false)}
        companyId={id}
        companyName={companyName}
        workspaceId={company?.workspace_id ?? undefined}
        onSuccess={() => { fetchData(); setIsContactSheetOpen(false) }}
      />

      <NoteEditorSheet
        open={activeEditor === 'note'}
        onClose={() => setActiveEditor(null)}
        onSaved={fetchData}
        entityType="company"
        entityId={id as string}
        workspaceId={company?.workspace_id ?? ""}
      />

      <EditRecordSheet
        open={aboutEditOpen}
        onOpenChange={setAboutEditOpen}
        objectType="company"
        title="Company"
        fields={companyAboutFields}
        initialValues={company || {}}
        onSave={handleUpdateCompany}
      />

      <EmailEditorSheet
        open={activeEditor === 'email'}
        onClose={() => setActiveEditor(null)}
        onSaved={fetchData}
        entityType="company"
        entityId={id as string}
        workspaceId={company?.workspace_id ?? ""}
      />
      <TaskEditorSheet
        open={activeEditor === 'task'}
        onClose={() => setActiveEditor(null)}
        onSaved={fetchData}
        entityType="company"
        entityId={id as string}
        workspaceId={company?.workspace_id ?? ""}
      />
      <CallEditorSheet
        open={activeEditor === 'call'}
        onClose={() => setActiveEditor(null)}
        onSaved={fetchData}
        entityType="company"
        entityId={id as string}
        workspaceId={company?.workspace_id ?? ""}
      />
      <MeetingEditorSheet
        open={activeEditor === 'meeting'}
        onClose={() => setActiveEditor(null)}
        onSaved={fetchData}
        entityType="company"
        entityId={id as string}
        workspaceId={company?.workspace_id ?? ""}
      />

      {/* View property history */}
      <PropertyHistoryDialog
        open={propertyHistoryOpen}
        onOpenChange={setPropertyHistoryOpen}
        entityType="company"
        entityId={id}
        entityLabel="company"
        entityTitle={company?.name || ""}
      />

      {/* View association history */}
      <Dialog open={associationHistoryOpen} onOpenChange={setAssociationHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Association history</DialogTitle>
            <DialogDescription>Changes to this company's associations.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {associationChangeLog.length === 0 ? (
              <p className="text-[13px] text-muted-foreground py-8 text-center">No association history found.</p>
            ) : (
              <ul className="divide-y divide-border">
                {associationChangeLog.map((log, i) => (
                  <li key={i} className="py-3 text-[13px]">
                    <div className="font-medium text-foreground">{log.action}</div>
                    <div className="text-muted-foreground mt-1">{JSON.stringify(log.details)}</div>
                    <div className="text-muted-foreground/70 text-[12px] mt-1">
                      {new Date(log.date_of_change || log.created_at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setAssociationHistoryOpen(false)} className="px-4 py-2 rounded border border-input hover:bg-muted text-[14px]">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review and manage associations */}
      <Dialog open={reviewAssociationsOpen} onOpenChange={setReviewAssociationsOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review and manage associations</DialogTitle>
            <DialogDescription>Link or unlink contacts and deals for this company.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-[13px] mb-2 text-foreground">Contacts ({linkedContacts.length})</h4>
              <input
                value={associationSearch}
                onChange={(e) => setAssociationSearch(e.target.value)}
                placeholder="Search contacts..."
                className="w-full mb-2 px-3 py-1.5 text-[13px] rounded border border-input"
              />
              <div className="max-h-48 overflow-y-auto border border-border rounded divide-y divide-border">
                {linkedContacts
                  .filter((c) => `${c.first_name}${c.last_name ? ' ' + c.last_name : ''}`?.toLowerCase().includes(associationSearch.toLowerCase()))
                  .map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-3 py-2 text-[13px]">
                      <span>{`${c.first_name}${c.last_name ? ' ' + c.last_name : ''}`}</span>
                      <button
                        className="text-destructive hover:underline"
                        onClick={async () => {
                          await contactsService.update(c.id as string, { company_id: null } as any)
                          setLinkedContacts((prev) => prev.filter((x) => x.id !== c.id))
                          setCandidateContacts((prev) => [...prev, c])
                          toast.success(`Unlinked ${`${c.first_name}${c.last_name ? ' ' + c.last_name : ''}`}`)
                        }}
                      >
                        Unlink
                      </button>
                    </div>
                  ))}
                {candidateContacts
                  .filter((c) => `${c.first_name}${c.last_name ? ' ' + c.last_name : ''}`?.toLowerCase().includes(associationSearch.toLowerCase()))
                  .map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-3 py-2 text-[13px]">
                      <span>{`${c.first_name}${c.last_name ? ' ' + c.last_name : ''}`}</span>
                      <button
                        className="text-primary hover:underline"
                        onClick={async () => {
                          await contactsService.update(c.id as string, { company_id: id as string })
                          setCandidateContacts((prev) => prev.filter((x) => x.id !== c.id))
                          setLinkedContacts((prev) => [...prev, c])
                          toast.success(`Linked ${`${c.first_name}${c.last_name ? ' ' + c.last_name : ''}`}`)
                        }}
                      >
                        Link
                      </button>
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-[13px] mb-2 text-foreground">Deals ({linkedDeals.length})</h4>
              <div className="max-h-48 overflow-y-auto border border-border rounded divide-y divide-border">
                {linkedDeals.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-3 py-2 text-[13px]">
                    <span>{d.title}</span>
                    <button
                      className="text-destructive hover:underline"
                      onClick={async () => {
                        await dealsService.update(d.id as string, { company_id: null } as any)
                        setLinkedDeals((prev) => prev.filter((x) => x.id !== d.id))
                        setCandidateDeals((prev) => [...prev, d])
                        toast.success(`Unlinked ${d.title}`)
                      }}
                    >
                      Unlink
                    </button>
                  </div>
                ))}
                {candidateDeals.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-3 py-2 text-[13px]">
                    <span>{d.title}</span>
                    <button
                      className="text-primary hover:underline"
                      onClick={async () => {
                        await dealsService.update(d.id as string, { company_id: id as string })
                        setCandidateDeals((prev) => prev.filter((x) => x.id !== d.id))
                        setLinkedDeals((prev) => [...prev, d])
                        toast.success(`Linked ${d.title}`)
                      }}
                    >
                      Link
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setReviewAssociationsOpen(false)} className="px-4 py-2 rounded border border-input hover:bg-muted text-[14px]">Done</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summarize record */}
      <Dialog open={summarizeOpen} onOpenChange={setSummarizeOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Company summary</DialogTitle>
            <DialogDescription>Auto-generated summary based on stored data.</DialogDescription>
          </DialogHeader>
          <div className="text-[14px] text-foreground leading-relaxed space-y-2">
            {!company ? (
              <p className="text-muted-foreground">No data available.</p>
            ) : (
              (() => {
                const contacts = company.contacts || []
                const deals = company.deals || []
                const openDeals = deals.filter((d) => !['closed_won', 'closed_lost'].includes(d.stage || ''))
                const openValue = openDeals.reduce((s, d) => s + (d.amount || 0), 0)
                const lastActivity = company.activities?.length
                  ? new Date(Math.max(...company.activities.map((a) => new Date(a.created_at || 0).getTime()))).toLocaleDateString()
                  : 'None'
                const created = company.created_at ? new Date(company.created_at).getFullYear() : null
                const tenure = created ? `${new Date().getFullYear() - created} year(s)` : 'Unknown'
                return (
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>{company.name}</strong> ({company.industry || 'No industry'}).</li>
                    <li>{contacts.length} associated contact(s).</li>
                    <li>{openDeals.length} open deal(s) worth {formatCurrency(openValue)}.</li>
                    <li>Last activity: {lastActivity}.</li>
                    <li>Customer for: {tenure}.</li>
                  </ul>
                )
              })()
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setSummarizeOpen(false)} className="px-4 py-2 rounded border border-input hover:bg-muted text-[14px]">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View record access */}
      <Dialog open={recordAccessOpen} onOpenChange={setRecordAccessOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record access</DialogTitle>
            <DialogDescription>Who can view and edit this company record.</DialogDescription>
          </DialogHeader>
          <div className="text-[14px] space-y-2">
            <p><strong>Workspace:</strong> {company?.workspace_id ?? '—'}</p>
            <p><strong>Owner:</strong> {company?.owner ? `${company.owner.first_name}${company.owner.last_name ? ' ' + company.owner.last_name : ''}` : 'Unassigned'}</p>
            <p><strong>Members with access:</strong> {profiles.length}</p>
            <p className="text-muted-foreground text-[13px]">All members of the workspace can view and edit this record.</p>
          </div>
          <DialogFooter>
            <button onClick={() => setRecordAccessOpen(false)} className="px-4 py-2 rounded border border-input hover:bg-muted text-[14px]">Close</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge – select target */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Merge company</DialogTitle>
            <DialogDescription>Select another company to merge into this one.</DialogDescription>
          </DialogHeader>
          <input
            value={mergeSearch}
            onChange={(e) => setMergeSearch(e.target.value)}
            placeholder="Search companies..."
            className="w-full px-3 py-2 text-[14px] rounded border border-input"
          />
          <div className="max-h-60 overflow-y-auto divide-y divide-border border border-border rounded">
            {candidateCompanies
              .filter((c) => c.name?.toLowerCase().includes(mergeSearch.toLowerCase()))
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setMergeTargetId(c.id as string); setMergeConfirmOpen(true) }}
                  className="w-full text-left px-3 py-2 text-[14px] hover:bg-muted flex items-center justify-between"
                >
                  <span>{c.name}</span>
                  {mergeTargetId === c.id && <span className="text-primary text-[12px]">Selected</span>}
                </button>
              ))}
            {candidateCompanies.filter((c) => c.name?.toLowerCase().includes(mergeSearch.toLowerCase())).length === 0 && (
              <p className="text-[13px] text-muted-foreground py-6 text-center">No companies found.</p>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setMergeOpen(false)} className="px-4 py-2 rounded border border-input hover:bg-muted text-[14px]">Cancel</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={mergeConfirmOpen} onOpenChange={setMergeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Merge companies?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move associations from the selected company into this one and then delete the selected company. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMergeConfirmOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!mergeTargetId) return
                try {
                  const target = (await companiesService.getById(mergeTargetId, company?.workspace_id!)).data as Company | undefined
                  const targetContacts = (target?.contacts || []) as Contact[]
                  for (const c of targetContacts) {
                    await contactsService.update(c.id as string, { company_id: id as string })
                  }
                  const targetDeals = (target?.deals || []) as Deal[]
                  for (const d of targetDeals) {
                    await dealsService.update(d.id as string, { company_id: id as string })
                  }
                  await companiesService.delete(mergeTargetId)
                  toast.success('Companies merged')
                  setMergeConfirmOpen(false)
                  setMergeOpen(false)
                  fetchData()
                } catch (e) {
                  toast.error('Merge failed')
                }
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Merge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CrmDetailLayout>
  )
}
