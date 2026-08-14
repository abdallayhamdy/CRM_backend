"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { z } from "zod"
import { ticketsService } from "@/services/tickets"
import type { Ticket } from "@/lib/types/crm"
import { toast } from "sonner"

import { useAuth } from "@/hooks/use-auth"
import { CustomFieldsForm } from "@/components/properties/CustomFieldsForm"

const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const
const TICKET_STATUSES = ["open", "pending", "resolved", "closed"] as const

export const baseTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  pipeline: z.string().optional(),
  status: z.enum(TICKET_STATUSES).optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  owner: z.string().optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  createDate: z.string().optional(),
  closeDate: z.string().optional(),
  lastClosedDate: z.string().optional(),
  assignedTeams: z.string().optional(),
  category: z.string().optional(),
  resolution: z.string().optional(),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  customer_agent_ticket_status: z.string().optional(),
})

export type TicketValues = z.infer<typeof baseTicketSchema>

export interface Property {
  id: string
  label: string
  required?: boolean
  selected: boolean
}

export interface PropertyGroup {
  id: string
  label: string
  properties: Property[]
}

export const INITIAL_GROUPS: PropertyGroup[] = [
  {
    id: "ticket-info",
    label: "Ticket information",
    properties: [
      { id: "ticket_name", label: "Ticket name", required: true, selected: true },
      { id: "ticket_status", label: "Ticket status", required: true, selected: true },
      { id: "ticket_description", label: "Ticket description", selected: true },
      { id: "priority", label: "Priority", selected: true },
    ]
  }
]

export const DEFAULT_ORDER = [
  "ticket_name",
  "ticket_status",
  "ticket_description",
  "priority",
]

interface CreateTicketSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateTicketSheet({ open, onOpenChange, onSuccess }: CreateTicketSheetProps) {
  const { workspaceId } = useAuth()
  const [formFields, setFormFields] = React.useState<Property[]>([])
  const [customValues, setCustomValues] = React.useState<Record<string, any>>({})
  const [customFieldErrors, setCustomFieldErrors] = React.useState<Record<string, string>>({})

  const setCustomValue = React.useCallback((name: string, value: any) => {
    setCustomValues(prev => ({ ...prev, [name]: value }))
  }, [])

  const dynamicTicketSchema = React.useMemo(() => {
    return z.object({
      subject: z.string().min(1, "Subject is required"),
      status: z.enum(TICKET_STATUSES).optional(),
      description: z.string().optional().or(z.literal('')),
      priority: z.enum(TICKET_PRIORITIES).optional(),
      contactId: z.string().optional(),
    })
  }, [formFields])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<TicketValues>({
    resolver: zodResolver(dynamicTicketSchema as any),
    mode: "onChange",
    defaultValues: {
      subject: "",
      status: "open",
      description: "",
      priority: "medium",
      contactId: "",
    }
  })

  React.useEffect(() => {
    if (open) {
      const saved = localStorage.getItem("ticket_form_config")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFormFields(parsed)
            return
          }
        } catch (e) { /* corrupted localStorage — fall through to defaults */ }
      }
      
      const allProps = INITIAL_GROUPS.flatMap(g => g.properties)
      const selectedProps = allProps.filter(p => p.selected)
      
      const orderedProps = [...selectedProps].sort((a, b) => {
        const idxA = DEFAULT_ORDER.indexOf(a.id)
        const idxB = DEFAULT_ORDER.indexOf(b.id)
        if (idxA === -1) return 1
        if (idxB === -1) return -1
        return idxA - idxB
      })
      
      setFormFields(orderedProps)
    }
  }, [open])

  const onSubmit = async (data: TicketValues) => {
    if (Object.keys(customFieldErrors).length > 0) {
      toast.error("Please fill in all required custom fields")
      return
    }
    try {
      const payload: Record<string, any> = {
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        status: data.status,
      }
      if (data.contactId && data.contactId !== "none") {
        payload.contact_id = data.contactId
      }
      if (Object.keys(customValues).length > 0) {
        payload.custom_fields = customValues
      }
      const { error } = await ticketsService.create(payload as Partial<Ticket>)
      if (error) throw error
      
      toast.success(`Ticket "${data.subject}" created`)
      reset()
      setCustomValues({})
      setCustomFieldErrors({})
      onSuccess?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create ticket")
    }
  }

  React.useEffect(() => {
    if (!open) {
      reset()
      setCustomValues({})
      setCustomFieldErrors({})
    }
  }, [open, reset])

  const renderField = (prop: Property) => {
    const requiredIndicator = prop.required ? " after:content-['*'] after:ml-0.5 after:text-destructive" : ""
    
    switch (prop.id) {
      case "ticket_name":
        return (
          <div key={prop.id} className="space-y-2">
            <Label htmlFor="subject" className={`text-foreground font-semibold text-[13px]${requiredIndicator}`}>
              {prop.label}
            </Label>
            <Input
              id="subject"
              className="border-border focus-visible:ring-[var(--color-hs-teal)] text-[13px]"
              {...register("subject")}
            />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
          </div>
        )
      case "ticket_status":
        return (
          <div key={prop.id} className="space-y-2">
            <Label className={`text-foreground font-semibold text-[13px]${requiredIndicator}`}>
              {prop.label}
            </Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="border-border focus:ring-[var(--color-hs-teal)] text-[13px]">
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
          </div>
        )
      case "ticket_description":
        return (
          <div key={prop.id} className="space-y-2">
            <Label htmlFor="description" className={`text-foreground font-semibold text-[13px]${requiredIndicator}`}>
              {prop.label}
            </Label>
            <Textarea
              id="description"
              className="border-border focus-visible:ring-[var(--color-hs-teal)] min-h-[80px] text-[13px]"
              {...register("description")}
            />
          </div>
        )
      case "priority":
        return (
          <div key={prop.id} className="space-y-2">
            <Label className={`text-foreground font-semibold text-[13px]${requiredIndicator}`}>
              {prop.label}
            </Label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="border-border focus:ring-[var(--color-hs-teal)] text-[13px]">
                    <SelectValue placeholder="" />
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
          </div>
        )
      default:
        return null
    }
  }

  const footerActions = (
    <div className="flex justify-between items-center w-full">
      <Button 
        type="button"
        disabled={!isValid || isSubmitting}
        className="px-4 py-2 text-[13px] font-bold text-foreground bg-background border border-border hover:bg-[color:var(--color-slate-50)] rounded transition-colors"
      >
        Create and add another
      </Button>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="px-4 py-2 text-[13px] font-bold text-foreground bg-muted hover:bg-muted/80 rounded transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          disabled={!isValid || isSubmitting}
          className="px-4 py-2 text-[13px] font-bold text-[var(--color-hs-card-bg)] bg-[var(--color-hs-teal)] hover:bg-[var(--color-hs-teal)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-[var(--color-hs-card-bg)] border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            "Create"
          )}
        </button>
      </div>
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[480px] p-0" showCloseButton={false}>
        <SheetTitle className="sr-only">Create Ticket</SheetTitle>
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-[var(--color-hs-border)]">
          <h2 className="text-[16px] font-bold text-foreground">Create Ticket</h2>
        </div>

        <div className="flex flex-col h-full overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="flex justify-end">
              <a href="/tickets/settings/form" className="text-sm font-semibold text-[var(--color-hs-teal)] hover:underline flex items-center gap-1">
                Edit this form <span className="text-[10px]">↗</span>
              </a>
            </div>
            
            {formFields.map(renderField)}

            <div className="border-t border-border pt-4">
              <CustomFieldsForm
                objectType="ticket"
                values={customValues}
                onChange={setCustomValue}
                onValidationChange={setCustomFieldErrors}
              />
            </div>

            <div className="mt-8 pt-4 space-y-4 border-t border-border">
              <h3 className="font-bold text-foreground text-[15px]">Associate Ticket with</h3>
              
              <div className="space-y-2">
                <Label className="text-foreground font-semibold text-[13px]">
                  Contact
                </Label>
                <Controller
                  name="contactId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="border-border focus:ring-[var(--color-hs-teal)] text-[13px]">
                        <SelectValue placeholder="Search" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-[13px]">No contact</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-4 h-4 rounded border border-border bg-[color:var(--color-slate-50)] flex-shrink-0" />
                  <span className="text-[13px] text-muted-foreground">Add timeline activity from this Contact ⓘ</span>
                </div>
              </div>
            </div>

          </div>
          
          <div className="mt-auto py-4 px-6 border-t border-[var(--color-hs-border)] bg-[color:var(--color-slate-50)]">
            {footerActions}
          </div>
        </form>
      </div>
      </SheetContent>
    </Sheet>
  )
}

