"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { usePanelCards } from "@/hooks/use-panel-cards"
import { CrmDetailLayout, CrmDetailLeftPanel, CrmDetailCenterPanel, CrmDetailRightPanel } from "@/components/crm/CrmDetailLayout"
import { contactsService } from "@/services/contacts"
import { companiesService } from "@/services/companies"
import { dealsService } from "@/services/deals"
import { ticketsService } from "@/services/tickets"
import { activitiesService } from "@/services/activities"
import { notesService } from "@/services/notes"
import { tasksService } from "@/services/tasks"
import { Contact, Company, Deal } from "@/lib/types/crm"
import { laravelApi } from "@/lib/laravel-api"
import { logAudit } from "@/lib/audit"
import { DetailPageSkeleton } from "@/components/crm/Skeletons"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Building2,
  ChevronLeft, ChevronDown, Settings, ExternalLink,
  User, Search,
  FileText, Sparkles, Pencil,
} from "lucide-react"
import { ALL_ACTIVITY_TYPES } from "@/components/activity/ActivityFilterPopover"
import { ActivityFeedCenterPanel } from "@/components/crm/ActivityFeedCenterPanel"

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import { exportToCSV, formatCurrency } from "@/lib/utils"
import { useRealtime } from "@/hooks/use-realtime"
import { useAuth } from "@/hooks/use-auth"
import { LifecycleDropdown } from "@/components/crm/LifecycleDropdown"
import { EditableField, type FieldOption } from "@/components/crm/EditableField"
import { CONTACT_FIELD_CONFIG } from "@/lib/field-configs/contacts"
import { PropertyHistoryDialog } from "@/components/crm/detail/PropertyHistoryDialog"
import { CustomFieldsDisplay } from "@/components/properties/CustomFieldsDisplay"
import { EditRecordSheet, type EditFieldConfig } from "@/components/properties/EditRecordSheet"

function QuickEditContactPopover({ contact, onUpdate }: { contact: Contact, onUpdate: (data: Partial<Contact>) => Promise<void> }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [formData, setFormData] = React.useState({
    first_name: contact.first_name || '',
    last_name: contact.last_name || '',
    job_title: contact.custom_fields?.job_title as string || '',
    email: contact.email || ''
  })
  const [isSaving, setIsSaving] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        job_title: contact.custom_fields?.job_title as string || '',
        email: contact.email || ''
      })
    }
  }, [isOpen, contact])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        custom_fields: {
          ...contact.custom_fields,
          job_title: formData.job_title
        }
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
            <label className="text-[12px] text-muted-foreground/60">First Name</label>
            <Input
              value={formData.first_name}
              onChange={e => setFormData(f => ({ ...f, first_name: e.target.value }))}
              className="h-8 text-[14px] px-2 py-1"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[12px] text-muted-foreground/60">Last Name</label>
            <Input
              value={formData.last_name}
              onChange={e => setFormData(f => ({ ...f, last_name: e.target.value }))}
              className="h-8 text-[14px] px-2 py-1"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[12px] text-muted-foreground/60">Job Title</label>
            <Input
              value={formData.job_title}
              onChange={e => setFormData(f => ({ ...f, job_title: e.target.value }))}
              className="h-8 text-[14px] px-2 py-1"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[12px] text-muted-foreground/60">Email</label>
            <Input
              value={formData.email}
              onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
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

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { workspaceId, loading: authLoading } = useAuth()

  React.useEffect(() => {
    if (!authLoading && !workspaceId) {
      router.replace("/login")
    }
  }, [authLoading, workspaceId, router])
  const { isEnabled, customLeftCards, customRightCards, leftAddedIds, ready } = usePanelCards()
  const [contact, setContact] = React.useState<Contact | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [currentUser, setCurrentUser] = React.useState<any>(null)
  const [profiles, setProfiles] = React.useState<Profile[]>([])
  const [activities, setActivities] = React.useState<any[]>([])
  const [notes, setNotes] = React.useState<any[]>([])
  const [tickets, setTickets] = React.useState<any[]>([])
  const [tasks, setTasks] = React.useState<any[]>([])
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>(ALL_ACTIVITY_TYPES)
  const [activeEditor, setActiveEditor] = React.useState<'note' | 'email' | 'task' | 'call' | 'meeting' | 'ticket' | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [timeFilter, setTimeFilter] = React.useState('all')
  const [assignedToFilter, setAssignedToFilter] = React.useState('all')
  const [isCollapsedAll, setIsCollapsedAll] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('all')
  const [isDealSheetOpen, setIsDealSheetOpen] = React.useState(false)
  const [isTicketSheetOpen, setIsTicketSheetOpen] = React.useState(false)
  const [isCompanySheetOpen, setIsCompanySheetOpen] = React.useState(false)
  const [isNoteSheetOpen, setIsNoteSheetOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  // Actions dropdown modals / dialogs
  const [propertyHistoryOpen, setPropertyHistoryOpen] = React.useState(false)
  const [associationHistoryOpen, setAssociationHistoryOpen] = React.useState(false)
  const [reviewAssociationsOpen, setReviewAssociationsOpen] = React.useState(false)
  const [summarizeOpen, setSummarizeOpen] = React.useState(false)
  const [recordAccessOpen, setRecordAccessOpen] = React.useState(false)
  const [mergeOpen, setMergeOpen] = React.useState(false)
  const [mergeTargetId, setMergeTargetId] = React.useState<string>('')
  const [mergeConfirmOpen, setMergeConfirmOpen] = React.useState(false)

  const [aboutEditOpen, setAboutEditOpen] = React.useState(false)
  const contactAboutFields: EditFieldConfig[] = [
    { name: "email", label: "Email", type: "email" },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "source", label: "Source", type: "text" },
  ]
  const [mergeSearch, setMergeSearch] = React.useState('')
  const [mergeCandidates, setMergeCandidates] = React.useState<Contact[]>([])
  const [associationChangeLog, setAssociationChangeLog] = React.useState<any[]>([])
  const [associationSearch, setAssociationSearch] = React.useState('')
  const [candidateCompanies, setCandidateCompanies] = React.useState<Company[]>([])
  const [candidateDeals, setCandidateDeals] = React.useState<Deal[]>([])
  const [linkedCompanies, setLinkedCompanies] = React.useState<Company[]>([])
  const [linkedDeals, setLinkedDeals] = React.useState<Deal[]>([])

  const ownerOptions: FieldOption[] = React.useMemo(() => [
    { label: "Unassigned", value: "" },
    ...profiles.map((p: Profile) => ({
      label: `${p.first_name} ${p.last_name}`,
      value: p.clerk_user_id || p.id,
    })),
  ], [profiles])

  const fetchData = React.useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const [contactRes, userRes, profilesRes, activitiesRes, notesRes, ticketsRes, tasksRes] = await Promise.all([
        contactsService.getById(id, workspaceId),
        authService.getCurrentUser(),
        authService.listProfiles(workspaceId),
        activitiesService.getAll({ workspace_id: workspaceId, contact_id: id }),
        notesService.getAll({ workspace_id: workspaceId, contact_id: id }),
        ticketsService.getAll({ workspace_id: workspaceId, contact_id: id }),
        tasksService.getAll({ workspace_id: workspaceId, contact_id: id }),
      ])

      if (contactRes.error) throw contactRes.error
      setContact((contactRes.data || null) as any as Contact)
      setCurrentUser(userRes.data)
      setProfiles(profilesRes.data || [])
      setActivities(activitiesRes.data || [])
      setNotes(notesRes.data || [])
      setTickets(ticketsRes.data || [])
      setTasks(tasksRes.data || [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to load contact data")
    } finally {
      setIsLoading(false)
    }
  }, [id, workspaceId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Real-time synchronization
  useRealtime(React.useCallback((payload: any) => {
    // Silent refresh to avoid disrupting user with skeletons
    const silentRefresh = async () => {
      if (!workspaceId) return
      try {
        const [contactRes] = await Promise.all([
          contactsService.getById(id, workspaceId)
        ])
        if (contactRes.data) {
          setContact(contactRes.data as unknown as Contact)
        }
      } catch (err) {
        console.error("Silent refresh failed:", err);
      }
    };
    silentRefresh();
  }, [id, workspaceId]));

  const handleUpdateContact = React.useCallback(async (data: Partial<Contact>) => {
    if (!contact || !workspaceId) return
    try {
      const res = await contactsService.update(contact.id, data as any, workspaceId)
      if (res.error) throw res.error
      setContact(prev => prev ? { ...prev, ...data } : null)
      if (workspaceId) {
        await logAudit({
          workspace_id: workspaceId,
          action: 'Update',
          category: 'Contact',
          subcategory: 'Contact Updated',
          source: 'web',
          modifiedBy: currentUser,
          recordId: contact.id,
          recordType: 'Contact',
        })
      }
      toast.success("Contact updated")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update contact")
    }
  }, [contact, workspaceId])

  const handleDeleteContact = React.useCallback(() => {
    if (!contact) return
    setDeleteDialogOpen(true)
  }, [contact])

  const execDeleteContact = React.useCallback(async () => {
    if (!contact || !workspaceId) return
    try {
      const { error } = await contactsService.delete(contact.id, workspaceId)
      if (error) throw error
      toast.success("Contact deleted")
      router.push("/contacts")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete contact")
    }
  }, [contact, router, workspaceId])

  const activeWorkspace = useAuth().activeWorkspace

  const handleToggleFollow = React.useCallback(async () => {
    if (!contact || !workspaceId) return
    const next = !contact.isFollowing
    try {
      const res = await contactsService.update(contact.id, { isFollowing: next } as any, workspaceId)
      if (res.error) throw res.error
      setContact(prev => prev ? { ...prev, isFollowing: next } : null)
      toast.success(next ? "Now following this contact" : "Unfollowed this contact")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update follow state")
    }
  }, [contact, workspaceId])

  const handleToggleEmailOptOut = React.useCallback(async () => {
    if (!contact || !workspaceId) return
    const next = !contact.emailOptOut
    try {
      const res = await contactsService.update(contact.id, { emailOptOut: next } as any, workspaceId)
      if (res.error) throw res.error
      setContact(prev => prev ? { ...prev, emailOptOut: next } : null)
      toast.success(next ? "Contact opted out of email" : "Contact opted back into email")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update email opt-out")
    }
  }, [contact, workspaceId])

  const loadPropertyHistory = React.useCallback(() => {
    setPropertyHistoryOpen(true)
  }, [])

  const loadAssociationHistory = React.useCallback(async () => {
    if (!contact || !workspaceId) return
    setAssociationHistoryOpen(true)
    try {
      const { data } = await laravelApi.get<{ logs: any[] }>('/audit-log', {
        workspace_id: workspaceId,
        category: 'Contact',
        subcategory: 'Association Changed',
        page: 1,
        page_size: 200,
      })
      const logs = data?.logs || []
      const entries = logs.filter((e: any) => e.record_id === contact.id)
      setAssociationChangeLog(entries)
    } catch {
      setAssociationChangeLog([])
    }
  }, [contact, workspaceId])

  const handleSummarize = React.useCallback(() => {
    if (!contact) return
    setSummarizeOpen(true)
  }, [contact])

  const openReviewAssociations = React.useCallback(async () => {
    if (!contact || !workspaceId) return
    setReviewAssociationsOpen(true)
    const [companies, deals] = await Promise.all([
      companiesService.getAll({ workspace_id: workspaceId, limit: 100 }),
      dealsService.getAll({}, { workspace_id: workspaceId, limit: 100 }),
    ])
    setCandidateCompanies(companies.data || [])
    setCandidateDeals(deals.data || [])
    const linked: Company[] = contact.company_id
      ? (companies.data || []).filter(c => c.id === contact.company_id)
      : (companies.data || []).filter(c => (c.contacts || []).some((x: any) => x.id === contact.id))
    setLinkedCompanies(linked)
    setLinkedDeals((deals.data || []).filter(d => d.contact_id === contact.id))
  }, [contact, workspaceId])

  const handleLinkCompany = React.useCallback(async (companyId: string) => {
    if (!contact || !workspaceId) return
    try {
      const res = await contactsService.update(contact.id, { company_id: companyId } as any, workspaceId)
      if (res.error) throw res.error
      const linked = await companiesService.getById(companyId, workspaceId)
      setContact(prev => prev ? ({ ...prev, company_id: companyId } as Contact) : null)
      if (linked.data) setLinkedCompanies(prev => [...prev, linked.data as Company])
      await logAudit({ workspace_id: workspaceId, action: 'Update', category: 'Contact', subcategory: 'Association Changed', source: 'web', modifiedBy: currentUser, recordId: contact.id, recordType: 'Contact' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to link company")
    }
  }, [contact, workspaceId, currentUser])

  const handleUnlinkCompany = React.useCallback(async (companyId: string) => {
    if (!contact || !workspaceId) return
    try {
      const res = await contactsService.update(contact.id, { company_id: null } as any, workspaceId)
      if (res.error) throw res.error
      setContact(prev => prev ? ({ ...prev, company_id: null } as unknown as Contact) : null)
      setLinkedCompanies(prev => prev.filter(c => c.id !== companyId))
      await logAudit({ workspace_id: workspaceId, action: 'Update', category: 'Contact', subcategory: 'Association Changed', source: 'web', modifiedBy: currentUser, recordId: contact.id, recordType: 'Contact' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to unlink company")
    }
  }, [contact, workspaceId, currentUser])

  const handleLinkDeal = React.useCallback(async (dealId: string) => {
    if (!contact || !workspaceId) return
    try {
      const res = await dealsService.update(dealId, { contact_id: contact.id } as any, workspaceId)
      if (res.error) throw res.error
      const deal = (await dealsService.getById(dealId, workspaceId)).data
      if (deal) setLinkedDeals(prev => [...prev, deal])
      await logAudit({ workspace_id: workspaceId, action: 'Update', category: 'Contact', subcategory: 'Association Changed', source: 'web', modifiedBy: currentUser, recordId: contact.id, recordType: 'Contact' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to link deal")
    }
  }, [contact, workspaceId, currentUser])

  const handleUnlinkDeal = React.useCallback(async (dealId: string) => {
    if (!contact || !workspaceId) return
    try {
      const res = await dealsService.update(dealId, { contact_id: null } as any, workspaceId)
      if (res.error) throw res.error
      setLinkedDeals(prev => prev.filter(d => d.id !== dealId))
      await logAudit({ workspace_id: workspaceId, action: 'Update', category: 'Contact', subcategory: 'Association Changed', source: 'web', modifiedBy: currentUser, recordId: contact.id, recordType: 'Contact' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to unlink deal")
    }
  }, [contact, workspaceId, currentUser])

  const handleClone = React.useCallback(async () => {
    if (!contact || !workspaceId) return
    try {
      const clone: Partial<Contact> = {
        ...contact,
        first_name: `${contact.first_name} (Copy)`,
        email: contact.email ? `copy_${contact.email}` : undefined,
        isFollowing: false,
        emailOptOut: contact.emailOptOut ?? false,
      }
      const { data, error } = await contactsService.create(clone as any)
      if (error) throw error
      toast.success("Contact cloned")
      if (data?.id) router.push(`/contacts/${data.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to clone contact")
    }
  }, [contact, workspaceId, router])

  const openMerge = React.useCallback(async () => {
    if (!contact || !workspaceId) return
    setMergeTargetId('')
    setMergeSearch('')
    setMergeOpen(true)
    try {
      const res = await contactsService.getAll({ workspace_id: workspaceId, limit: 1000 })
      setMergeCandidates((res.data || []) as unknown as Contact[])
    } catch {
      setMergeCandidates([])
    }
  }, [contact, workspaceId])

  const execMerge = React.useCallback(async () => {
    if (!contact || !workspaceId || !mergeTargetId) return
    try {
      const dup = await contactsService.getById(mergeTargetId, workspaceId)
      if (!dup.data) throw new Error("Selected contact not found")
      const primary = contact
      // Merge non-conflicting (empty-on-primary) field values from duplicate
      const merged: Record<string, unknown> = { ...primary }
      for (const key of Object.keys(dup.data)) {
        const pv = (primary as any)[key]
        const dv = (dup.data as any)[key]
        if ((pv === undefined || pv === null || pv === '') && dv !== undefined && dv !== null && dv !== '') {
          merged[key] = dv
        }
      }
      const { error: updateErr } = await contactsService.update(primary.id, merged as any, workspaceId)
      if (updateErr) throw updateErr
      // Reassign duplicate's associations to primary
      const [companies, deals, tickets] = await Promise.all([
        companiesService.getAll({ workspace_id: workspaceId, limit: 100 }),
        dealsService.getAll({}, { workspace_id: workspaceId, limit: 100 }),
        ticketsService.getAll({} as any),
      ])
      const dupDeals = (deals.data || []).filter(d => d.contact_id === dup.data!.id)
      await Promise.all(dupDeals.map(d => dealsService.update(d.id, { contact_id: primary.id } as any, workspaceId)))
      const dupTickets = (tickets.data || []).filter(t => t.contact_id === dup.data!.id)
      await Promise.all(dupTickets.map(t => ticketsService.update(t.id, { contact_id: primary.id } as any, workspaceId)))
      // Duplicate's company linkage: only adopt if primary has none
      if (!primary.company_id && dup.data!.company_id) {
        await contactsService.update(primary.id, { company_id: dup.data!.company_id } as any, workspaceId)
      }
      const { error: delErr } = await contactsService.delete(dup.data!.id, workspaceId)
      if (delErr) throw delErr
      await logAudit({ workspace_id: workspaceId, action: 'Merge', category: 'Contact', subcategory: 'Contacts Merged', source: 'web', modifiedBy: currentUser, recordId: primary.id, recordType: 'Contact' })
      toast.success("Contacts merged")
      setMergeOpen(false)
      setMergeConfirmOpen(false)
      fetchData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to merge contacts")
    }
  }, [contact, workspaceId, mergeTargetId, currentUser, fetchData])

  const handleExportContact = React.useCallback(() => {
    if (!contact) return
    const flat: Record<string, unknown> = {
      id: contact.id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      company_id: contact.company_id,
      owner_id: contact.owner_id,
      lifecycle_stage: contact.lifecycle_stage,
      source: contact.source,
      is_following: contact.isFollowing ?? false,
      email_opt_out: contact.emailOptOut ?? false,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
    }
    if (contact.custom_fields) {
      for (const [k, v] of Object.entries(contact.custom_fields)) flat[`cf_${k}`] = v as unknown
    }
    exportToCSV([flat], `contact_${contact.id}`)
    if (workspaceId) {
      logAudit({ workspace_id: workspaceId, action: 'Export', category: 'Contact', subcategory: 'Contact Exported', source: 'web', modifiedBy: currentUser, recordId: contact.id, recordType: 'Contact' })
    }
    toast.success("Contact data exported")
  }, [contact, workspaceId, currentUser])

  const combinedFeed = React.useMemo(() => {
    if (!contact) return []
    const notesItems = notes.map(n => ({ ...n, feedType: 'note' as const }))
    const activitiesItems = activities.map(a => ({ ...a, feedType: 'activity' as const }))
    const ticketsItems = tickets.map(t => ({ ...t, feedType: 'activity' as const, type: 'ticket' }))
    const tasksItems = tasks.map(t => ({
      ...t,
      feedType: 'activity' as const,
      type: 'task',
      owner: t.assigned_to ? { first_name: t.assigned_to.name, last_name: '' } : null,
      completed: t.status === 'completed'
    }))

    // Sort all items by date
    let all = [...notesItems, ...activitiesItems, ...ticketsItems, ...tasksItems].sort((a, b) => {
      const dateA = new Date(a.created_at || (a as any).due_date).getTime()
      const dateB = new Date(b.created_at || (b as any).due_date).getTime()
      return dateB - dateA
    })

    // Tab filter
    if (activeTab !== 'all') {
      all = all.filter(item => {
        if (activeTab === 'notes') return item.feedType === 'note'
        if (activeTab === 'tasks') return item.feedType === 'activity' && item.type === 'task'
        if (activeTab === 'tickets') return item.feedType === 'activity' && item.type === 'ticket'
        if (activeTab === 'activities') return item.feedType === 'activity' && item.type !== 'task' && item.type !== 'ticket'
        if (activeTab === 'emails') return item.feedType === 'activity' && item.type === 'email'
        if (activeTab === 'calls') return item.feedType === 'activity' && item.type === 'call'
        if (activeTab === 'meetings') return item.feedType === 'activity' && item.type === 'meeting'
        return true
      })
    }

    // Filter based on selectedFilters (type popover)
    all = all.filter(item => {
      if (item.feedType === 'note') {
        return selectedFilters.includes("Notes")
      }
      const typeMap: Record<string, string> = {
        'call': 'Calls',
        'email': 'Emails',
        'meeting': 'Meetings',
        'task': 'Tasks',
        'ticket': 'Tickets'
      }
      const label = typeMap[item.type]
      if (label) return selectedFilters.includes(label)
      return false
    })

    // Search filter
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

    // Time filter
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

    // Assigned-to filter
    if (assignedToFilter !== 'all') {
      all = all.filter(item => {
        const ownerId = ('owner_id' in item ? item.owner_id : null)
        const createdBy = ('created_by' in item ? item.created_by : null)
        return ownerId === assignedToFilter || createdBy === assignedToFilter
      })
    }

    return all
  }, [contact, selectedFilters, searchTerm, timeFilter, assignedToFilter, activeTab, notes, activities, tickets, tasks])

  const feedCounts = React.useMemo(() => {
    if (!contact) return { all: 0, notes: 0, tasks: 0, tickets: 0, calls: 0 }
    const notesItems = notes.map(n => ({ ...n, feedType: 'note' as const }))
    const activitiesItems = activities.map(a => ({ ...a, feedType: 'activity' as const }))
    const ticketsItems = tickets.map(t => ({ ...t, feedType: 'activity' as const, type: 'ticket' }))
    const tasksItems = tasks.map(t => ({
      ...t,
      feedType: 'activity' as const,
      type: 'task',
      owner: t.assigned_to ? { first_name: t.assigned_to.name, last_name: '' } : null,
      completed: t.status === 'completed'
    }))
    const all = [...notesItems, ...activitiesItems, ...ticketsItems, ...tasksItems]
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
  }, [contact, notes, activities, tickets, tasks])

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
    if (!contact) return []
    const assocs: { name: string; type: string }[] = []
    assocs.push({ name: `${contact.first_name} ${contact.last_name || ''}`.trim(), type: 'Contact' })
    if (contact.company) {
      assocs.push({ name: contact.company.name, type: 'Company' })
    }
    if (contact.deals && contact.deals.length > 0) {
      contact.deals.forEach(deal => {
        assocs.push({ name: deal.title, type: 'Deal' })
      })
    }
    return assocs
  }, [contact])

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!contact) {
    return (
      <CrmDetailLayout backLine="Contacts" backHref="/contacts">
        <div className="w-full flex flex-col items-center justify-center h-full text-muted-foreground">
          <h2 className="text-xl font-bold mb-2 text-foreground">Contact not found</h2>
          <p>The contact you are looking for does not exist or has been deleted.</p>
        </div>
      </CrmDetailLayout>
    )
  }

  const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim()
  const companyName = contact.company?.name || "No company"
  const ownerName = contact.owner ? `${contact.owner.first_name} ${contact.owner.last_name}` : "Unassigned"

  return (
    <CrmDetailLayout backLine="Contacts" backHref="/contacts">

      {/* LEFT PANEL: Properties */}
      <CrmDetailLeftPanel>

        {/* Profile Card Summary */}
        <div className="bg-background border border-border rounded-md shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link href="/contacts" className="flex items-center text-foreground text-[14px] font-bold">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Contacts
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
                  onClick={handleToggleFollow}
                >
                  {contact?.isFollowing ? "Unfollow" : "Follow"}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent"
                  onClick={() => router.push("/settings/properties?object_type=contact")}
                >
                  View all properties
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent"
                  onClick={loadPropertyHistory}
                >
                  View property history
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent"
                  onClick={loadAssociationHistory}
                >
                  View association history
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent"
                  onClick={openReviewAssociations}
                >
                  Review associations
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent flex items-center gap-3"
                  onClick={handleSummarize}
                >
                  <Sparkles className="w-4 h-4" />
                  Summarize
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent flex items-center justify-between"
                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(fullName)}`, "_blank")}
                >
                  Search in Google
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent"
                  onClick={handleToggleEmailOptOut}
                >
                  {contact?.emailOptOut ? "Opt back into email" : "Opt out of email"}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem
                  className="text-[14px] text-muted-foreground/60 px-4 py-2 flex items-center justify-between cursor-not-allowed"
                  title="Restore activity is unavailable: this app never soft-deletes or archives activities, so there is nothing to restore."
                  aria-disabled="true"
                >
                  Restore activity
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent"
                  onClick={() => setRecordAccessOpen(true)}
                >
                  View record access
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent"
                  onClick={openMerge}
                >
                  Merge
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent"
                  onClick={handleClone}
                >
                  Clone
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[14px] text-destructive hover:bg-destructive/10" onClick={handleDeleteContact}>
                  Delete
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border my-1" />

                <DropdownMenuItem
                  className="text-[14px] text-foreground px-4 py-2 cursor-pointer hover:bg-accent"
                  onClick={handleExportContact}
                >
                  Export contact data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div className="flex flex-col mt-1 min-w-0 flex-1">
                <div className="flex items-center gap-1 group min-w-0 w-full">
                  <h1 className="text-[20px] font-bold text-foreground leading-tight truncate">
                    {fullName}
                  </h1>
                  <div className="shrink-0">
                    <QuickEditContactPopover contact={contact!} onUpdate={handleUpdateContact} />
                  </div>
                </div>
                <p className="text-[14px] text-foreground mt-1.5 break-words">
                  {contact.custom_fields?.job_title as string || companyName}
                </p>
                <div className="flex items-center gap-1.5 mt-2 group min-w-0 w-full">
                  <a href={`mailto:${contact.email}`} className="text-[14px] font-bold text-primary hover:underline underline-offset-2 truncate">
                    {contact.email || "--"}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About this contact Card */}
        <div className="bg-background border border-border rounded-md shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
              <h3 className="font-bold text-[16px] text-foreground">About this contact</h3>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-[14px] font-bold text-foreground flex items-center gap-1 opacity-100">
                Actions <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
              </button>
              <button
                onClick={() => setAboutEditOpen(true)}
                className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-muted/30 text-muted-foreground"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {CONTACT_FIELD_CONFIG
              .filter((f) => f.showInFullPage !== false)
              .map((f) => (
                <div key={f.key} className="group relative">
                  <label className="text-[13px] text-muted-foreground block mb-1">{f.label}</label>
                  {f.type === "lifecycle" ? (
                    <LifecycleDropdown
                      value={contact.lifecycle_stage || null}
                      objectType={f.lifecycleObjectType || "contact"}
                      onChange={async (v) => { await handleUpdateContact({ lifecycle_stage: v } as any) }}
                    />
                  ) : f.key === "owner_id" ? (
                    <EditableField
                      value={contact.owner_id || null}
                      type="owner"
                      options={ownerOptions}
                      editable={f.editable}
                      layout="stacked"
                      renderReadonly={() => ownerName}
                      onSave={async (v) => { await handleUpdateContact({ owner_id: v as string || null } as any) }}
                    />
                  ) : f.key === "company_id" ? (
                    <EditableField
                      value={(contact as any)[f.key] ?? null}
                      type={f.type as any}
                      editable={f.editable}
                      layout="stacked"
                      renderReadonly={() => companyName === "No company" ? "--" : companyName}
                      onSave={async (v) => { await handleUpdateContact({ [f.key]: v } as any) }}
                    />
                  ) : f.key === "created_at" ? (
                    <div className="text-[13px] text-foreground font-medium">
                      {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : "--"}
                    </div>
                  ) : (
                    <EditableField
                      value={(contact as any)[f.key] ?? null}
                      type={f.type as any}
                      options={f.options}
                      editable={f.editable}
                      layout="stacked"
                      onSave={async (v) => { await handleUpdateContact({ [f.key]: v } as any) }}
                    />
                  )}
                </div>
              ))}

            <CustomFieldsDisplay objectType="contact" values={contact.custom_fields || {}} />
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
                  <button className="text-[14px] font-bold text-foreground flex items-center gap-1 opacity-100">
                    Actions <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                  </button>
                  <button
                    onClick={() => router.push(`/contacts/${id}/settings?edit=${card.id}`)}
                    className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-muted/30 text-muted-foreground"
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
        <ActivityFeedCenterPanel
          entityType="contact"
          entityId={id}
          workspaceId={contact?.workspace_id ?? undefined}
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
                <h3 className="font-bold text-[14px] text-foreground">Notes ({contact.notes?.length || 0})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNoteSheetOpen(true)}
                  className="text-[14px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  Add
                </button>
                <button
                  onClick={() => router.push(`/contacts/${id}/settings`)}
                  className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-muted/30 text-muted-foreground transition-colors shrink-0"
                  title="Customize right panel"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {contact.notes && contact.notes.length > 0 ? (
              <div className="p-4 space-y-2">
                {contact.notes.map((note) => (
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
        {isEnabled("companies") && (
          <div className="bg-background border border-border rounded-md shadow-sm">
            <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
                <h3 className="font-bold text-[14px] text-foreground">Companies ({contact.company_id ? 1 : 0})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCompanySheetOpen(true)}
                  className="text-[14px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  Add
                </button>
                <button
                  onClick={() => router.push(`/contacts/${id}/settings`)}
                  className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-muted/30 text-muted-foreground transition-colors shrink-0"
                  title="Customize right panel"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {contact.company ? (
              <div className="p-4">
                <div className="p-3 bg-background border border-border rounded shadow-sm hover:shadow transition-shadow">
                  <span className="text-[14px] font-bold text-primary hover:underline cursor-pointer">
                    {contact.company.name}
                  </span>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{contact.company.domain || "No domain"}</p>
                </div>
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
                  No business associated.
                </p>
                <button
                  onClick={() => setIsCompanySheetOpen(true)}
                  className="mt-3 text-[13px] font-bold text-primary hover:underline"
                >
                  + Add company
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
                <h3 className="font-bold text-[14px] text-foreground">Deals ({contact.deals?.length || 0})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDealSheetOpen(true)}
                  className="text-[14px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  Add
                </button>
                <button
                  onClick={() => router.push(`/contacts/${id}/settings`)}
                  className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-muted/30 text-muted-foreground transition-colors shrink-0"
                  title="Customize right panel"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {contact.deals && contact.deals.length > 0 ? (
              <div className="p-4 space-y-2">
                {contact.deals.map((deal) => (
                  <div key={deal.id} className="p-3 bg-background border border-border rounded shadow-sm hover:shadow transition-shadow">
                    <span
                      className="text-[14px] font-bold text-primary hover:underline cursor-pointer block"
                      onClick={() => router.push(`/deals/${deal.id}`)}
                    >
                      {deal.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[13px] font-bold text-foreground">${deal.amount?.toLocaleString() ?? '0'}</span>
                      <span className="text-[11px] text-muted-foreground uppercase font-bold">â€¢ {deal.stage?.replace(/_/g, ' ')}</span>
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
                <h3 className="font-bold text-[14px] text-foreground">Tickets ({contact.tickets?.length || 0})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTicketSheetOpen(true)}
                  className="text-[14px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  Add
                </button>
                <button
                  onClick={() => router.push(`/contacts/${id}/settings`)}
                  className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-muted/30 text-muted-foreground transition-colors shrink-0"
                  title="Customize right panel"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {contact.tickets && contact.tickets.length > 0 ? (
              <div className="p-4 space-y-2">
                {contact.tickets.map((ticket) => (
                  <div key={ticket.id} className="p-3 bg-background border border-border rounded shadow-sm hover:shadow transition-shadow">
                    <span className="text-[14px] font-bold text-primary hover:underline cursor-pointer block">{ticket.subject}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-[11px] font-bold px-1.5 py-0.5 rounded",
                        (ticket.status || 'open') === 'open' ? 'bg-status-success/10 text-status-success' : 'bg-muted text-foreground/70'
                      )}>
                        {(ticket.status || 'open').toUpperCase()}
                      </span>
                      <span className="text-[11px] text-muted-foreground uppercase font-bold">â€¢ {ticket.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center text-center">
                <p className="text-[13px] text-muted-foreground">No tickets found.</p>
                <button
                  onClick={() => setIsTicketSheetOpen(true)}
                  className="mt-3 text-[13px] font-bold text-primary hover:underline"
                >
                  + Create a ticket
                </button>
              </div>
            )}
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
                <button className="text-[12px] font-bold text-foreground hover:text-primary">+ Add</button>
                <button
                  onClick={() => router.push(`/contacts/${id}/settings`)}
                  className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-muted/30 text-muted-foreground"
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
                <div className="w-full space-y-3 px-4 py-2">
                  <div className="p-2 border border-border rounded text-[12px] text-left text-foreground/70 font-medium hover:bg-muted/30 cursor-pointer transition-colors">
                    Summarize record
                    <div className="text-[10px] text-muted-foreground">Last enrolled April 28, 2025 3:14PM</div>
                  </div>
                  <div className="p-2 border border-border rounded text-[12px] text-left text-foreground/70 font-medium hover:bg-muted/30 cursor-pointer transition-colors">
                    Sync record to 3rd party
                  </div>
                  <button className="w-full py-1.5 border border-border rounded text-[12px] font-bold text-foreground hover:bg-accent">
                    Enroll in Workflow
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </CrmDetailRightPanel>

      {/* Add Deal Sheet â€” two tabs: Create new / Add existing */}
      <AddDealSheet
        open={isDealSheetOpen}
        onClose={() => setIsDealSheetOpen(false)}
        contactId={id}
        contactName={contact ? `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() : undefined}
        companyId={contact?.company_id ?? undefined}
        workspaceId={contact?.workspace_id ?? undefined}
        onSuccess={() => { fetchData(); setIsDealSheetOpen(false) }}
      />

      <AddTicketSheet
        open={isTicketSheetOpen}
        onClose={() => setIsTicketSheetOpen(false)}
        contactId={id}
        contactName={contact ? `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() : undefined}
        companyId={contact?.company_id ?? undefined}
        workspaceId={contact?.workspace_id ?? undefined}
        onSuccess={() => { fetchData(); setIsTicketSheetOpen(false) }}
      />

      <AddCompanySheet
        open={isCompanySheetOpen}
        onClose={() => setIsCompanySheetOpen(false)}
        contactId={id}
        contactName={fullName}
        workspaceId={contact?.workspace_id ?? undefined}
        onSuccess={() => { fetchData(); setIsCompanySheetOpen(false) }}
      />

      <NoteEditorSheet
        open={isNoteSheetOpen}
        onClose={() => setIsNoteSheetOpen(false)}
        onSaved={() => { fetchData(); setIsNoteSheetOpen(false) }}
        entityType="contact"
        entityId={id as string}
        workspaceId={contact?.workspace_id ?? ""}
      />

      <EditRecordSheet
        open={aboutEditOpen}
        onOpenChange={setAboutEditOpen}
        objectType="contact"
        title="Contact"
        fields={contactAboutFields}
        initialValues={contact || {}}
        onSave={handleUpdateContact}
      />

      <EmailEditorSheet
        open={activeEditor === 'email'}
        onClose={() => setActiveEditor(null)}
        onSaved={fetchData}
        entityType="contact"
        entityId={id as string}
        workspaceId={contact?.workspace_id ?? ""}
      />
      <CallEditorSheet
        open={activeEditor === 'call'}
        onClose={() => setActiveEditor(null)}
        onSaved={fetchData}
        entityType="contact"
        entityId={id as string}
        workspaceId={contact?.workspace_id ?? ""}
      />
      <MeetingEditorSheet
        open={activeEditor === 'meeting'}
        onClose={() => setActiveEditor(null)}
        onSaved={fetchData}
        entityType="contact"
        entityId={id as string}
        workspaceId={contact?.workspace_id ?? ""}
      />

      {/* Property history */}
      <PropertyHistoryDialog
        open={propertyHistoryOpen}
        onOpenChange={setPropertyHistoryOpen}
        entityType="contact"
        entityId={id}
        entityLabel="contact"
        entityTitle={
          contact
            ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || contact.email || ""
            : ""
        }
      />

      {/* Association history */}
      <Dialog open={associationHistoryOpen} onOpenChange={setAssociationHistoryOpen}>
        <DialogContent className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Association history</DialogTitle>
            <DialogDescription>
              Changes to this contact&apos;s linked companies and deals.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[420px] overflow-y-auto">
            {associationChangeLog.length === 0 ? (
              <p className="text-[13px] text-muted-foreground py-6 text-center">No association changes recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {associationChangeLog.map((e, i) => (
                  <li key={i} className="text-[13px] border border-border rounded p-3">
                    <div className="font-medium text-foreground">{e.modified_by_name || "System"}</div>
                    <div className="text-muted-foreground">{new Date(e.date_of_change).toLocaleString()}</div>
                    {e.changes && <pre className="mt-1 text-[12px] whitespace-pre-wrap">{JSON.stringify(e.changes, null, 2)}</pre>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssociationHistoryOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review associations */}
      <Dialog open={reviewAssociationsOpen} onOpenChange={setReviewAssociationsOpen}>
        <DialogContent className="max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Review associations</DialogTitle>
            <DialogDescription>
              Linked companies and deals for this contact. Add or remove associations below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[460px] overflow-y-auto">
            <div>
              <h4 className="text-[13px] font-semibold mb-2 text-foreground">Companies</h4>
              <div className="space-y-2">
                {linkedCompanies.map(c => (
                  <div key={c.id} className="flex items-center justify-between border border-border rounded p-2">
                    <span className="text-[13px]">{c.name}</span>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleUnlinkCompany(c.id)}>Remove</Button>
                  </div>
                ))}
                {linkedCompanies.length === 0 && <p className="text-[12px] text-muted-foreground">No companies linked.</p>}
              </div>
              <div className="mt-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={associationSearch}
                  onChange={e => setAssociationSearch(e.target.value)}
                  placeholder="Search companies to link..."
                  className="pl-9"
                />
              </div>
              <div className="mt-2 space-y-1">
                {candidateCompanies
                  .filter(c => c.name?.toLowerCase().includes(associationSearch.toLowerCase()) && !linkedCompanies.some(l => l.id === c.id))
                  .slice(0, 6)
                  .map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleLinkCompany(c.id)}
                      className="w-full text-left text-[13px] px-2 py-1.5 rounded hover:bg-accent"
                    >
                      {c.name}
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="text-[13px] font-semibold mb-2 text-foreground">Deals</h4>
              <div className="space-y-2">
                {linkedDeals.map(d => (
                  <div key={d.id} className="flex items-center justify-between border border-border rounded p-2">
                    <span className="text-[13px]">{d.title}</span>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleUnlinkDeal(d.id)}>Remove</Button>
                  </div>
                ))}
                {linkedDeals.length === 0 && <p className="text-[12px] text-muted-foreground">No deals linked.</p>}
              </div>
              <div className="mt-2 space-y-1">
                {candidateDeals
                  .filter(d => d.title?.toLowerCase().includes(associationSearch.toLowerCase()) && !linkedDeals.some(l => l.id === d.id))
                  .slice(0, 6)
                  .map(d => (
                    <button
                      key={d.id}
                      onClick={() => handleLinkDeal(d.id)}
                      className="w-full text-left text-[13px] px-2 py-1.5 rounded hover:bg-accent"
                    >
                      {d.title}
                    </button>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewAssociationsOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summarize */}
      <Dialog open={summarizeOpen} onOpenChange={setSummarizeOpen}>
        <DialogContent className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Contact summary</DialogTitle>
            <DialogDescription>Auto-generated from this contact&apos;s current data.</DialogDescription>
          </DialogHeader>
          {contact && (
            <div className="space-y-3 text-[14px]">
              <p className="font-medium text-foreground">{fullName}</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Open deals: {(contact.deals || []).length} (total value {formatCurrency((contact.deals || []).reduce((s, d) => s + (d.amount || 0), 0))})</li>
                <li>Open tickets: {(contact.tickets || []).filter(t => (t.status || 'open') === 'open').length}</li>
                <li>Last activity: {contact.activities && contact.activities.length > 0
                  ? new Date(Math.max(...contact.activities.map(a => new Date(a.created_at).getTime()))).toLocaleDateString()
                  : "No activity yet"}</li>
                <li>Created: {new Date(contact.created_at).toLocaleDateString()} ({(() => {
                  const days = Math.floor((Date.now() - new Date(contact.created_at).getTime()) / 86400000)
                  return days <= 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`
                })()})</li>
                <li>Lifecycle stage: {contact.lifecycle_stage || "Unknown"}</li>
                <li>Following: {contact.isFollowing ? "Yes" : "No"} آ· Email opted out: {contact.emailOptOut ? "Yes" : "No"}</li>
              </ul>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSummarizeOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record access */}
      <Dialog open={recordAccessOpen} onOpenChange={setRecordAccessOpen}>
        <DialogContent className="max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Record access</DialogTitle>
            <DialogDescription>Who can view this contact record.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 border border-border rounded p-3">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <div className="text-[13px]">
                <div className="font-medium text-foreground">All members of {activeWorkspace?.name || "this workspace"}</div>
                <div className="text-muted-foreground">Workspace-level access â€” no per-record permission granularity exists in this build.</div>
              </div>
            </div>
            <div className="text-[12px] text-muted-foreground">
              {profiles.length} member{profiles.length === 1 ? "" : "s"} in this workspace can view this record.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordAccessOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge: select target */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Merge contact</DialogTitle>
            <DialogDescription>
              Select another contact to merge into {fullName}. The primary record is kept; empty fields are filled from the duplicate and its deals, tickets and activities are reassigned before the duplicate is deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={mergeSearch}
              onChange={e => setMergeSearch(e.target.value)}
              placeholder="Search other contacts..."
              className="pl-9"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {mergeCandidates
              .filter(c => c.id !== contact?.id && `${c.first_name} ${c.last_name || ''}`.toLowerCase().includes(mergeSearch.toLowerCase()))
              .slice(0, 20)
              .map(c => (
                <button
                  key={c.id}
                  onClick={() => { setMergeTargetId(c.id); setMergeConfirmOpen(true) }}
                  className="w-full text-left text-[13px] px-3 py-2 rounded hover:bg-accent flex items-center justify-between"
                >
                  <span>{c.first_name} {c.last_name || ''}</span>
                  <span className="text-muted-foreground text-[12px]">{c.email || ''}</span>
                </button>
              ))}
            {mergeCandidates.filter(c => c.id !== contact?.id).length === 0 && (
              <p className="text-[12px] text-muted-foreground text-center py-4">No other contacts available to merge.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge confirmation (destructive) */}
      <AlertDialog open={mergeConfirmOpen} onOpenChange={setMergeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Merge contacts?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the selected duplicate&apos;s associations into {fullName}, fill any empty fields, and permanently delete the duplicate. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={execMerge}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Merge &amp; delete duplicate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold">{contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : 'this contact'}</span> and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={execDeleteContact}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete contact
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CrmDetailLayout>
  )
}
