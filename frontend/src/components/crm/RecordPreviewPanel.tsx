"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  X,
  Mail,
  Phone,
  Calendar,
  TicketCheck,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Search,
  StickyNote,
  PhoneCall,
  ListTodo,
  Trash2,
  Pencil,
} from "lucide-react"
import { LifecycleBadge } from "@/components/crm/LifecycleBadge"
import { LifecycleDropdown } from "@/components/crm/LifecycleDropdown"
import { EditableField, type FieldOption } from "@/components/crm/EditableField"
import { CONTACT_FIELD_CONFIG } from "@/lib/field-configs/contacts"
import { COMPANY_FIELD_CONFIG } from "@/lib/field-configs/companies"
import { DEAL_FIELD_CONFIG } from "@/lib/field-configs/deals"
import { TICKET_FIELD_CONFIG } from "@/lib/field-configs/tickets"
import { ORDER_FIELD_CONFIG } from "@/lib/field-configs/orders"
import { PRODUCT_FIELD_CONFIG } from "@/lib/field-configs/products"
import { CALL_FIELD_CONFIG } from "@/lib/field-configs/calls"
import { TASK_FIELD_CONFIG } from "@/lib/field-configs/tasks"
import { ActivityTaskCard } from "@/components/activity/ActivityTaskCard"
import { ActivityLogCard } from "@/components/activity/ActivityLogCard"
import { AssociationBadge } from "@/components/activity/AssociationBadge"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { toast } from "sonner"

import { companiesService } from "@/services/companies"
import { contactsService } from "@/services/contacts"
import { dealsService } from "@/services/deals"
import { activitiesService } from "@/services/activities"
import { ticketsService } from "@/services/tickets"
import { productsService } from "@/services/products"
import { notesService } from "@/services/notes"
import { tasksService } from "@/services/tasks"
import { ordersService, type OrderWithLineItems } from "@/lib/services/orders-service"
import { useAuth } from "@/hooks/use-auth"
import { AddTicketSheet } from "@/app/contacts/[id]/add-ticket-sheet"
import { useRealtime } from "@/hooks/use-realtime"
import { activityCommentsService } from "@/services/activity-comments"
import { authService } from "@/services/auth"
import { RichTextEditor } from "@/components/RichTextEditor"
import Image from "next/image"
import DOMPurify from "dompurify"
import {
  Bold,
  Italic,
  Underline,
  Type,
  Link2,
  Image as ImageIcon,
  Quote,
} from "lucide-react"

import type { Company, Contact, Deal, Activity, Ticket, Product, Note } from "@/lib/types/crm"
import type { ActivityComment, Profile } from "@/lib/types/crm"

export type RecordType =
  | "company"
  | "contact"
  | "deal"
  | "task"
  | "ticket"
  | "note"
  | "call"
  | "order"
  | "product"

export interface KeyField {
  label: string
  displayValue: React.ReactNode
  value: string | number | null
  key: string
  type: "text" | "email" | "phone" | "select" | "number" | "date" | "textarea" | "owner" | "lifecycle" | "toggle" | "richtext"
  editable: boolean
  options?: FieldOption[]
  renderReadonly?: () => React.ReactNode
  lifecycleObjectType?: "contact" | "company" | "deal" | "ticket"
}

interface RecordPreviewPanelProps {
  recordType: RecordType
  recordId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const ROUTE_MAP: Record<RecordType, string> = {
  company: "/companies",
  contact: "/contacts",
  deal: "/deals",
  task: "/tasks",
  ticket: "/tickets",
  note: "/notes",
  call: "/calls",
  order: "/orders",
  product: "/products",
}

export function RecordPreviewPanel({
  recordType,
  recordId,
  open,
  onOpenChange,
  onSuccess,
}: RecordPreviewPanelProps) {
  const { workspaceId } = useAuth()
  const [data, setData] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const prevKeyRef = React.useRef<string>("")
  const [keyInfoOpen, setKeyInfoOpen] = React.useState(true)
  const [activitiesOpen, setActivitiesOpen] = React.useState(true)

  // Activity editors state
  const [noteEditorOpen, setNoteEditorOpen] = React.useState(false)
  const [taskEditorOpen, setTaskEditorOpen] = React.useState(false)
  const [callEditorOpen, setCallEditorOpen] = React.useState(false)
  const [ticketSheetOpen, setTicketSheetOpen] = React.useState(false)

  // Note comments state
  const [commentsOpen, setCommentsOpen] = React.useState(false)

  React.useEffect(() => {
    if (!open || !recordId) {
      if (!open) {
        setData(null)
        setKeyInfoOpen(true)
        setActivitiesOpen(true)
      }
      return
    }

    const key = `${recordType}:${recordId}`
    if (prevKeyRef.current === key && data) return
    prevKeyRef.current = key

    let cancelled = false
    setIsLoading(true)
    setData(null)

    async function fetchRecord() {
      try {
        let result: any = null
        switch (recordType) {
          case "company":
            result = await companiesService.getById(recordId!, workspaceId!)
            break
          case "contact":
            result = await contactsService.getById(recordId!, workspaceId!)
            break
          case "deal":
            result = await dealsService.getById(recordId!, workspaceId!)
            break
          case "task":
            result = await tasksService.getById(recordId!)
            break
          case "note":
            result = await notesService.getById(recordId!)
            break
          case "call":
            result = await activitiesService.getById(recordId!, workspaceId!)
            break
          case "ticket":
            result = await ticketsService.getById(recordId!, workspaceId!)
            break
          case "product":
            result = await productsService.getById(recordId!, workspaceId!)
            break
          case "order":
            result = await ordersService.get(recordId!, workspaceId!)
            break
        }
        if (!cancelled) {
          setData(result?.data ?? null)
          setIsLoading(false)
        }
      } catch {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchRecord()
    return () => { cancelled = true }
  }, [open, recordId, recordType, workspaceId])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      prevKeyRef.current = ""
    }
    onOpenChange(nextOpen)
  }

  const detailHref = recordId ? `${ROUTE_MAP[recordType]}/${recordId}` : ROUTE_MAP[recordType]

  // Get entity type for activity editors
  const getEntityType = (): "contact" | "company" | "deal" | "ticket" => {
    if (recordType === "contact") return "contact"
    if (recordType === "company") return "company"
    if (recordType === "deal") return "deal"
    if (recordType === "ticket") return "ticket"
    return "contact"
  }

  if (!open) return null

  return (
    <div
      className={cn(
        "h-full border-l border-border bg-background flex flex-col overflow-hidden shrink-0",
        "transition-all duration-300 ease-in-out",
        "absolute inset-y-0 right-0 w-full z-40 lg:static lg:w-[420px]"
      )}
    >
      {isLoading || !data ? (
        <PanelSkeleton />
      ) : (
        <>
          {/* Section A: Header */}
          <PreviewHeader
            recordType={recordType}
            data={data}
            detailHref={detailHref}
            onClose={() => handleOpenChange(false)}
          />

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {/* Section B: Quick Actions */}
            <PreviewQuickActions
              recordType={recordType}
              entityId={recordId!}
              entityType={getEntityType()}
              workspaceId={workspaceId}
              onNoteOpen={() => setNoteEditorOpen(true)}
              onTaskOpen={() => setTaskEditorOpen(true)}
              onCallOpen={() => setCallEditorOpen(true)}
              onTicketOpen={() => setTicketSheetOpen(true)}
              onCommentOpen={() => setCommentsOpen(true)}
            />

            {/* Section C: Key Information */}
            <PreviewKeyInformation
              key={recordId ?? "none"}
              recordType={recordType}
              data={data}
              isOpen={keyInfoOpen}
              onToggle={() => setKeyInfoOpen(!keyInfoOpen)}
              recordId={recordId}
              workspaceId={workspaceId}
              setData={setData}
            />

            {/* Section C2: Note Comments (only for notes) */}
            {recordType === "note" && (
              <PreviewNoteComments
                noteId={recordId!}
                workspaceId={workspaceId}
                isOpen={commentsOpen}
                onToggle={() => setCommentsOpen(!commentsOpen)}
                onSuccess={onSuccess}
              />
            )}

            {/* Section D: Associations */}
            <PreviewAssociations
              recordType={recordType}
              data={data}
            />

            {/* Section E: Recent History */}
            <PreviewRecentActivities
              recordType={recordType}
              recordId={recordId!}
              data={data}
              workspaceId={workspaceId}
              isOpen={activitiesOpen}
              onToggle={() => setActivitiesOpen(!activitiesOpen)}
              onEditNote={() => setNoteEditorOpen(true)}
            />
          </div>

          {/* Activity Editors (lazy loaded) */}
          {noteEditorOpen && (
            <React.Suspense fallback={null}>
              <NoteEditorLazy
                open={noteEditorOpen}
                onClose={() => setNoteEditorOpen(false)}
                entityType={getEntityType()}
                entityId={recordId!}
                workspaceId={workspaceId}
                onSaved={() => { setNoteEditorOpen(false); onSuccess?.() }}
              />
            </React.Suspense>
          )}
          {taskEditorOpen && (
            <React.Suspense fallback={null}>
              <TaskEditorLazy
                open={taskEditorOpen}
                onClose={() => setTaskEditorOpen(false)}
                entityType={getEntityType()}
                entityId={recordId!}
                workspaceId={workspaceId}
                onSaved={() => { setTaskEditorOpen(false); onSuccess?.() }}
              />
            </React.Suspense>
          )}
          {callEditorOpen && (
            <React.Suspense fallback={null}>
              <CallEditorLazy
                open={callEditorOpen}
                onClose={() => setCallEditorOpen(false)}
                entityType={getEntityType()}
                entityId={recordId!}
                workspaceId={workspaceId}
                onSaved={() => { setCallEditorOpen(false); onSuccess?.() }}
              />
            </React.Suspense>
          )}
          {ticketSheetOpen && recordType !== "ticket" && (
            <AddTicketSheet
              open={ticketSheetOpen}
              onClose={() => setTicketSheetOpen(false)}
              contactId={recordType === "contact" ? recordId! : data?.contact?.id ?? data?.contacts?.[0]?.id ?? ""}
              contactName={recordType === "contact" ? (data?.first_name || "") + " " + (data?.last_name || "") : data?.contact ? `${data.contact.first_name || ""} ${data.contact.last_name || ""}` : data?.contacts?.[0] ? `${data.contacts[0].first_name || ""} ${data.contacts[0].last_name || ""}` : undefined}
              companyId={recordType === "company" ? recordId! : data?.company?.id ?? data?.company_id ?? undefined}
              workspaceId={workspaceId ?? undefined}
              onSuccess={() => { setTicketSheetOpen(false); onSuccess?.() }}
            />
          )}
        </>
      )}
    </div>
  )
}

/* ── Lazy Activity Editors ──────────────────────────────── */

const NoteEditorLazy = React.lazy(() =>
  import("@/components/activities/NoteEditorSheet").then(m => ({ default: m.NoteEditorSheet }))
)
const TaskEditorLazy = React.lazy(() =>
  import("@/components/activities/TaskEditorSheet").then(m => ({ default: m.TaskEditorSheet }))
)
const CallEditorLazy = React.lazy(() =>
  import("@/components/activities/CallEditorSheet").then(m => ({ default: m.CallEditorSheet }))
)

/* ── Section A: Header ──────────────────────────────────── */

function PreviewHeader({
  recordType,
  data,
  detailHref,
  onClose,
}: {
  recordType: RecordType
  data: any
  detailHref: string
  onClose: () => void
}) {
  const { initials, name, subtitle, email } = getRecordIdentity(recordType, data)

  return (
    <div className="px-5 pt-4 pb-3 border-b border-border shrink-0">
      {/* Top row: Close + Title + View record */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">Preview</span>
        <div className="flex items-center gap-1">
          <Link
            href={detailHref}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
          >
            View record
            <ExternalLink className="h-3 w-3" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Avatar + Name + Subtitle + Email */}
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-primary">{initials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-foreground truncate">{name}</div>
          {subtitle && (
            <div className="text-[12px] text-muted-foreground truncate">{subtitle}</div>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="text-[12px] text-primary hover:underline truncate block"
            >
              {email}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function getRecordIdentity(recordType: RecordType, data: any) {
  switch (recordType) {
    case "company":
      return {
        initials: (data.name || "??").substring(0, 2).toUpperCase(),
        name: data.name || "--",
        subtitle: data.industry || data.domain || null,
        email: data.email || null,
      }
    case "contact": {
      const fn = data.first_name || ""
      const ln = data.last_name || ""
      return {
        initials: `${fn.charAt(0)}${ln.charAt(0)}`.toUpperCase() || "?",
        name: `${fn} ${ln}`.trim() || "--",
        subtitle: data.company?.name || null,
        email: data.email || null,
      }
    }
    case "deal":
      return {
        initials: (data.title || "??").substring(0, 2).toUpperCase(),
        name: data.title || "--",
        subtitle: data.amount
          ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(data.amount)
          : null,
        email: null,
      }
    case "task":
      return {
        initials: "TK",
        name: data.title || "--",
        subtitle: data.type || "Task",
        email: null,
      }
    case "note":
      return {
        initials: "NT",
        name: data.title || data.content?.substring(0, 30) || "Untitled note",
        subtitle: data.created_at ? format(new Date(data.created_at), "MMM d, yyyy") : null,
        email: null,
      }
    case "call":
      return {
        initials: "CL",
        name: data.title || "Call",
        subtitle: [data.call_direction, data.call_duration].filter(Boolean).join(" · ") || null,
        email: null,
      }
    case "ticket":
      return {
        initials: "TK",
        name: data.subject || "--",
        subtitle: data.status || null,
        email: null,
      }
    case "product":
      return {
        initials: (data.name || "??").substring(0, 2).toUpperCase(),
        name: data.name || "--",
        subtitle: data.sku || null,
        email: null,
      }
    case "order":
      return {
        initials: "OR",
        name: data.title || data.order_number || "--",
        subtitle: data.order_number || null,
        email: null,
      }
    default:
      return { initials: "??", name: "--", subtitle: null, email: null }
  }
}

/* ── Section B: Quick Actions ───────────────────────────── */

function PreviewQuickActions({
  recordType,
  entityId,
  entityType,
  workspaceId,
  onNoteOpen,
  onTaskOpen,
  onCallOpen,
  onTicketOpen,
  onCommentOpen,
}: {
  recordType: RecordType
  entityId: string
  entityType: "contact" | "company" | "deal" | "ticket"
  workspaceId: string | null
  onNoteOpen: () => void
  onTaskOpen: () => void
  onCallOpen: () => void
  onTicketOpen?: () => void
  onCommentOpen?: () => void
}) {
  const handlerMap: Record<string, () => void> = {
    note: onNoteOpen,
    task: onTaskOpen,
    call: onCallOpen,
    ticket: onTicketOpen || (() => {}),
    comment: onCommentOpen || (() => {}),
  }
  const actions = getActionsForType(recordType)

  return (
    <div className="px-5 py-3 border-b border-border">
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={handlerMap[action.key] || (() => {})}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors min-w-[52px]"
          >
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
              <action.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function getActionsForType(recordType: RecordType): { label: string; icon: React.ElementType; key: string }[] {
  switch (recordType) {
    case "contact":
    case "company":
    case "deal":
    case "ticket":
      return [
        { label: "Note", icon: StickyNote, key: "note" },
        { label: "Ticket", icon: TicketCheck, key: "ticket" },
        { label: "Task", icon: ListTodo, key: "task" },
      ]
    case "task":
      return [
        { label: "Note", icon: StickyNote, key: "note" },
        { label: "Comment", icon: MessageSquare, key: "note" },
      ]
    case "note":
      return [
        { label: "Comment", icon: MessageSquare, key: "comment" },
      ]
    case "call":
      return []
    case "order":
    case "product":
      return []
    default:
      return []
  }
}

/* ── Section C: Key Information ─────────────────────────── */

function PreviewKeyInformation({
  recordType,
  data,
  isOpen,
  onToggle,
  recordId,
  workspaceId,
  setData,
}: {
  recordType: RecordType
  data: any
  isOpen: boolean
  onToggle: () => void
  recordId: string | null
  workspaceId: string | null
  setData: React.Dispatch<React.SetStateAction<any>>
}) {
  const [ownerOptions, setOwnerOptions] = React.useState<FieldOption[]>([])
  const [noteExpanded, setNoteExpanded] = React.useState(false)
  const [noteContent, setNoteContent] = React.useState("")
  const [noteSaving, setNoteSaving] = React.useState(false)

  const hasOwnerField = ["company", "contact", "deal", "ticket", "call", "task"].includes(recordType)

  React.useEffect(() => {
    if (hasOwnerField && workspaceId) {
      authService.listProfiles(workspaceId).then(({ data: profiles }) => {
        if (profiles) {
          setOwnerOptions([
            { label: "Unassigned", value: "" },
            ...profiles.map((p: Profile) => ({
              label: `${p.first_name} ${p.last_name}`,
              value: p.clerk_user_id || p.id,
            })),
          ])
        }
      }).catch(() => {})
    }
  }, [recordType, workspaceId, hasOwnerField])

  const fields = getKeyFields(recordType, data, ownerOptions)

  const handleFieldSave = React.useCallback(
    async (fieldKey: string, newValue: string | number | null) => {
      if (!recordId || !workspaceId || !setData) return
      const val = newValue === "" ? null : newValue
      const apiVal = fieldKey === "completed" ? (val === 1 || val === "true") : val
      let error: any = null

      switch (recordType) {
        case "company": {
          const res = await companiesService.update(recordId, { [fieldKey]: apiVal } as any, workspaceId)
          error = res.error
          break
        }
        case "contact": {
          const res = await contactsService.update(recordId, { [fieldKey]: apiVal } as any, workspaceId)
          error = res.error
          break
        }
        case "deal": {
          const res = await dealsService.update(recordId, { [fieldKey]: apiVal } as any, workspaceId)
          error = res.error
          break
        }
        case "ticket": {
          const res = await ticketsService.update(recordId, { [fieldKey]: apiVal } as any, workspaceId)
          error = res.error
          break
        }
        case "call": {
          const res = await activitiesService.update(recordId, { [fieldKey]: apiVal } as any, workspaceId)
          error = res.error
          break
        }
        case "task": {
          const mapped = fieldKey === "completed"
            ? { status: apiVal ? "completed" : "pending" }
            : fieldKey === "owner_id"
              ? { assigned_to: val }
              : { [fieldKey]: apiVal }
          const res = await tasksService.update(recordId, mapped as any)
          error = res.error
          break
        }
        case "product": {
          const res = await productsService.update(recordId, { [fieldKey]: apiVal } as any, workspaceId)
          error = res.error
          break
        }
        case "order": {
          try {
            await ordersService.update(recordId, { [fieldKey]: apiVal } as any, workspaceId)
          } catch (e: any) {
            error = { message: e.message }
          }
          break
        }
      }

      if (error) throw error
      setData((prev: any) => {
        if (!prev) return prev
        if (recordType === "task" && fieldKey === "completed") {
          return { ...prev, completed: !!apiVal, status: apiVal ? "completed" : "pending" }
        }
        if (recordType === "task" && fieldKey === "owner_id") {
          const label = ownerOptions.find((o) => o.value === val)?.label
          return { ...prev, owner_id: val, assigned_to: { id: val, name: label || "Unassigned" } }
        }
        return { ...prev, [fieldKey]: apiVal }
      })
      toast.success("Field updated")
    },
    [recordId, workspaceId, setData, recordType, ownerOptions]
  )

  const handleLifecycleSave = React.useCallback(
    async (newStage: string) => {
      if (!recordId || !workspaceId || !setData) return
      let error: any = null
      switch (recordType) {
        case "contact": {
          const res = await contactsService.update(recordId, { lifecycle_stage: newStage } as any, workspaceId)
          error = res.error
          break
        }
        case "company": {
          const res = await companiesService.update(recordId, { lifecycle_stage: newStage } as any, workspaceId)
          error = res.error
          break
        }
        default:
          return
      }
      if (error) throw error
      setData((prev: any) => prev ? { ...prev, lifecycle_stage: newStage } : prev)
      toast.success("Field updated")
    },
    [recordId, workspaceId, setData, recordType]
  )

  const handleNoteSave = React.useCallback(async () => {
    if (!recordId || recordType !== "note") return
    setNoteSaving(true)
    try {
      const html = DOMPurify.sanitize(noteContent)
      const { error } = await notesService.update(recordId, { content: html } as any)
      if (error) throw error
      setData((prev: any) => prev ? { ...prev, content: html } : prev)
      setNoteExpanded(false)
      toast.success("Note updated")
    } catch (err: any) {
      toast.error(err.message || "Failed to update note")
    } finally {
      setNoteSaving(false)
    }
  }, [recordId, recordType, noteContent, setData])

  const handleNoteCancel = React.useCallback(() => {
    setNoteExpanded(false)
    setNoteContent("")
  }, [])

  return (
    <div className="border-b border-border">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <span className="text-[13px] font-semibold text-foreground">Key information</span>
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Fields */}
      {isOpen && (
        <div className="px-5 pb-4 flex flex-col gap-3">
          {fields.map((field) => (
            <div key={field.label} className="grid grid-cols-[100px_1fr] gap-2">
              <span className="text-[12px] text-muted-foreground">{field.label}</span>
              {field.type === "lifecycle" && field.editable ? (
                <LifecycleDropdown
                  value={field.value as string | null}
                  onChange={(v) => handleLifecycleSave(v)}
                  size="sm"
                  objectType={field.lifecycleObjectType || "contact"}
                />
              ) : field.type === "richtext" && field.editable ? (
                <div className="w-full">
                  {noteExpanded ? (
                    <div className="flex flex-col gap-2">
                      <RichTextEditor
                        key={recordId ?? "note"}
                        initialValue={noteContent}
                        onChange={setNoteContent}
                        placeholder="Start typing your note..."
                        minHeight="100px"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-[12px]"
                          onClick={handleNoteSave}
                          disabled={noteSaving}
                        >
                          {noteSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[12px]"
                          onClick={handleNoteCancel}
                          disabled={noteSaving}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setNoteContent(field.value ? String(field.value) : "")
                        setNoteExpanded(true)
                      }}
                      className="text-[13px] text-foreground font-medium text-left w-full hover:bg-muted/50 rounded px-1 -mx-1 py-0.5 -my-0.5 transition-colors cursor-text outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {field.renderReadonly ? field.renderReadonly() : (
                        <span className="line-clamp-3">{field.value ? String(field.value) : "--"}</span>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <EditableField
                  value={field.value}
                  type={field.type as any}
                  options={field.options}
                  editable={field.editable}
                  renderReadonly={field.renderReadonly ? () => field.renderReadonly!() : undefined}
                  onSave={async (newValue) => {
                    await handleFieldSave(field.key, newValue)
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getKeyFields(recordType: RecordType, data: any, ownerOptions?: FieldOption[]): KeyField[] {
  const fmt = (v: any) => v ?? "--"
  const fmtDate = (v: any) => v ? format(new Date(v), "MMM d, yyyy") : "--"
  const fmtMoney = (v: any) => v
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v)
    : "--"
  const slugify = (v: any) => String(v).toLowerCase().replace(/\s+/g, "_")

  switch (recordType) {
    case "company":
      return COMPANY_FIELD_CONFIG
        .filter((f) => f.showInSidebar !== false)
        .map((f) => {
          const val = f.key === "owner_id" ? (data.owner_id || null) : (data[f.key] ?? null)
          const display = f.key === "created_at"
            ? fmtDate(data.created_at)
            : f.key === "owner_id"
              ? (data.owner ? `${data.owner.first_name} ${data.owner.last_name}` : "Unassigned")
              : f.type === "lifecycle"
                ? <LifecycleBadge stageId={data.lifecycle_stage} objectType="company" />
                : f.key === "domain" && data.domain
                  ? <a href={data.domain} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{data.domain}</a>
                  : fmt(val)
          return {
            label: f.label,
            displayValue: display,
            value: val,
            key: f.key,
            type: f.type,
            editable: f.editable,
            options: f.options,
            lifecycleObjectType: f.lifecycleObjectType,
            ...(f.key === "owner_id" ? { options: ownerOptions, renderReadonly: () => data.owner ? `${data.owner.first_name} ${data.owner.last_name}` : "Unassigned" } : {}),
          }
        })
    case "contact":
      return CONTACT_FIELD_CONFIG
        .filter((f) => f.showInSidebar !== false)
        .map((f) => {
          const val = f.key === "owner_id" ? (data.owner_id || null) : (data[f.key] ?? null)
          const display = f.key === "created_at"
            ? fmtDate(data.created_at)
            : f.key === "owner_id"
              ? (data.owner ? `${data.owner.first_name} ${data.owner.last_name}` : "Unassigned")
              : f.type === "lifecycle"
                ? <LifecycleBadge stageId={data.lifecycle_stage} objectType="contact" />
                : fmt(val)
          return {
            label: f.label,
            displayValue: display,
            value: val,
            key: f.key,
            type: f.type,
            editable: f.editable,
            options: f.options,
            lifecycleObjectType: f.lifecycleObjectType,
            ...(f.key === "owner_id" ? { options: ownerOptions, renderReadonly: () => data.owner ? `${data.owner.first_name} ${data.owner.last_name}` : "Unassigned" } : {}),
          }
        })
    case "deal":
      return DEAL_FIELD_CONFIG
        .filter((f) => f.showInSidebar !== false)
        .map((f) => {
          const val = f.key === "owner_id"
            ? (data.owner_id || null)
            : f.key === "stage"
              ? (data.stage ? slugify(data.stage) : null)
              : (data[f.key] ?? null)
          const display = f.key === "created_at"
            ? fmtDate(data.created_at)
            : f.key === "owner_id"
              ? (data.owner ? `${data.owner.first_name} ${data.owner.last_name}` : "Unassigned")
              : f.key === "stage"
                ? fmt(data.stage)
                : f.key === "amount"
                  ? fmtMoney(data.amount)
                  : fmt(val)
          return {
            label: f.label,
            displayValue: display,
            value: val,
            key: f.key,
            type: f.type,
            editable: f.editable,
            options: f.options,
            ...(f.key === "owner_id" ? { options: ownerOptions, renderReadonly: () => data.owner ? `${data.owner.first_name} ${data.owner.last_name}` : "Unassigned" } : {}),
          }
        })
    case "task":
      return TASK_FIELD_CONFIG
        .filter((f) => f.showInSidebar !== false)
        .map((f) => {
          if (f.key === "completed") {
            const done = data.completed === true || data.completed === 1 || data.status === "completed"
            return { label: f.label, displayValue: done ? "Completed" : "Pending", value: done ? 1 : 0, key: f.key, type: f.type, editable: f.editable }
          }
          if (f.key === "description") {
            return { label: f.label, displayValue: <span className="line-clamp-3">{fmt(data.description)}</span>, value: data.description || null, key: f.key, type: f.type, editable: f.editable, renderReadonly: () => <span className="line-clamp-3 text-[13px]">{data.description || "--"}</span> }
          }
          if (f.key === "set_repeat") {
            return { label: f.label, displayValue: data.set_repeat ? "Yes" : "No", value: data.set_repeat ? 1 : 0, key: f.key, type: f.type, editable: f.editable }
          }
          const val = f.key === "owner_id"
            ? (data.owner_id || data.assigned_to?.id || null)
            : (f.key === "task_priority" ? (data.task_priority || data.priority || null) : (f.key === "task_queue" ? (data.task_queue || data.queue || null) : (data[f.key] ?? null)))
          const display = f.key === "created_at"
            ? fmtDate(data.created_at)
            : f.key === "owner_id"
              ? (data.owner ? `${data.owner.first_name} ${data.owner.last_name}` : (data.assigned_to?.name || "Unassigned"))
              : fmt(val)
          return {
            label: f.label,
            displayValue: display,
            value: val,
            key: f.key,
            type: f.type,
            editable: f.editable,
            options: f.options,
            ...(f.key === "owner_id" ? { options: ownerOptions, renderReadonly: () => data.owner ? `${data.owner.first_name} ${data.owner.last_name}` : (data.assigned_to?.name || "Unassigned") } : {}),
          }
        })
    case "note":
      return [
        {
          label: "Content",
          displayValue: <span className="line-clamp-3">{fmt(data.content)}</span>,
          value: data.content || null,
          key: "content",
          type: "richtext",
          editable: true,
          renderReadonly: () => (
            <span className="line-clamp-3 text-[13px]">{data.content || "--"}</span>
          ),
        },
        { label: "Created", displayValue: fmtDate(data.created_at), value: null, key: "created_at", type: "text", editable: false },
      ]
    case "call":
      return CALL_FIELD_CONFIG
        .filter((f) => f.showInSidebar !== false)
        .map((f) => {
          const val = f.key === "owner_id" ? (data.owner_id || null) : (data[f.key] ?? null)
          const display = f.key === "created_at"
            ? fmtDate(data.created_at)
            : f.key === "owner_id"
              ? (data.owner ? `${data.owner.first_name} ${data.owner.last_name}` : "Unassigned")
              : fmt(val)
          return {
            label: f.label,
            displayValue: display,
            value: val,
            key: f.key,
            type: f.type,
            editable: f.editable,
            options: f.options,
            ...(f.key === "owner_id" ? { options: ownerOptions, renderReadonly: () => data.owner ? `${data.owner.first_name} ${data.owner.last_name}` : "Unassigned" } : {}),
          }
        })
    case "ticket":
      return TICKET_FIELD_CONFIG
        .filter((f) => f.showInSidebar !== false)
        .map((f) => {
          const val = f.key === "owner_id" ? (data.owner_id || null) : (data[f.key] ?? null)
          const display = f.key === "created_at"
            ? fmtDate(data.created_at)
            : f.key === "owner_id"
              ? data.owner ? `${data.owner.first_name} ${data.owner.last_name}` : (data as any).assigned_to || "Unassigned"
              : fmt(val)
          return {
            label: f.label,
            displayValue: display,
            value: val,
            key: f.key,
            type: f.type,
            editable: f.editable,
            options: f.options,
            ...(f.key === "owner_id" ? { options: ownerOptions, renderReadonly: () => data.owner ? `${data.owner.first_name} ${data.owner.last_name}` : (data as any).assigned_to || "Unassigned" } : {}),
          }
        })
    case "product":
      return PRODUCT_FIELD_CONFIG
        .filter((f) => f.showInSidebar !== false)
        .map((f) => {
          const val = data[f.key] ?? null
          const display = f.key === "unit_price"
            ? fmtMoney(data.unit_price || data.price)
            : f.key === "product_description"
              ? <span className="line-clamp-3">{fmt(data.product_description || data.description)}</span>
              : f.key === "product_type"
                ? fmt(data.product_type || data.type)
                : fmt(val)
          return {
            label: f.label,
            displayValue: display,
            value: val,
            key: f.key,
            type: f.type,
            editable: f.editable,
            options: f.options,
          }
        })
    case "order":
      return ORDER_FIELD_CONFIG
        .filter((f) => f.showInSidebar !== false)
        .map((f) => {
          const val = data[f.key] ?? null
          const display = f.key === "created_at"
            ? fmtDate(data.created_at)
            : f.key === "total"
              ? fmtMoney(data.total || data.amount)
              : fmt(val)
          return {
            label: f.label,
            displayValue: display,
            value: val,
            key: f.key,
            type: f.type,
            editable: f.editable,
            options: f.options,
          }
        })
    default:
      return []
  }
}

/* ── Section D: Recent Activities ───────────────────────── */

function PreviewRecentActivities({
  recordType,
  recordId,
  data,
  workspaceId,
  isOpen,
  onToggle,
  onEditNote,
}: {
  recordType: RecordType
  recordId: string
  data: any
  workspaceId: string | null
  isOpen: boolean
  onToggle: () => void
  onEditNote?: () => void
}) {
  const [activities, setActivities] = React.useState<any[]>([])
  const [notes, setNotes] = React.useState<any[]>([])
  const [tickets, setTickets] = React.useState<any[]>([])
  const [tasks, setTasks] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isCollapsedAll, setIsCollapsedAll] = React.useState(false)
  const [activeFilter, setActiveFilter] = React.useState("all")

  const fetchActivities = React.useCallback(async () => {
    if (!recordId || !workspaceId) return
    setIsLoading(true)
    try {
      const fkField = getForeignKeyField(recordType)
      const fkFilter = fkField ? { [fkField]: recordId } : {}
      const [actRes, noteRes, ticketRes, taskRes] = await Promise.all([
        activitiesService.getAll({ workspace_id: workspaceId!, ...fkFilter }),
        recordType !== "note" ? notesService.getAll({ ...fkFilter, workspace_id: workspaceId! }) : Promise.resolve({ data: [] }),
        recordType !== "ticket" ? ticketsService.getAll({ ...fkFilter, workspace_id: workspaceId! }) : Promise.resolve({ data: [] }),
        tasksService.getAll({ ...fkFilter, workspace_id: workspaceId! }),
      ])
      setActivities(actRes.data || [])
      setNotes(noteRes.data || [])
      setTickets(ticketRes.data || [])
      setTasks(taskRes.data || [])
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [recordId, recordType, workspaceId])

  React.useEffect(() => {
    if (!isOpen || !recordId || !workspaceId) return
    fetchActivities()
  }, [isOpen, recordId, workspaceId, fetchActivities])

  // Merge and sort all activities
  const allItems = React.useMemo(() => {
    const items: any[] = [
      ...activities.map((a) => ({ ...a, _type: "activity" })),
      ...notes.map((n) => ({ ...n, _type: "note" })),
      ...tickets.map((t) => ({ ...t, _type: "ticket" })),
      ...tasks.map((t) => ({
        ...t,
        _type: "activity",
        type: "task",
        owner: t.assigned_to ? { first_name: t.assigned_to.name, last_name: "" } : null,
        completed: t.status === "completed"
      })),
    ]
    items.sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime()
      const db = new Date(b.created_at || 0).getTime()
      return db - da
    })
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return items.filter((item) =>
        (item.title || item.subject || item.content || "").toLowerCase().includes(q)
      )
    }
    return items
  }, [activities, notes, tickets, searchQuery])

  // Compute feed counts from unfiltered items
  const feedCounts = React.useMemo(() => {
    const all = allItems
    const notesCount = all.filter(i => i._type === "note" || i.type === "note").length
    const tasksCount = all.filter(i => i.type === "task").length
    const ticketsCount = all.filter(i => i._type === "ticket" || i.type === "ticket").length
    const callsCount = all.filter(i => i.type === "call").length
    return {
      all: all.length,
      notes: notesCount,
      tasks: tasksCount,
      tickets: ticketsCount,
      calls: callsCount,
    }
  }, [allItems])

  // Filter items by active filter
  const filteredItems = React.useMemo(() => {
    if (activeFilter === "all") return allItems
    return allItems.filter((item) => {
      switch (activeFilter) {
        case "notes": return item._type === "note" || item.type === "note"
        case "tasks": return item.type === "task"
        case "tickets": return item._type === "ticket" || item.type === "ticket"
        case "calls": return item.type === "call"
        default: return true
      }
    })
  }, [allItems, activeFilter])

  // Group filtered items by month
  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, any[]> = {}
    filteredItems.forEach(item => {
      const date = new Date(item.created_at || (item as any).due_date)
      const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
      if (!groups[monthYear]) groups[monthYear] = []
      groups[monthYear].push(item)
    })
    return groups
  }, [filteredItems])

  // Build associations from record data
  const associations = React.useMemo(() => {
    if (!data) return []
    const assocs: { name: string; type: string }[] = []
    switch (recordType) {
      case "contact": {
        const name = `${data.first_name || ""} ${data.last_name || ""}`.trim()
        if (name) assocs.push({ name, type: "Contact" })
        if (data.company?.name) assocs.push({ name: data.company.name, type: "Company" })
        if (data.deals?.length) data.deals.forEach((d: any) => assocs.push({ name: d.title, type: "Deal" }))
        break
      }
      case "company":
        if (data.name) assocs.push({ name: data.name, type: "Company" })
        break
      case "deal":
        if (data.title) assocs.push({ name: data.title, type: "Deal" })
        break
      case "ticket":
        if (data.subject || data.title) assocs.push({ name: data.subject || data.title, type: "Ticket" })
        break
      default:
        break
    }
    return assocs
  }, [data, recordType])

  const fkField = getForeignKeyField(recordType)
  const hasActivities = fkField !== null

  return (
    <div className="border-b border-border">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <span className="text-[13px] font-semibold text-foreground">Recent history</span>
        <div className="flex items-center gap-2">
          {isOpen && (
            <>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-6 pl-7 pr-2 text-[11px] bg-muted border border-border rounded w-24 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsCollapsedAll(!isCollapsedAll)
                }}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground whitespace-nowrap"
              >
                {isCollapsedAll ? 'Expand all' : 'Collapse all'}
              </button>
            </>
          )}
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="px-5 pb-4">
          {!hasActivities ? (
            <div className="text-[12px] text-muted-foreground text-center py-4">
              No history for this record type
            </div>
          ) : isLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 p-2">
                  <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : allItems.length === 0 ? (
            <div className="text-[12px] text-muted-foreground text-center py-4">
              No history yet
            </div>
          ) : (
            <>
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 mb-3 overflow-x-auto no-scrollbar">
                {[
                  { id: "all", label: "All", count: feedCounts.all },
                  { id: "notes", label: "Notes", count: feedCounts.notes },
                  { id: "tasks", label: "Tasks", count: feedCounts.tasks },
                  { id: "tickets", label: "Tickets", count: feedCounts.tickets },
                  { id: "calls", label: "Calls", count: feedCounts.calls },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveFilter(tab.id)
                    }}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-medium rounded-full whitespace-nowrap transition-colors shrink-0",
                      activeFilter === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* Month-grouped items */}
              {filteredItems.length === 0 ? (
                <div className="text-[12px] text-muted-foreground text-center py-4">
                  No activity matches your filters.
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {Object.entries(groupedHistory).map(([monthYear, items]) => (
                    <div key={monthYear} className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <h4 className="text-[12px] text-foreground font-bold whitespace-nowrap">{monthYear}</h4>
                        <div className="h-[1px] w-full bg-border" />
                      </div>

                      <div className="relative pl-8">
                        <div className="flex flex-col gap-3">
                          {items.map((item: any, idx: number) => {
                            const isNote = item._type === "note" || item.type === "note"
                            const isTicket = item._type === "ticket"
                            const isTask = item.type === "task"
                            const tlIcon = isNote ? FileText : isTicket ? TicketCheck : getActivityIcon(item.type)
                            const tlIconColor = isNote ? "text-status-warning" : isTicket ? "text-destructive" : "text-primary"
                            const tlIconBg = isNote ? "bg-status-warning/10" : isTicket ? "bg-destructive/10" : "bg-primary/10"
                            return (
                              <div key={`${item._type}-${item.id}`} className="relative">
                                {/* Timeline connector line */}
                                {idx < items.length - 1 && (
                                  <div className="absolute left-[-25px] top-8 bottom-[-12px] w-px bg-border z-0" />
                                )}
                                {/* Timeline icon */}
                                <div className={cn("absolute -left-[37px] top-2 h-6 w-6 rounded-full flex items-center justify-center z-10", tlIconBg)}>
                                  {React.createElement(tlIcon, { className: cn("h-3 w-3", tlIconColor) })}
                                </div>
                                {isNote ? (
                                  <ActivityLogCard
                                    id={item.id}
                                    feedType={item._type === "note" ? "note" : "activity"}
                                    type="Note"
                                    author={item.author?.first_name ? `${item.author.first_name} ${item.author.last_name || ""}` : "System"}
                                    date={item.created_at ? format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a") + " GMT+2" : ""}
                                    content={item.formatted_description || item.content || item.description || ""}
                                    isExpanded={!isCollapsedAll}
                                    compact
                                    associations={associations}
                                    onSuccess={fetchActivities}
                                  />
                                ) : isTask ? (
                                  <ActivityTaskCard
                                    id={item.id}
                                    title={item.title || ""}
                                    description={item.description || ""}
                                    assignedTo={item.owner?.first_name ? `${item.owner.first_name} ${item.owner.last_name || ""}` : "Unassigned"}
                                    dueDate={item.due_date || new Date().toISOString()}
                                    dueTime={item.due_date ? format(new Date(item.due_date), "HH:mm") : "09:00"}
                                    isExpanded={!isCollapsedAll}
                                    initialTaskSubtype={item.task_subtype || "To-do"}
                                    initialPriority={item.task_priority || "None"}
                                    initialQueue={item.task_queue || "General"}
                                    initialReminder={item.task_reminder || "No reminder"}
                                    initialRepeat={item.task_repeat || false}
                                    initialCompleted={item.completed || false}
                                    compact
                                    associations={associations}
                                    onSuccess={() => {}}
                                  />
                                ) : (
                                  <>
                                    <ActivityTimelineItem
                                      item={item}
                                      isExpanded={!isCollapsedAll}
                                      onEdit={onEditNote}
                                    />
                                    {associations.length > 0 && (
                                      <div className="mt-1 ml-1">
                                        <AssociationBadge associations={associations} />
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function getForeignKeyField(recordType: RecordType): string | null {
  switch (recordType) {
    case "contact": return "contact_id"
    case "company": return "company_id"
    case "deal": return "deal_id"
    case "ticket": return "ticket_id"
    case "task":
    case "note":
    case "call": return null // These ARE activities, don't filter by themselves
    default: return null
  }
}

function ActivityTimelineItem({ item, isExpanded: initialExpanded = false, onEdit }: { item: any; isExpanded?: boolean; onEdit?: () => void }) {
  const isNote = item._type === "note" || item.type === "note"
  const isTicket = item._type === "ticket"
  const isTask = item.type === "task"
  const isCall = item.type === "call"
  const [isExpanded, setIsExpanded] = React.useState(initialExpanded)

  React.useEffect(() => {
    setIsExpanded(initialExpanded)
  }, [initialExpanded])

  const icon = isNote ? FileText : isTicket ? TicketCheck : getActivityIcon(item.type)
  const iconColor = isNote ? "text-status-warning" : isTicket ? "text-destructive" : "text-primary"
  const iconBg = isNote ? "bg-status-warning/10" : isTicket ? "bg-destructive/10" : "bg-primary/10"

  const typeLabel = isNote ? "Note" : isTicket ? "Ticket" : capitalizeFirst(item.type || "Activity")
  const author = item.author?.first_name ? `${item.author.first_name} ${item.author.last_name || ""}`.trim() : "System"
  const date = item.created_at ? format(new Date(item.created_at), "MMM d, yyyy 'at' h:mm a") + " GMT+2" : ""
  const title = isNote ? null : isTicket ? item.subject : item.title

  return (
    <div className="relative">
      {/* Card */}
      <div className="bg-background border border-border rounded-md shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0.5 hover:bg-accent rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-foreground" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-foreground" />
              )}
            </button>
            <div className="flex items-center gap-1 text-[12px] min-w-0">
            <span className="font-bold text-foreground">{typeLabel}</span>
            <span className="text-muted-foreground">by</span>
            <span className="font-bold text-foreground truncate">{author}</span>
            {isNote && item.comments_count > 0 && (
              <span className="flex items-center gap-0.5 text-muted-foreground ml-1">
                <MessageSquare className="h-3 w-3" />
                {item.comments_count}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {isNote && onEdit && (
            <button
              onClick={onEdit}
              className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              title="Edit note"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          <span className="text-[11px] text-muted-foreground">{date}</span>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 ml-7">
          {isNote && item.content && (
            <div className="text-[12px] text-foreground leading-relaxed line-clamp-4 whitespace-pre-wrap">{item.content}</div>
          )}
          {isNote && item.comments_count > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-2">
              <MessageSquare className="h-3 w-3" />
              {item.comments_count} comment{item.comments_count !== 1 ? 's' : ''}
            </div>
          )}
          {isTask && (
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={cn("h-4 w-4 shrink-0 cursor-pointer", item.completed ? "text-green-500" : "text-muted-foreground")} />
                <span className="text-[13px] text-foreground font-medium">{item.title}</span>
              </div>
              {item.due_date && (
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground ml-6">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{format(new Date(item.due_date), "MMM d, yyyy 'at' h:mm a")}</span>
                  {new Date(item.due_date) < new Date() && !item.completed && (
                    <span className="text-red-500 font-medium">Overdue</span>
                  )}
                </div>
              )}
              {item.description && (
                <div className="ml-6 text-[12px] text-muted-foreground line-clamp-2">{item.description}</div>
              )}
              <div className="flex items-center gap-3 ml-6 flex-wrap">
                {item.task_subtype && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.task_subtype}</span>
                )}
                {item.task_priority && item.task_priority !== "None" && (
                  <span className={cn(
                    "text-[11px] px-1.5 py-0.5 rounded font-medium",
                    item.task_priority === "high" ? "bg-red-500/10 text-red-500" :
                    item.task_priority === "medium" ? "bg-yellow-500/10 text-yellow-500" :
                    "bg-muted text-muted-foreground"
                  )}>{item.task_priority}</span>
                )}
              </div>
            </div>
          )}
          {isCall && (
            <div className="flex flex-col gap-1 ml-7 text-[12px] text-muted-foreground">
              {item.call_direction && <span>Direction: {item.call_direction}</span>}
              {item.call_duration && <span>Duration: {item.call_duration}</span>}
              {item.call_outcome && <span>Outcome: {item.call_outcome}</span>}
            </div>
          )}
          {isTicket && (
            <div className="flex items-center gap-2 flex-wrap ml-7">
              {item.status && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.status}</span>
              )}
              {item.priority && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.priority}</span>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}

function getActivityIcon(type: string) {
  switch (type) {
    case "call": return Phone
    case "email": return Mail
    case "meeting": return Calendar
    case "task": return ListTodo
    case "note": return FileText
    default: return AlertCircle
  }
}

function capitalizeFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/* ── Section E: Associations ────────────────────────────── */

function PreviewAssociations({
  recordType,
  data,
}: {
  recordType: RecordType
  data: any
}) {
  if (recordType !== "contact" && recordType !== "company" && recordType !== "deal" && recordType !== "ticket") {
    return null
  }

  const associations = getAssociationCards(recordType, data)
  if (associations.length === 0) return null

  return (
    <div className="border-b border-border">
      <div className="px-5 py-3">
        <span className="text-[13px] font-semibold text-foreground">Associations</span>
      </div>
      <div className="px-5 pb-4 space-y-3">
        {associations.map((assoc) => (
          <div key={assoc.key} className="border border-border rounded-md overflow-hidden">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-[12px] font-semibold text-foreground">
                {assoc.label} ({assoc.count})
              </span>
              <button
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-0.5"
              >
                Add
              </button>
            </div>
            {assoc.items.length > 0 ? (
              <div className="p-2 space-y-1">
                {assoc.items.map((item) => (
                  <div key={item.id} className="px-2 py-1.5 hover:bg-muted/50 rounded transition-colors">
                    <p className="text-[12px] text-foreground line-clamp-2">{item.title}</p>
                    {item.subtitle && (
                      <span className="text-[11px] text-muted-foreground">{item.subtitle}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-4 text-center text-[11px] text-muted-foreground">
                {assoc.emptyText}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function getAssociationCards(recordType: RecordType, data: any) {
  const cards: { key: string; label: string; count: number; items: { id: string; title: string; subtitle?: string; href: string }[]; emptyText: string }[] = []

  if (recordType === "contact") {
    cards.push({
      key: "notes",
      label: "Notes",
      count: data.notes?.length || 0,
      items: (data.notes || []).slice(0, 3).map((n: any) => ({
        id: n.id,
        title: n.content?.substring(0, 60) || "Note",
        subtitle: n.created_at ? format(new Date(n.created_at), "MMM d, yyyy") : undefined,
        href: `/notes/${n.id}`,
      })),
      emptyText: "No notes",
    })
    cards.push({
      key: "companies",
      label: "Companies",
      count: data.company ? 1 : 0,
      items: data.company ? [{
        id: data.company.id,
        title: data.company.name,
        subtitle: data.company.domain,
        href: `/companies/${data.company.id}`,
      }] : [],
      emptyText: "No company associated",
    })
    cards.push({
      key: "deals",
      label: "Deals",
      count: data.deals?.length || 0,
      items: (data.deals || []).slice(0, 3).map((d: any) => ({
        id: d.id,
        title: d.title,
        subtitle: d.amount ? `$${d.amount.toLocaleString()} • ${d.stage?.replace(/_/g, " ")}` : d.stage?.replace(/_/g, " "),
        href: `/deals/${d.id}`,
      })),
      emptyText: "No deals associated",
    })
    cards.push({
      key: "tickets",
      label: "Tickets",
      count: data.tickets?.length || 0,
      items: (data.tickets || []).slice(0, 3).map((t: any) => ({
        id: t.id,
        title: t.subject,
        subtitle: t.status,
        href: `/tickets/${t.id}`,
      })),
      emptyText: "No tickets found",
    })
  } else if (recordType === "company") {
    cards.push({
      key: "contacts",
      label: "Contacts",
      count: data.contacts?.length || 0,
      items: (data.contacts || []).slice(0, 3).map((c: any) => ({
        id: c.id,
        title: `${c.first_name} ${c.last_name || ""}`.trim(),
        subtitle: c.email,
        href: `/contacts/${c.id}`,
      })),
      emptyText: "No contacts",
    })
    cards.push({
      key: "deals",
      label: "Deals",
      count: data.deals?.length || 0,
      items: (data.deals || []).slice(0, 3).map((d: any) => ({
        id: d.id,
        title: d.title,
        subtitle: d.amount ? `$${d.amount.toLocaleString()}` : undefined,
        href: `/deals/${d.id}`,
      })),
      emptyText: "No deals",
    })
    cards.push({
      key: "tickets",
      label: "Tickets",
      count: data.tickets?.length || 0,
      items: (data.tickets || []).slice(0, 3).map((t: any) => ({
        id: t.id,
        title: t.subject,
        subtitle: t.status,
        href: `/tickets/${t.id}`,
      })),
      emptyText: "No tickets",
    })
  } else if (recordType === "deal") {
    cards.push({
      key: "contacts",
      label: "Contacts",
      count: data.contacts?.length || 0,
      items: (data.contacts || []).slice(0, 3).map((c: any) => ({
        id: c.id,
        title: `${c.first_name} ${c.last_name || ""}`.trim(),
        subtitle: c.email,
        href: `/contacts/${c.id}`,
      })),
      emptyText: "No contacts",
    })
    if (data.company) {
      cards.push({
        key: "company",
        label: "Company",
        count: 1,
        items: [{
          id: data.company.id,
          title: data.company.name,
          subtitle: data.company.domain,
          href: `/companies/${data.company.id}`,
        }],
        emptyText: "No company",
      })
    }
  } else if (recordType === "ticket") {
    if (data.contact) {
      cards.push({
        key: "contact",
        label: "Contact",
        count: 1,
        items: [{
          id: data.contact.id,
          title: `${data.contact.first_name} ${data.contact.last_name || ""}`.trim(),
          subtitle: data.contact.email,
          href: `/contacts/${data.contact.id}`,
        }],
        emptyText: "No contact",
      })
    }
    if (data.company) {
      cards.push({
        key: "company",
        label: "Company",
        count: 1,
        items: [{
          id: data.company.id,
          title: data.company.name,
          subtitle: data.company.domain,
          href: `/companies/${data.company.id}`,
        }],
        emptyText: "No company",
      })
    }
  }

  return cards
}

/* ── Note Comments Section ──────────────────────────────── */

function PreviewNoteComments({
  noteId,
  workspaceId,
  isOpen,
  onToggle,
  onSuccess,
}: {
  noteId: string
  workspaceId: string | null
  isOpen: boolean
  onToggle: () => void
  onSuccess?: () => void
}) {
  const [comments, setComments] = React.useState<ActivityComment[]>([])
  const [newComment, setNewComment] = React.useState("")
  const [isSaving, setIsSaving] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [currentUser, setCurrentUser] = React.useState<Profile | null>(null)
  const commentEditorRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const loadUser = async () => {
      const { data } = await authService.getCurrentUser()
      if (data) setCurrentUser(data)
    }
    loadUser()
  }, [])

  const fetchComments = React.useCallback(async () => {
    if (!noteId || !workspaceId) return
    setIsLoading(true)
    const { data, error } = await activityCommentsService.getByTarget(noteId, "note", workspaceId)
    if (!error && data) setComments(data)
    setIsLoading(false)
  }, [noteId, workspaceId])

  React.useEffect(() => {
    if (isOpen) fetchComments()
  }, [isOpen, fetchComments])

  useRealtime(
    React.useCallback(
      (payload: any) => {
        if (payload.type === "comment" && payload.new && payload.new.target_id === noteId) {
          fetchComments()
        }
      },
      [noteId, fetchComments]
    ),
    ["activity_comments"],
    workspaceId
  )

  const handleSubmit = async () => {
    if (!newComment.trim() || isSaving || !currentUser?.id || !workspaceId) return
    setIsSaving(true)
    try {
      const { data, error } = await activityCommentsService.create(
        {
          content: newComment,
          target_id: noteId,
          target_type: "note",
          author_id: currentUser.id,
        },
        workspaceId
      )
      if (error) throw error
      if (data) {
        setComments((prev) => [...prev, { ...data, author: currentUser }])
        setNewComment("")
        onSuccess?.()
      }
    } catch (err) {
      console.error("Failed to save comment:", err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="border-b border-border">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onToggle()
          }
        }}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
      >
        <span className="text-[13px] font-semibold text-foreground">
          Comments ({comments.length})
        </span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {isOpen && (
        <div className="px-5 pb-4 space-y-4">
          {/* Existing comments */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 overflow-hidden">
                    {comment.author?.avatar_url ? (
                      <Image
                        src={comment.author.avatar_url}
                        alt=""
                        width={28}
                        height={28}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      `${comment.author?.first_name?.[0] || "U"}${comment.author?.last_name?.[0] || ""}`
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12px] font-semibold text-foreground">
                        {comment.author?.first_name} {comment.author?.last_name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div
                      className="text-[12px] text-foreground bg-background p-2.5 rounded-md border border-border rich-text-content"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[12px] text-muted-foreground text-center py-2">
              No comments yet
            </div>
          )}

          {/* New comment input */}
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0 overflow-hidden">
              {currentUser?.avatar_url ? (
                <Image
                  src={currentUser.avatar_url}
                  alt=""
                  width={28}
                  height={28}
                  className="w-full h-full rounded-full"
                />
              ) : (
                `${currentUser?.first_name?.[0] || "U"}${currentUser?.last_name?.[0] || ""}`
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="bg-background border border-border rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <RichTextEditor
                  ref={commentEditorRef}
                  initialValue={newComment}
                  onChange={setNewComment}
                  placeholder="Add a comment..."
                  className="w-full p-3 text-[12px] min-h-[50px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || isSaving}
                  className={cn(
                    "px-3 py-1 text-[12px] font-semibold rounded transition-colors",
                    newComment.trim() && !isSaving
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-border/40 text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {isSaving ? "Saving..." : "Comment"}
                </button>
                <button
                  onClick={() => setNewComment("")}
                  className="text-[12px] font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Skeleton ───────────────────────────────────────────── */

function PanelSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-4 pb-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-16" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-7 rounded" />
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>
      <div className="px-5 py-3 border-b border-border">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-2.5 w-8" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 px-5 py-4 space-y-4">
        <Skeleton className="h-4 w-28" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="grid grid-cols-[100px_1fr] gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
