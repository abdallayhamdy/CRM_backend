"use client"

import React from "react"
import { Search, CheckSquare, Square, Loader2, TicketCheck } from "lucide-react"
import { ticketsService } from "@/services/tickets"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/shared/FormField"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { INITIAL_GROUPS, DEFAULT_ORDER, TicketValues } from "@/app/tickets/create-ticket-sheet"
import { useFormLayout, type FormFieldGroup } from "@/hooks/use-form-layout"
import { FloatingPanel } from "@/components/activities/FloatingPanel"
import { DatePicker } from "@/components/ui/date-picker"

type Tab = "create" | "existing"

interface TicketResult {
  id: string
  subject: string
  status: string
  priority: string
  contact_id: string | null
}

interface AddTicketSheetProps {
  open: boolean
  onClose: () => void
  contactId: string
  contactName?: string
  companyId?: string
  workspaceId?: string
  onSuccess: () => void
}

const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const
const TICKET_STATUSES = ["open", "pending", "resolved", "closed"] as const

export function AddTicketSheet({
  open,
  onClose,
  contactId,
  contactName,
  companyId,
  workspaceId,
  onSuccess,
}: AddTicketSheetProps) {
  const [tab, setTab] = React.useState<Tab>("create")
  const [search, setSearch] = React.useState("")
  const [tickets, setTickets] = React.useState<TicketResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)
  const [showAll, setShowAll] = React.useState(false)

  React.useEffect(() => {
    if (tab !== "existing" || !open) return
    const load = async () => {
      if (!workspaceId) return
      setLoading(true)
      const { data } = await ticketsService.getAll({ workspace_id: workspaceId })
      setTickets((data as unknown as TicketResult[]) || [])
      setLoading(false)
    }
    load()
  }, [tab, open, workspaceId])

  const filtered = React.useMemo(() => {
    if (!search.trim()) return tickets
    return tickets.filter(t =>
      t.subject.toLowerCase().includes(search.toLowerCase())
    )
  }, [tickets, search])

  const alreadyLinked = filtered.filter(t => t.contact_id === contactId)
  const recommendations = filtered.filter(t => t.contact_id !== contactId)
  const visibleRecommendations = showAll ? recommendations : recommendations.slice(0, 10)

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    if (selectedIds.length === 0) return
    setSaving(true)
    try {
      await Promise.all(
        selectedIds.map(ticketId => ticketsService.update(ticketId, { contact_id: contactId }, workspaceId!))
      )
      toast.success(
        selectedIds.length === 1
          ? "Ticket associated successfully"
          : `${selectedIds.length} tickets associated`
      )
      onSuccess()
      onClose()
    } catch {
      toast.error("Failed to associate ticket(s)")
    } finally {
      setSaving(false)
    }
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })

  return (
    <FloatingPanel
      open={open}
      onClose={onClose}
      icon={<TicketCheck className="w-4 h-4" />}
      title="Ticket"
      footer={
        tab === "create" ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {dateStr} at {timeStr} GMT+2
            </span>
            <span />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">
              {selectedIds.length} selected
            </span>
            <Button
              onClick={handleSave}
              disabled={selectedIds.length === 0 || saving}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-5"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex border-b border-border -mx-4 px-4">
          <button
            onClick={() => setTab("create")}
            className={cn(
              "flex-1 py-3 text-[13px] font-semibold border-b-2 transition-colors",
              tab === "create"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground/60 hover:text-foreground"
            )}
          >
            Create new
          </button>
          <button
            onClick={() => setTab("existing")}
            className={cn(
              "flex-1 py-3 text-[13px] font-semibold border-b-2 transition-colors",
              tab === "existing"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground/60 hover:text-foreground"
            )}
          >
            Add existing
          </button>
        </div>

        {tab === "create" ? (
          <InlineCreateTicketForm
            contactId={contactId}
            contactName={contactName}
            companyId={companyId}
            workspaceId={workspaceId}
            onSuccess={() => {
              onSuccess()
              onClose()
            }}
            onCancel={onClose}
          />
        ) : (
          <ExistingTicketsTab
            search={search}
            setSearch={setSearch}
            loading={loading}
            alreadyLinked={alreadyLinked}
            visibleRecommendations={visibleRecommendations}
            recommendations={recommendations}
            showAll={showAll}
            setShowAll={setShowAll}
            selectedIds={selectedIds}
            toggleSelect={toggleSelect}
            filtered={filtered}
          />
        )}
      </div>
    </FloatingPanel>
  )
}

function ExistingTicketsTab({
  search,
  setSearch,
  loading,
  alreadyLinked,
  visibleRecommendations,
  recommendations,
  showAll,
  setShowAll,
  selectedIds,
  toggleSelect,
  filtered,
}: {
  search: string
  setSearch: (v: string) => void
  loading: boolean
  alreadyLinked: TicketResult[]
  visibleRecommendations: TicketResult[]
  recommendations: TicketResult[]
  showAll: boolean
  setShowAll: (v: boolean) => void
  selectedIds: string[]
  toggleSelect: (id: string) => void
  filtered: TicketResult[]
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search tickets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-muted text-muted-foreground rounded text-[13px] focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background"
        />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {alreadyLinked.length > 0 && (
              <div>
                <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Already associated ({alreadyLinked.length})
                </h3>
                <div className="bg-background border border-border rounded-md shadow-sm divide-y divide-border">
                  {alreadyLinked.map(t => (
                    <div key={t.id} className="p-3 flex items-start gap-3">
                      <CheckSquare className="w-4 h-4 text-muted-foreground/50 mt-0.5" />
                      <div>
                        <div className="text-[14px] font-bold text-foreground">{t.subject}</div>
                        <div className="text-[12px] text-muted-foreground mt-0.5">
                          Status: <span className="uppercase font-semibold">{t.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {visibleRecommendations.length > 0 && (
              <div>
                <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Tickets ({recommendations.length})
                </h3>
                <div className="bg-background border border-border rounded-md shadow-sm divide-y divide-border">
                  {visibleRecommendations.map(t => {
                    const isSelected = selectedIds.includes(t.id)
                    return (
                      <div
                        key={t.id}
                        className="p-3 flex items-start gap-3 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => toggleSelect(t.id)}
                      >
                        <div className="mt-0.5">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground/50" />
                          )}
                        </div>
                        <div>
                          <div className="text-[14px] font-bold text-foreground">{t.subject}</div>
                          <div className="text-[12px] text-muted-foreground mt-0.5">
                            Status: <span className="uppercase font-semibold">{t.status}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {!showAll && recommendations.length > 10 && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="mt-3 w-full py-2 bg-background border border-border rounded text-[13px] font-bold text-foreground hover:bg-muted/50 transition-colors"
                  >
                    Show {recommendations.length - 10} more
                  </button>
                )}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-[13px]">
                No tickets found.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function InlineCreateTicketForm({
  contactId,
  contactName,
  companyId,
  workspaceId,
  onSuccess,
  onCancel,
}: {
  contactId: string
  contactName?: string
  companyId?: string
  workspaceId?: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const defaultOrdered = React.useMemo(() => {
    const allProps = INITIAL_GROUPS.flatMap(g => g.properties)
    return [...allProps.filter(p => p.selected)].sort((a, b) => {
      const idxA = DEFAULT_ORDER.indexOf(a.id)
      const idxB = DEFAULT_ORDER.indexOf(b.id)
      if (idxA === -1) return 1
      if (idxB === -1) return -1
      return idxA - idxB
    })
  }, [])

  const { formFields, loading: fieldsLoading } = useFormLayout('ticket', defaultOrdered)

  const dynamicTicketSchema = React.useMemo(() => {
    const fieldMapping: Record<string, string> = {
      ticket_name: "subject",
      pipeline: "pipeline",
      ticket_status: "status",
      ticket_description: "description",
      source: "source",
      ticket_owner: "owner",
      priority: "priority",
      create_date: "createDate",
      close_date: "closeDate",
      last_closed_date: "lastClosedDate",
      assigned_teams: "assignedTeams",
      category: "category",
      resolution: "resolution",
      customer_agent_ticket_status: "customer_agent_ticket_status",
    }

    const requiredFields = new Set(
      formFields.filter(f => f.required).map(f => fieldMapping[f.id]).filter(Boolean)
    )

    return z.object({
      subject: requiredFields.has("subject") ? z.string().min(1, "Required") : z.string().optional().or(z.literal('')),
      pipeline: requiredFields.has("pipeline") ? z.string().min(1, "Required") : z.string().optional().or(z.literal('')),
      status: requiredFields.has("status") ? z.enum(TICKET_STATUSES) : z.enum(TICKET_STATUSES).optional(),
      description: requiredFields.has("description") ? z.string().min(1, "Required") : z.string().optional().or(z.literal('')),
      source: requiredFields.has("source") ? z.string().min(1, "Required") : z.string().optional().or(z.literal('')),
      owner: requiredFields.has("owner") ? z.string().min(1, "Required") : z.string().optional().or(z.literal('')),
      priority: requiredFields.has("priority") ? z.enum(TICKET_PRIORITIES) : z.enum(TICKET_PRIORITIES).optional(),
      createDate: requiredFields.has("createDate") ? z.string().min(1, "Required") : z.string().optional().or(z.literal('')),
      closeDate: requiredFields.has("closeDate") ? z.string().min(1, "Required") : z.string().optional().or(z.literal('')),
      lastClosedDate: requiredFields.has("lastClosedDate") ? z.string().min(1, "Required") : z.string().optional().or(z.literal('')),
      assignedTeams: requiredFields.has("assignedTeams") ? z.string().min(1, "Required") : z.string().optional().or(z.literal('')),
      category: requiredFields.has("category") ? z.string().min(1, "Required") : z.string().optional().or(z.literal('')),
      resolution: requiredFields.has("resolution") ? z.string().min(1, "Required") : z.string().optional().or(z.literal('')),
      contactId: z.string().optional(),
      companyId: z.string().optional(),
      customer_agent_ticket_status: requiredFields.has("customer_agent_ticket_status") ? z.string().min(1, "Required") : z.string().optional().or(z.literal('')),
    })
  }, [formFields])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useForm<TicketValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(dynamicTicketSchema as any) as import("react-hook-form").Resolver<TicketValues>,
    mode: "onChange",
    defaultValues: {
      subject: "",
      pipeline: "Support Pipeline",
      status: "open",
      description: "",
      source: "",
      owner: "",
      priority: "medium",
      createDate: "",
      closeDate: "",
      lastClosedDate: "",
      assignedTeams: "",
      category: "",
      resolution: "",
      contactId: "",
      companyId: "",
      customer_agent_ticket_status: "",
    }
  })

  const renderField = (prop: FormFieldGroup) => {
    switch (prop.id) {
      case "ticket_name":
        return (
          <FormField
            key={prop.id}
            label={prop.label}
            required={prop.required}
            htmlFor="subject"
            error={errors.subject?.message}
          >
            <Input
              id="subject"
              className="border-border focus-visible:ring-primary text-[13px]"
              {...register("subject")}
            />
          </FormField>
        )
      case "pipeline":
        return (
          <FormField key={prop.id} label={prop.label} required={prop.required}>
            <Controller
              name="pipeline"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="border-border focus:ring-primary text-[13px]">
                    <SelectValue placeholder="Select pipeline..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Support Pipeline" className="text-[13px]">Support Pipeline</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        )
      case "ticket_status":
        return (
          <FormField key={prop.id} label={prop.label} required={prop.required}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="border-border focus:ring-primary text-[13px]">
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open" className="text-[13px]">Open</SelectItem>
                    <SelectItem value="pending" className="text-[13px]">Pending</SelectItem>
                    <SelectItem value="resolved" className="text-[13px]">Resolved</SelectItem>
                    <SelectItem value="closed" className="text-[13px]">Closed</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        )
      case "ticket_description":
        return (
          <FormField
            key={prop.id}
            label={prop.label}
            required={prop.required}
            htmlFor="description"
          >
            <Textarea
              id="description"
              className="border-border focus-visible:ring-primary min-h-[80px] text-[13px]"
              {...register("description")}
            />
          </FormField>
        )
      case "source":
        return (
          <FormField key={prop.id} label={prop.label} required={prop.required}>
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="border-border focus:ring-primary text-[13px]">
                    <SelectValue placeholder="Select source..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email" className="text-[13px]">Email</SelectItem>
                    <SelectItem value="phone" className="text-[13px]">Phone</SelectItem>
                    <SelectItem value="web" className="text-[13px]">Web</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        )
      case "ticket_owner":
        return (
          <FormField key={prop.id} label={prop.label} required={prop.required}>
            <Controller
              name="owner"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="border-border focus:ring-primary text-[13px]">
                    <SelectValue placeholder="Select owner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vs Realestate" className="text-[13px]">Vs Realestate</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        )
      case "priority":
        return (
          <FormField key={prop.id} label={prop.label} required={prop.required}>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="border-border focus:ring-primary text-[13px]">
                    <SelectValue placeholder="Select priority..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low" className="text-[13px]">Low</SelectItem>
                    <SelectItem value="medium" className="text-[13px]">Medium</SelectItem>
                    <SelectItem value="high" className="text-[13px]">High</SelectItem>
                    <SelectItem value="urgent" className="text-[13px]">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        )
      case "create_date":
        return (
          <FormField
            key={prop.id}
            label={prop.label}
            required={prop.required}
            htmlFor="createDate"
          >
            <Controller
              name="createDate"
              control={control}
              render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} />
              )}
            />
          </FormField>
        )
      case "close_date":
        return (
          <FormField
            key={prop.id}
            label={prop.label}
            required={prop.required}
            htmlFor="closeDate"
          >
            <Controller
              name="closeDate"
              control={control}
              render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} />
              )}
            />
          </FormField>
        )
      case "last_closed_date":
        return (
          <FormField
            key={prop.id}
            label={prop.label}
            required={prop.required}
            htmlFor="lastClosedDate"
          >
            <Controller
              name="lastClosedDate"
              control={control}
              render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} />
              )}
            />
          </FormField>
        )
      case "assigned_teams":
        return (
          <FormField key={prop.id} label={prop.label} required={prop.required}>
            <Controller
              name="assignedTeams"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="border-border focus:ring-primary text-[13px]">
                    <SelectValue placeholder="Select team..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="support" className="text-[13px]">Support</SelectItem>
                    <SelectItem value="billing" className="text-[13px]">Billing</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        )
      case "category":
        return (
          <FormField key={prop.id} label={prop.label} required={prop.required}>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="border-border focus:ring-primary text-[13px]">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug" className="text-[13px]">Bug</SelectItem>
                    <SelectItem value="feature_request" className="text-[13px]">Feature Request</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        )
      case "file_upload":
        return (
          <FormField key={prop.id} label={prop.label} required={prop.required}>
            <Button type="button" variant="outline" size="sm" className="bg-background border-border h-8 font-normal text-foreground/70">
              <span className="text-lg leading-none mr-1 font-light">+</span> Add file
            </Button>
          </FormField>
        )
      case "resolution":
        return (
          <FormField key={prop.id} label={prop.label} required={prop.required}>
            <Controller
              name="resolution"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="border-border focus:ring-primary text-[13px]">
                    <SelectValue placeholder="Select resolution..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed" className="text-[13px]">Fixed</SelectItem>
                    <SelectItem value="wont_fix" className="text-[13px]">Won't Fix</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        )
      case "time_to_close":
        return (
          <FormField
            key={prop.id}
            label={prop.label}
            required={prop.required}
            htmlFor="timeToClose"
          >
            <Input
              id="timeToClose"
              readOnly
              disabled
              className="bg-muted/50 border-border text-[13px]"
            />
          </FormField>
        )
      case "time_to_first_response":
        return (
          <FormField
            key={prop.id}
            label={prop.label}
            required={prop.required}
            htmlFor="timeToFirstResponse"
          >
            <Input
              id="timeToFirstResponse"
              readOnly
              disabled
              className="bg-muted/50 border-border text-[13px]"
            />
          </FormField>
        )
      case "customer_agent_ticket_status":
        return (
          <FormField key={prop.id} label={prop.label} required={prop.required}>
            <Controller
              name="customer_agent_ticket_status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field?.value as string}>
                  <SelectTrigger className="border-border focus:ring-primary text-[13px]">
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiting" className="text-[13px]">Waiting on us</SelectItem>
                    <SelectItem value="waiting_customer" className="text-[13px]">Waiting on customer</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        )
      default:
        return null
    }
  }

  const onSubmit = async (data: TicketValues) => {
    try {
      const payload = {
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        status: data.status,
        contact_id: contactId,
        company_id: companyId,
        workspace_id: workspaceId,
      }
      const { error } = await ticketsService.create(payload as any)
      if (error) throw error

      toast.success(`Ticket "${data.subject}" created`)
      onSuccess()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create ticket")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="p-3 bg-muted/50 border border-border rounded text-[13px]">
        Associated with contact: <span className="font-bold text-foreground">{contactName || "Unknown"}</span>
      </div>

      {fieldsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {formFields.map(renderField)}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-border text-foreground"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-5"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </form>
  )
}
