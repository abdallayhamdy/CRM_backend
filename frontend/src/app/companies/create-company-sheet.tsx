"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { companiesService } from "@/services/companies"
import { toast } from "sonner"
import { Info, Globe, ExternalLink, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { authService } from "@/services/auth"
import Link from "next/link"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useObjectConfig } from "@/hooks/use-object-config"
import { LifecycleDropdown } from "@/components/crm/LifecycleDropdown"
import { CustomFieldsForm } from "@/components/properties/CustomFieldsForm"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Profile } from "@/lib/types/crm"

interface CreateCompanySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompanyCreated?: () => void
}
const companyFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  domain: z.string().optional(),
  industry: z.string().optional(),
  phone: z.string().optional(),
  size: z.string().optional(),
  description: z.string().optional(),
  lifecycle_stage: z.string().optional(),
  owner_id: z.string().optional().or(z.literal("")),
})

type CompanyFormValues = z.infer<typeof companyFormSchema>



export function CreateCompanySheet({ open, onOpenChange, onCompanyCreated }: CreateCompanySheetProps) {
  const { workspaceId, user } = useAuth()
  const { stages: lifecycleStages } = useObjectConfig("company")
  const [formConfig, setFormConfig] = React.useState<{id: string, label: string, required?: boolean}[] | null>(null)
  const [submitMode, setSubmitMode] = React.useState<'create' | 'create-another'>('create')
  const [customValues, setCustomValues] = React.useState<Record<string, any>>({})
  const [customFieldErrors, setCustomFieldErrors] = React.useState<Record<string, string>>({})
  const [profiles, setProfiles] = React.useState<Profile[]>([])

  const setCustomValue = React.useCallback((name: string, value: any) => {
    setCustomValues(prev => ({ ...prev, [name]: value }))
  }, [])

  React.useEffect(() => {
    if (open) {
      const saved = localStorage.getItem("company_form_config")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) {
            if (parsed.length > 0 && parsed[0].properties) {
              const selected = parsed.flatMap((g: any) => g.properties.filter((p: any) => p.selected))
              setFormConfig(selected)
            } else {
              setFormConfig(parsed)
            }
          }
        } catch (e) {
          // Expected in standalone mode
        }
      }
      authService.listProfiles(workspaceId!).then(({ data }) => {
        if (data) setProfiles(data)
      }).catch(err => console.error("[create-company]", err))
    } else {
      setCustomValues({})
      setCustomFieldErrors({})
    }
  }, [open, workspaceId])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitting }
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      domain: "",
      owner_id: user?.profileId || "",
    }
  })

  React.useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  const onSubmit = async (values: CompanyFormValues) => {
    if (Object.keys(customFieldErrors).length > 0) {
      toast.error("Please fill in all required custom fields")
      return
    }
    try {
      const createData: any = { ...values, workspace_id: workspaceId }
      if (values.lifecycle_stage === undefined || values.lifecycle_stage === null) {
        createData.lifecycle_stage = null
      }
      if (values.owner_id === "" || values.owner_id === "unassigned") {
        createData.owner_id = null
      }
      if (Object.keys(customValues).length > 0) {
        createData.custom_fields = customValues
      }
      const result = await companiesService.create(createData)

      if (result.error) {
        if (result.validationErrors) {
          const mapped: Record<string, { type: string; message: string }> = {}
          for (const [field, messages] of Object.entries(result.validationErrors)) {
            const formField = field === 'owner_id' ? 'owner_id' : field
            mapped[formField] = {
              type: 'server',
              message: Array.isArray(messages) ? messages[0] : String(messages),
            }
          }
          for (const [field, error] of Object.entries(mapped)) {
            if (field in values || field === 'owner_id') {
              setError(field as keyof CompanyFormValues, error)
            }
          }
        } else {
          toast.error(result.error.message || "Failed to create company")
        }
        return
      }

      toast.success("Company created successfully")
      onCompanyCreated?.()

      if (submitMode === 'create-another') {
        reset()
      } else {
        onOpenChange(false)
        reset()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      toast.error(`Failed to create company: ${message}`)
    }
  }

  // Default fields to show if no config is found
  const DEFAULT_FIELDS = [
    { id: "name", label: "Company name", required: true },
    { id: "domain", label: "Company domain name" },
    { id: "industry", label: "Industry" },
    { id: "phone", label: "Phone number" },
    { id: "size", label: "Company size" },
    { id: "lifecycle_stage", label: "Lifecycle stage" },
    { id: "owner_id", label: "Company owner" },
    { id: "description", label: "Description" },
  ]

  const fields = formConfig || DEFAULT_FIELDS

  const renderField = (field: { id: string; label: string; required?: boolean }) => {
    const isRequired = field.required
    const commonProps = {
      ...register(field.id as keyof CompanyFormValues),
      className: cn(
        "h-10 bg-background border-border focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-xs",
        errors[field.id as keyof CompanyFormValues] && "border-destructive focus:ring-destructive focus:border-destructive"
      )
    }

    if (field.id === "domain") {
      return (
        <div key={field.id} className="space-y-1.5">
          <label className="text-[13px] font-bold text-foreground flex items-center gap-1">
            {field.label}
            {isRequired && <span className="text-destructive">*</span>}
            <Info className="h-3.5 w-3.5 text-muted-foreground ml-1" />
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              {...commonProps}
              placeholder="e.g. SalesHub.com"
              className={cn(commonProps.className, "pl-10")}
            />
          </div>
          <p className="text-[12px] text-muted-foreground">We&apos;ll use this to search for information about the company.</p>
          {errors.domain && <p className="text-[12px] text-destructive font-medium">{errors.domain.message}</p>}
        </div>
      )
    }


    if (field.id === "lifecycle_stage") {
      return (
        <div key={field.id} className="space-y-1.5">
          <label className="text-[13px] font-bold text-foreground">
            {field.label}
            {isRequired && <span className="text-destructive">*</span>}
          </label>
          <div className="col-span-2">
            <LifecycleDropdown 
              value={watch("lifecycle_stage") || "lead"} 
              onChange={(v) => setValue("lifecycle_stage", v)}
              objectType="company"
            />
          </div>
        </div>
      )
    }

    if (field.id === "owner_id") {
      return (
        <div key={field.id} className="space-y-1.5">
          <label className="text-[13px] font-bold text-foreground flex items-center gap-1">
            {field.label}
            {isRequired && <span className="text-destructive">*</span>}
            <User className="h-3.5 w-3.5 text-muted-foreground ml-1" />
          </label>
          <Controller
            control={control}
            name="owner_id"
            render={({ field: controlledField }) => (
              <Select
                value={controlledField.value || "unassigned"}
                onValueChange={(val) => controlledField.onChange(val === "unassigned" ? "" : val)}
              >
                <SelectTrigger className="h-10 text-[14px] text-foreground">
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.clerk_user_id || p.id}>
                      {p.first_name} {p.last_name || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.owner_id && (
            <p className="text-[12px] text-destructive font-medium">{errors.owner_id.message}</p>
          )}
        </div>
      )
    }

    if (field.id === "description") {
      return (
        <div key={field.id} className="space-y-1.5">
          <label className="text-[13px] font-bold text-foreground">
            {field.label}
            {isRequired && <span className="text-destructive">*</span>}
          </label>
          <Textarea 
            {...commonProps}
            className={cn(commonProps.className, "min-h-[80px] h-auto py-2")}
          />
          {errors[field.id as keyof CompanyFormValues] && (
            <p className="text-[12px] text-destructive font-medium">
              {errors[field.id as keyof CompanyFormValues]?.message}
            </p>
          )}
        </div>
      )
    }

    return (
      <div key={field.id} className="space-y-1.5">
        <label className="text-[13px] font-bold text-foreground">
          {field.label}
          {isRequired && <span className="text-destructive">*</span>}
        </label>
        <Input 
          {...commonProps}
          type={field.id === "number_of_employees" || field.id === "annual_revenue" ? "number" : "text"}
          placeholder={field.id === "name" ? "e.g. SalesHub" : ""}
        />
        {errors[field.id as keyof CompanyFormValues] && (
          <p className="text-[12px] text-destructive font-medium">
            {errors[field.id as keyof CompanyFormValues]?.message}
          </p>
        )}
      </div>
    )
  }

  return (
    <Sheet 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Create Company</SheetTitle>
        </SheetHeader>
      <div className="flex flex-col h-full bg-background">
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 crm-scrollbar">
            
            {/* Edit this form link */}
            <div className="flex justify-end -mb-4">
              <Link 
                href="/companies/settings/form"
                className="text-muted-foreground hover:text-foreground font-bold text-[13px] flex items-center gap-1.5 no-underline hover:underline"
              >
                Edit this form
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Dynamic Fields */}
            <div className="space-y-6">
              {fields.map(field => renderField(field))}
            </div>

            <div className="border-t border-border pt-4">
              <CustomFieldsForm
                objectType="company"
                values={customValues}
                onChange={setCustomValue}
                onValidationChange={setCustomFieldErrors}
              />
            </div>

          </div>

          {/* Footer Actions matching image */}
          <div className="p-4 border-t border-border bg-muted/50 flex items-center gap-3">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              onClick={() => setSubmitMode('create')}
              className="h-9 px-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground border-none rounded-xs shadow-sm"
            >
              {isSubmitting && submitMode === 'create' ? "Creating..." : "Create"}
            </Button>
            <Button 
              type="submit" 
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setSubmitMode('create-another')}
              className="h-9 px-4 font-bold text-foreground border-border bg-background hover:bg-muted/50 rounded-xs"
            >
              {isSubmitting && submitMode === 'create-another' ? "Creating..." : "Create and add another"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="h-9 px-6 font-bold text-foreground border-border bg-background hover:bg-muted/50 rounded-xs"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
      </SheetContent>
    </Sheet>
  )
}
