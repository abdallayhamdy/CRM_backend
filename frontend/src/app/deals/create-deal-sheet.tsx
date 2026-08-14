"use client"

import * as React from "react"
import { useForm, Controller } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { dealsService } from "@/services/deals"
import { toast } from "sonner"
import { ExternalLink, Calendar as CalendarIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { DealType, DealPriority } from "@/lib/types/crm"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { contactsService } from "@/services/contacts"
import { companiesService } from "@/services/companies"
import { productsService } from "@/services/products"
import { laravelApi as api } from "@/lib/laravel-api"
import { CustomFieldsForm } from "@/components/properties/CustomFieldsForm"

interface CreateDealSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDealCreated?: () => void
}

const dealFormSchema = z.object({
  title: z.string().min(1, "Deal name is required"),
  pipeline_id: z.string().min(1, "Pipeline is required"),
  stage_id: z.string().min(1, "Stage is required"),
  amount: z.number().optional(),
  close_date: z.string().optional(),
  owner_id: z.string().optional(),
  deal_type: z.string().optional(),
  priority: z.string().optional(),
  contact_id: z.string().default("none"),
  add_timeline_contact: z.boolean().default(false),
  company_id: z.string().default("none"),
  add_timeline_company: z.boolean().default(false),
})

type DealFormValues = z.infer<typeof dealFormSchema>

const DEAL_TYPES = [
  { value: 'New Business', label: 'New Business' },
  { value: 'Existing Business', label: 'Existing Business' },
  { value: 'Renewal', label: 'Renewal' },
  { value: 'Upsell', label: 'Upsell' },
]

const PRIORITY_OPTIONS = [
  { value: 'High', label: '🔴 High' },
  { value: 'Medium', label: '🟡 Medium' },
  { value: 'Low', label: '🟢 Low' },
]

interface LineItem {
  id: string
  product_id: string
  product_name: string
  unit_price: number
  quantity: number
}

function SearchableSelect({
  value,
  onChange,
  onSearch,
  options,
  placeholder = 'Search',
  labelKey = 'label',
  valueKey = 'value',
}: {
  value: string
  onChange: (val: string, extra?: Record<string, unknown>) => void
  onSearch?: (term: string) => void
  options: { value: string; label: string; [key: string]: unknown }[]
  placeholder?: string
  labelKey?: string
  valueKey?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const ref = React.useRef<HTMLDivElement>(null)

  const selected = options.find(o => o[valueKey] === value)

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  React.useEffect(() => {
    if (open && search && onSearch) {
      onSearch(search)
    }
  }, [search, open, onSearch])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full h-10 pl-3 pr-8 bg-background border border-border rounded-xs text-left text-[13px] text-foreground flex items-center focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
      >
        {selected
          ? <span className="truncate">{String(selected[labelKey])}</span>
          : <span className="text-muted-foreground">{placeholder}</span>}
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xs shadow-lg">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full h-8 pl-3 pr-8 border border-primary rounded-full text-[13px] text-foreground focus:outline-none"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </span>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {options.filter(o =>
              !search || String(o[labelKey]).toLowerCase().includes(search.toLowerCase())
            ).length === 0
              ? <div className="px-3 py-2 text-[12px] text-muted-foreground">No results</div>
              : options
                  .filter(o => !search || String(o[labelKey]).toLowerCase().includes(search.toLowerCase()))
                  .map((opt) => (
                <button
                  key={String(opt[valueKey])}
                  type="button"
                  onClick={() => { onChange(String(opt[valueKey]), opt); setOpen(false); setSearch('') }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 hover:bg-muted/50 flex items-center text-[13px]',
                    value === String(opt[valueKey]) && 'bg-muted'
                  )}
                >
                  {String(opt[labelKey])}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function CreateDealSheet({ open, onOpenChange, onDealCreated }: CreateDealSheetProps) {
  const { workspaceId, user } = useAuth()
  const [submitMode, setSubmitMode] = React.useState<'create' | 'create-another'>('create')
  const [customValues, setCustomValues] = React.useState<Record<string, any>>({})
  const [customFieldErrors, setCustomFieldErrors] = React.useState<Record<string, string>>({})

  const setCustomValue = React.useCallback((name: string, value: any) => {
    setCustomValues(prev => ({ ...prev, [name]: value }))
  }, [])

  const [pipelines, setPipelines] = React.useState<{ id: string; name: string; is_default: boolean; stages?: { id: string; name: string; display_order: number }[] }[]>([])
  const [stages, setStages] = React.useState<{ id: string; name: string; stage_order: number }[]>([])
  const [members, setMembers] = React.useState<{ id: string; first_name: string; last_name: string; label: string }[]>([])
  const [contacts, setContacts] = React.useState<{ id: string; value: string; label: string; email: string }[]>([])
  const [companies, setCompanies] = React.useState<{ id: string; value: string; label: string }[]>([])
  const [products, setProducts] = React.useState<{ id: string; value: string; label: string; unit_price: number }[]>([])
  const [lineItems, setLineItems] = React.useState<LineItem[]>([])

  // Fetch all dropdown data on mount
  React.useEffect(() => {
    if (!open || !workspaceId) return

    const fetchData = async () => {
      try {
        const [pipelinesRes, membersRes, contactsRes, companiesRes] = await Promise.all([
          api.get<{ pipelines: { data: any[] } }>('/pipelines'),
          api.get<{ data: any[] }>('/workspace/members'),
          api.get<{ data: any[] }>('/search/contacts'),
          api.get<{ data: any[] }>('/search/companies'),
        ])

        if (pipelinesRes.data?.pipelines?.data) setPipelines(pipelinesRes.data.pipelines.data)
        if (membersRes.data?.data) setMembers(membersRes.data.data.map(m => ({
          id: m.id,
          first_name: (m.name || '').split(' ')[0] || '',
          last_name: (m.name || '').split(' ').slice(1).join(' ') || '',
          label: m.name,
        })))
        if (contactsRes.data?.data) setContacts(contactsRes.data.data.map(c => ({
          id: c.id,
          value: c.id,
          label: `${c.first_name} ${c.last_name}`,
          email: c.email,
        })))
        if (companiesRes.data?.data) setCompanies(companiesRes.data.data.map(c => ({
          id: c.id,
          value: c.id,
          label: c.name,
        })))
      } catch (err) {
        console.error('Failed to fetch initial data:', { message: (err as Error)?.message })
      }
    }

    fetchData()
  }, [open, workspaceId])

  // Fetch stages when pipeline changes
  const fetchStages = React.useCallback((pipelineId: string) => {
    if (!pipelineId) return
    const pipeline = pipelines.find(p => p.id === pipelineId)
    if (pipeline?.stages) {
      setStages(pipeline.stages.map(s => ({ id: s.id, name: s.name, stage_order: s.display_order })))
    }
  }, [pipelines])

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema) as any,
    defaultValues: {
      title: "",
      pipeline_id: "",
      stage_id: "",
      owner_id: user?.id || "",
    }
  })

  // Set default pipeline and fetch its stages when pipelines load
  React.useEffect(() => {
    if (pipelines.length > 0 && !watch('pipeline_id')) {
      const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0]
      setValue('pipeline_id', defaultPipeline.id)
      fetchStages(defaultPipeline.id)
    }
  }, [pipelines, setValue, fetchStages, watch])

  // Watch pipeline changes to reload stages
  const selectedPipelineId = watch('pipeline_id')
  React.useEffect(() => {
    if (selectedPipelineId) {
      fetchStages(selectedPipelineId)
      setValue('stage_id', '') // Clear stage when pipeline changes
    }
  }, [selectedPipelineId, fetchStages, setValue])

  // Search contacts
  const searchContacts = React.useCallback(async (term: string) => {
    try {
      const { data } = await api.get<{ data: any[] }>('/search/contacts', { q: term })
      if (data?.data) setContacts(data.data.map((c: any) => ({
        id: c.id,
        value: c.id,
        label: `${c.first_name} ${c.last_name}`,
        email: c.email,
      })))
    } catch (err) {
      console.error('Failed to search contacts:', { message: (err as Error)?.message })
    }
  }, [])

  // Search companies
  const searchCompanies = React.useCallback(async (term: string) => {
    try {
      const { data } = await api.get<{ data: any[] }>('/search/companies', { q: term })
      if (data?.data) setCompanies(data.data.map((c: any) => ({
        id: c.id,
        value: c.id,
        label: c.name,
      })))
    } catch (err) {
      console.error('Failed to search companies:', { message: (err as Error)?.message })
    }
  }, [])

  // Search products
  const searchProducts = React.useCallback(async (term: string) => {
    try {
      const { data } = await api.get<{ data: any[] }>('/products/search', { q: term })
      if (data?.data) setProducts(data.data.map((p: any) => ({
        id: p.id,
        value: p.id,
        label: p.label,
        unit_price: p.unit_price || 0,
      })))
    } catch (err) {
      console.error('Failed to search products:', { message: (err as Error)?.message })
    }
  }, [])

  // Line items management
  const addLineItem = () => {
    setLineItems([...lineItems, {
      id: crypto.randomUUID(),
      product_id: '',
      product_name: '',
      unit_price: 0,
      quantity: 1,
    }])
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id))
  }

  const handleProductSelect = (id: string, itemId: string, extra?: Record<string, unknown>) => {
    const product = products.find(p => p.id === id)
    updateLineItem(itemId, 'product_id', id)
    updateLineItem(itemId, 'product_name', product?.label || '')
    updateLineItem(itemId, 'unit_price', product?.unit_price || 0)
  }

  const onSubmit = async (values: DealFormValues) => {
    if (Object.keys(customFieldErrors).length > 0) {
      toast.error("Please fill in all required custom fields")
      return
    }
    try {
      const selectedStage = stages.find(s => s.id === values.stage_id)

      const result = await dealsService.create({
        title: values.title,
        pipeline_id: values.pipeline_id,
        stage_id: values.stage_id,
        stage: selectedStage?.name?.toLowerCase().replace(/ /g, '_') || 'new',
        amount: values.amount ? Number(values.amount) : 0,
        close_date: values.close_date || null,
        owner_id: values.owner_id || user?.id || null,
        deal_type: (values.deal_type || null) as DealType | null,
        priority: (values.priority || null) as DealPriority | null,
        contact_id: values.contact_id === "none" ? null : values.contact_id || null,
        company_id: values.company_id === "none" ? null : values.company_id || null,
        workspace_id: workspaceId || null,
        probability: 10,
        line_items: lineItems
          .filter(item => item.product_id)
          .map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        ...(Object.keys(customValues).length > 0 ? { custom_fields: customValues } : {}),
      })

      if (result.error) {
        // Map backend 422 validation errors to form fields
        if (result.validationErrors) {
          // Map backend field names to frontend form field names
          const fieldNameMap: Record<string, string> = {
            'pipeline_stage_id': 'stage_id',
            'assigned_to': 'owner_id',
          }
          const mapped: Record<string, { type: string; message: string }> = {}
          for (const [field, messages] of Object.entries(result.validationErrors)) {
            const formField = fieldNameMap[field] || field
            mapped[formField] = {
              type: 'server',
              message: Array.isArray(messages) ? messages[0] : String(messages),
            }
          }
          for (const [field, error] of Object.entries(mapped)) {
            if (field in values) {
              setError(field as keyof DealFormValues, error)
            }
          }
        } else {
          toast.error(result.error.message || "Failed to create deal")
        }
        return
      }

      toast.success("Deal created successfully")
      onDealCreated?.()

      // Reset form
      reset()
      setLineItems([])
      setCustomValues({})
      setCustomFieldErrors({})
      // Re-set default pipeline
      if (pipelines.length > 0) {
        const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0]
        setValue('pipeline_id', defaultPipeline.id)
        fetchStages(defaultPipeline.id)
      }

      if (submitMode === 'create') {
        onOpenChange(false)
      }
    } catch (err: unknown) {
      toast.error(`Failed to create deal: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Create Deal</SheetTitle>
        </SheetHeader>
      <div className="flex flex-col h-full bg-background">
        <form id="create-deal-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 crm-scrollbar text-[13px]">

            <div className="flex justify-end -mb-2">
              <Link
                href="/deals/settings/form"
                className="text-muted-foreground hover:text-foreground font-bold flex items-center gap-1.5 no-underline hover:underline"
              >
                Edit this form
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Basic Info Section */}
            <div className="space-y-5">

              {/* Deal name */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Deal name *</label>
                <Input
                  {...register("title")}
                  className={cn("h-10 bg-background border-border focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-xs", errors.title && "border-destructive focus:ring-destructive focus:border-destructive")}
                />
                {errors.title && <p className="text-[12px] text-destructive font-medium">{errors.title.message}</p>}
              </div>

              {/* Pipeline */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Pipeline *</label>
                <Controller
                  name="pipeline_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      options={pipelines.map(p => ({ value: p.id, label: p.name }))}
                      placeholder="Select pipeline"
                    />
                  )}
                />
                {errors.pipeline_id && <p className="text-[12px] text-destructive font-medium">{errors.pipeline_id.message}</p>}
              </div>

              {/* Deal stage */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Deal stage *</label>
                <Controller
                  name="stage_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      options={stages.map(s => ({ value: s.id, label: s.name }))}
                      placeholder="Select stage"
                    />
                  )}
                />
                {errors.stage_id && <p className="text-[12px] text-destructive font-medium">{errors.stage_id.message}</p>}
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("amount", {
                    setValueAs: (v: string) => v === "" ? undefined : Number(v)
                  })}
                  className={cn("h-10 bg-background border-border focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-xs", errors.amount && "border-destructive focus:ring-destructive focus:border-destructive")}
                />
                {errors.amount && <p className="text-[12px] text-destructive font-medium">{errors.amount.message}</p>}
              </div>

              {/* Close date */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Close date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    {...register("close_date")}
                    className={cn("h-10 pl-9 bg-background border-border focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-xs", errors.close_date && "border-destructive focus:ring-destructive focus:border-destructive")}
                  />
                </div>
                {errors.close_date && <p className="text-[12px] text-destructive font-medium">{errors.close_date.message}</p>}
              </div>

              {/* Deal owner */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Deal owner</label>
                <Controller
                  name="owner_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value || ''}
                      onChange={(val) => field.onChange(val)}
                      options={members.map(m => ({ value: m.id, label: m.label }))}
                      placeholder="Select owner"
                    />
                  )}
                />
              </div>

              {/* Deal type */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Deal type</label>
                <Controller
                  name="deal_type"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full h-10 pl-3 pr-8 bg-background border border-border rounded-xs text-[13px] text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                    >
                      <option value=""></option>
                      {DEAL_TYPES.map(dt => (
                        <option key={dt.value} value={dt.value}>{dt.label}</option>
                      ))}
                    </select>
                  )}
                />
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Priority</label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full h-10 pl-3 pr-8 bg-background border border-border rounded-xs text-[13px] text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                    >
                      <option value=""></option>
                      {PRIORITY_OPTIONS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  )}
                />
              </div>
            </div>

            <div className="h-px border-border bg-background my-6" />

            {/* Associate Deal with */}
            <div className="space-y-5">
              <h3 className="font-bold text-[14px] text-foreground">Associate Deal with</h3>

              {/* Contact */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Contact</label>
                <Controller
                  name="contact_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      onSearch={searchContacts}
                      options={[{ value: 'none', label: '-- None --' }, ...contacts]}
                      placeholder="Search contacts..."
                    />
                  )}
                />
              </div>

              {/* Company */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-foreground">Company</label>
                <Controller
                  name="company_id"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      onSearch={searchCompanies}
                      options={[{ value: 'none', label: '-- None --' }, ...companies]}
                      placeholder="Search companies..."
                    />
                  )}
                />
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <label className="text-[13px] font-bold text-foreground">Add line items</label>
                {lineItems.map((item) => (
                  <div key={item.id} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <SearchableSelect
                        value={item.product_id}
                        onChange={(val, extra) => handleProductSelect(val, item.id, extra)}
                        onSearch={searchProducts}
                        options={products.map(p => ({ value: p.id, label: p.label, unit_price: p.unit_price }))}
                        placeholder="Search products..."
                        labelKey="label"
                        valueKey="value"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="h-10 text-center bg-background border-border focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-xs"
                      />
                    </div>
                    <div className="w-24 h-10 flex items-center text-[13px] text-muted-foreground">
                      ${((item.unit_price || 0) * (item.quantity || 0)).toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      className="h-10 flex items-center text-muted-foreground hover:text-destructive"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addLineItem}
                  className="text-[13px] text-muted-foreground hover:text-foreground font-bold flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                  Add line item
                </button>
              </div>
            </div>

            <div className="h-px border-border bg-background my-6" />

            {/* Custom Fields */}
            <div className="border-t border-border pt-4">
              <CustomFieldsForm
                objectType="deal"
                values={customValues}
                onChange={setCustomValue}
                onValidationChange={setCustomFieldErrors}
              />
            </div>

          </div>

          <div className="p-5 border-t border-border bg-background">
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-foreground hover:bg-foreground/90 text-primary-foreground font-bold h-9 px-5 rounded-xs"
                onClick={() => setSubmitMode('create')}
              >
                {isSubmitting && submitMode === 'create' ? "Creating..." : "Create"}
              </Button>
              <Button
                type="submit"
                variant="outline"
                disabled={isSubmitting}
                className="bg-background border-border text-foreground hover:bg-muted/50 font-bold h-9 px-5 rounded-xs"
                onClick={() => setSubmitMode('create-another')}
              >
                {isSubmitting && submitMode === 'create-another' ? "Creating..." : "Create and add another"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="bg-background border-border text-foreground hover:bg-muted/50 font-bold h-9 px-5 rounded-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
      </SheetContent>
    </Sheet>
  )
}
