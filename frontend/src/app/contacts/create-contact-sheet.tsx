"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useObjectConfig } from "@/hooks/use-object-config"
import { LifecycleDropdown } from "@/components/crm/LifecycleDropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  VisuallyHidden,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { contactsService } from "@/services/contacts"
import { authService } from "@/services/auth"
import { Profile, Contact } from "@/lib/types/crm"
import { LEAD_STATUS_OPTIONS } from "@/lib/crm-constants"
import { toast } from "sonner"
import { ExternalLink, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { laravelApi as api } from "@/lib/laravel-api"
import { CustomFieldsForm } from "@/components/properties/CustomFieldsForm"

const contactSchema = z.object({
  email:           z.string().email("Invalid email").optional().or(z.literal("")),
  first_name:      z.string().min(1, "First name is required"),
  last_name:       z.string().optional().or(z.literal("")),
  job_title:       z.string().optional().or(z.literal("")),
  phone:           z.string().optional().or(z.literal("")),
  lifecycle_stage: z.string(),
  lead_status:     z.string().optional().or(z.literal("")),
  owner:           z.string().optional().or(z.literal("")),
  company_name:    z.string().optional().or(z.literal("")),
  legal_basis:     z.string().optional().or(z.literal("")),
})

type ContactFormValues = z.infer<typeof contactSchema> & Record<string, any>

interface CreateContactSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface FormField {
  id: string
  label: string
  required: boolean
  type: "text" | "email" | "tel" | "select" | "lifecycle"
}

const DEFAULT_FIELDS: FormField[] = [
  { id: "email",           label: "Email",                                       required: true,  type: "email"     },
  { id: "first_name",      label: "First name",                                  required: true,  type: "text"      },
  { id: "last_name",       label: "Last name",                                   required: false, type: "text"      },
  { id: "owner",           label: "Contact owner",                               required: false, type: "select"    },
  { id: "company_name",    label: "Company name",                                 required: false, type: "text"     },
  { id: "job_title",       label: "Job title",                                   required: false, type: "text"      },
  { id: "phone",           label: "Phone number",                                required: false, type: "tel"       },
  { id: "lifecycle_stage", label: "Lifecycle stage",                             required: false, type: "lifecycle" },
  { id: "lead_status",     label: "Lead status",                                 required: false, type: "select"    },
  { id: "legal_basis",     label: "Legal basis for processing contact's data",   required: false, type: "select"    },
]

export function CreateContactSheet({ open, onOpenChange, onSuccess }: CreateContactSheetProps) {
  const [isSubmittingAnother, setIsSubmittingAnother] = React.useState(false)
  const [fields, setFields] = React.useState<FormField[]>(DEFAULT_FIELDS)
  const [owners, setOwners] = React.useState<Profile[]>([])
  const [customValues, setCustomValues] = React.useState<Record<string, any>>({})
  const [customFieldErrors, setCustomFieldErrors] = React.useState<Record<string, string>>({})
  const { workspaceId, user } = useAuth()
  const { stages: lifecycleStages } = useObjectConfig("contact")

  const setCustomValue = React.useCallback((name: string, value: any) => {
    setCustomValues(prev => ({ ...prev, [name]: value }))
  }, [])

  React.useEffect(() => {
    async function loadData() {
      const { data } = await authService.listProfiles(workspaceId!)
      if (data) setOwners(data)
    }
    loadData()
  }, [])

  React.useEffect(() => {
    if (open) {
      const saved = localStorage.getItem("crm_contact_form_config")
      if (saved) {
        try {
          setFields(JSON.parse(saved))
        } catch (e) {
          console.error("Failed to parse form config", e)
        }
      } else {
        setFields(DEFAULT_FIELDS)
      }
    }
  }, [open])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: "onChange",
    defaultValues: {
      lifecycle_stage: "lead",
    }
  })

  React.useEffect(() => {
    if (!open) {
      reset()
      setCustomValues({})
      setCustomFieldErrors({})
    }
  }, [open, reset])

  React.useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      const bodyPE = document.body.style.pointerEvents
      const sheetContent = document.querySelector('[data-slot="sheet-content"]')
      const triggers = document.querySelectorAll('[data-slot="select-trigger"]')
      const selectRoots = document.querySelectorAll('[data-slot="select"]')
      const selectContents = document.querySelectorAll('[data-slot="select-content"]')
      console.group('🔍 CREATE CONTACT SHEET DIAGNOSTIC')
      console.log('body pointerEvents:', bodyPE)
      console.log('sheet content zIndex:', sheetContent ? getComputedStyle(sheetContent).zIndex : 'N/A')
      console.log('sheet content pointerEvents:', sheetContent ? getComputedStyle(sheetContent).pointerEvents : 'N/A')
      console.log('sheet content overflow:', sheetContent ? getComputedStyle(sheetContent).overflow : 'N/A')
      console.log('Radix Select roots in DOM:', selectRoots.length)
      console.log('SelectContent in DOM:', selectContents.length)
      console.log('Select triggers in DOM:', triggers.length)
      triggers.forEach((t, i) => {
        const id = t.getAttribute('id') || `trigger-${i}`
        const pe = getComputedStyle(t).pointerEvents
        const zIndex = getComputedStyle(t).zIndex
        const rect = t.getBoundingClientRect()
        const isVisible = rect.width > 0 && rect.height > 0
        const type = t.getAttribute('type')
        console.log(`trigger #${id}: pointerEvents=${pe}, zIndex=${zIndex}, visible=${isVisible}, type=${type}, parentTag=${t.parentElement?.tagName}, rect=`, rect)
      })
      // Check body children for portal content
      const allBodyChildren = document.body.children
      console.log('body children count:', allBodyChildren.length)
      for (let i = 0; i < allBodyChildren.length; i++) {
        const el = allBodyChildren[i]
        const pe = getComputedStyle(el).pointerEvents
        const zi = getComputedStyle(el).zIndex
        const pos = getComputedStyle(el).position
        if (el instanceof HTMLElement && (zi !== 'auto' || pe !== 'auto' || pos === 'fixed')) {
          console.log(`body child #${i}: tag=${el.tagName}, zIndex=${zi}, pointerEvents=${pe}, position=${pos}, id=${el.id || el.getAttribute('data-slot') || 'none'}`)
        }
      }
      console.groupEnd()
    }, 500)
    return () => clearTimeout(timer)
  }, [open])

  // Monitor pointer events on the document when sheet is open
  React.useEffect(() => {
    if (!open) return
    const handler = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      const trigger = target.closest('[data-slot="select-trigger"]')
      if (trigger) {
        const id = trigger.getAttribute('id')
        console.log(`🔴 POINTER DOWN on select trigger: ${id}, eventPhase=${e.eventPhase}, composed=${e.composed}`)
        // Check if pointer events are blocked
        const bodyPE = document.body.style.pointerEvents
        if (bodyPE === 'none') {
          console.log(`   ⚠️ body has pointerEvents=none — this will NOT reach the element!`)
        }
      }
    }
    document.addEventListener('pointerdown', handler, true)
    return () => document.removeEventListener('pointerdown', handler, true)
  }, [open])

  const submitContact = async (data: ContactFormValues) => {
    if (!user) {
      toast.error("Please sign in to create contacts.")
      throw new Error("Auth session missing")
    }

    const payload: Partial<Contact> = {
      first_name: data.first_name,
      email: data.email || undefined,
      lifecycle_stage: data.lifecycle_stage || "lead",
      workspace_id: workspaceId,
    }

    if (data.last_name) payload.last_name = data.last_name
    if (data.phone) payload.phone = data.phone
    if (data.owner) payload.owner_id = data.owner
    if (data.company_name) payload.company_name = data.company_name

    const customFields: Record<string, any> = {}
    const coreKeys = ["email", "first_name", "last_name", "phone", "lifecycle_stage", "owner", "company_name"]
    Object.keys(data).forEach(key => {
      const k = key as keyof ContactFormValues
      if (!coreKeys.includes(k) && data[k]) {
        customFields[k] = data[k]
      }
    })

    const mergedCustom = { ...customFields, ...customValues }
    if (Object.keys(mergedCustom).length > 0) {
      payload.custom_fields = mergedCustom
    }

    const { data: result, error } = await api.post('/contacts', payload)

    if (error) {
      throw { message: error }
    }
    return (result as any)?.data
  }

  const handleError = (err: unknown) => {
    const error = err as { code?: string; message?: string }
    if (error.code === "23505") {
      toast.error("A contact with this email already exists")
    } else if (error.message) {
      toast.error(error.message)
    } else {
      toast.error("Failed to create contact")
    }
  }

  const onSubmit = async (data: ContactFormValues) => {
    if (Object.keys(customFieldErrors).length > 0) {
      toast.error("Please fill in all required custom fields")
      return
    }
    try {
      await submitContact(data)
      toast.success("Contact created successfully")
      onOpenChange(false)
      onSuccess?.()
    } catch (err: unknown) {
      handleError(err)
    }
  }

  const onSubmitAndAnother = async (data: ContactFormValues) => {
    if (Object.keys(customFieldErrors).length > 0) {
      toast.error("Please fill in all required custom fields")
      return
    }
    setIsSubmittingAnother(true)
    try {
      await submitContact(data)
      toast.success("Contact created — ready for another")
      reset()
      onSuccess?.()
    } catch (err: unknown) {
      handleError(err)
    } finally {
      setIsSubmittingAnother(false)
    }
  }

  const renderField = (field: FormField) => {
    const labelEl = (
      <Label htmlFor={field.id} className="text-[13px] font-semibold text-foreground">
        {field.label} {field.required && <span className="text-destructive">*</span>}
      </Label>
    )

    switch (field.type) {
      case "lifecycle":
        return (
          <div key={field.id} className="flex flex-col gap-1.5">
            {labelEl}
            <Controller
              control={control}
              name={field.id}
              defaultValue="lead"
              render={({ field: controlledField }) => (
                <LifecycleDropdown
                  value={controlledField.value}
                  onChange={controlledField.onChange}
                  objectType="contact"
                />
              )}
            />
          </div>
        )

      case "select":
        return (
          <div key={field.id} className="flex flex-col gap-1.5">
            {labelEl}
            <Controller
              control={control}
              name={field.id}
              render={({ field: controlledField }) => (
                  <Select
                    {...(field.id === "owner"
                      ? { value: controlledField.value ?? "unassigned" }
                      : controlledField.value
                        ? { value: controlledField.value }
                        : {}
                    )}
                    onValueChange={(val) =>
                      controlledField.onChange(val === "unassigned" ? undefined : val)
                    }
                  >
                  <SelectTrigger id={field.id} className="h-10 text-[14px] text-foreground">
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.id === "owner" && (
                      <>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {owners.map(owner => (
                          <SelectItem key={owner.id} value={owner.clerk_user_id || owner.id}>
                            {owner.first_name} {owner.last_name || ""}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {field.id === "lead_status" && (
                      <>
                        {LEAD_STATUS_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </>
                    )}
                    {field.id === "legal_basis" && (
                      <>
                        <SelectItem value="legitimate_interest">Legitimate interest</SelectItem>
                        <SelectItem value="consent">Consent</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors[field.id] && (
              <p className="text-destructive text-xs">This field is required</p>
            )}
          </div>
        )

      default:
        return (
          <div key={field.id} className="flex flex-col gap-1.5">
            {labelEl}
            <Input
              id={field.id}
              {...register(field.id, { required: field.required })}
              type={field.type === "tel" ? "tel" : field.type === "email" ? "email" : "text"}
              className="h-10 text-[14px] text-foreground"
            />
            {errors[field.id] && (
              <p className="text-destructive text-xs">{field.label} is required</p>
            )}
          </div>
        )
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="w-full max-w-md p-0 flex flex-col gap-0"
      >
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold text-foreground">
              Create Contact
            </SheetTitle>
            <VisuallyHidden>
              <SheetDescription>Form to create a new contact</SheetDescription>
            </VisuallyHidden>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 rounded-full text-muted-foreground"
            >
              ✕
              <VisuallyHidden>Close</VisuallyHidden>
            </Button>
          </div>
        </SheetHeader>

        {/* Edit form link */}
        <div className="px-6 pt-4 pb-0 flex justify-end">
          <Link
            href="/contacts/settings/form"
            className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
          >
            Edit this form <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <form
          className="flex flex-col flex-1 overflow-hidden"
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* Scrollable fields */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {fields.map(renderField)}

            <div className="border-t border-border pt-4">
              <CustomFieldsForm
                objectType="contact"
                values={customValues}
                onChange={setCustomValue}
                onValidationChange={setCustomFieldErrors}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center gap-2">
            <Button
              type="submit"
              disabled={isSubmitting || isSubmittingAnother}
              variant="outline"
              className="h-9 text-[13px] font-semibold border-border text-muted-foreground hover:bg-accent disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Create
            </Button>

            <Button
              type="button"
              disabled={isSubmitting || isSubmittingAnother}
              variant="outline"
              onClick={handleSubmit(onSubmitAndAnother)}
              className="h-9 text-[13px] font-semibold border-border text-muted-foreground hover:bg-accent disabled:opacity-50"
            >
              {isSubmittingAnother && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Create and add another
            </Button>

            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 text-[13px] font-bold bg-foreground hover:bg-foreground text-primary-foreground border-0 ml-auto"
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
