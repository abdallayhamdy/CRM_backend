"use client"

import * as React from "react"
import Image from "next/image"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { productsService } from "@/services/products"
import { Product } from "@/lib/types/crm"
import { laravelApi } from "@/lib/laravel-api"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { CalendarIcon, ChevronDown, Image as ImageIcon, Upload, Link, Info, Lock, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CustomFieldsForm } from "@/components/properties/CustomFieldsForm"

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  product_description: z.string().optional(),
  product_type: z.string().optional(),
  product_image_url: z.string().optional(),
  unit_price: z.number().min(0, "Price must be non-negative"),
  unit_cost: z.number().min(0, "Cost must be non-negative").optional(),
  billing_frequency: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
  owner_id: z.string().optional(),
  status: z.enum(["Active", "Archived"]),
  product_folder: z.string().optional(),
  create_date: z.date().optional(),
})

type ProductValues = z.infer<typeof productSchema>

interface CreateProductSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const PRODUCT_TYPES = [
  "Physical Good",
  "Digital Product",
  "Service",
  "Subscription",
  "Bundle",
]

const BILLING_FREQUENCIES = [
  "One-time",
  "Monthly",
  "Quarterly",
  "Annually",
]

export function CreateProductSheet({ open, onOpenChange, onSuccess }: CreateProductSheetProps) {
  const { workspaceId } = useAuth()
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)
  const [pricingType, setPricingType] = React.useState<"flat" | "tiered">("flat")
  const [isAdditionalInfoOpen, setIsAdditionalInfoOpen] = React.useState(true)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())
  const [profiles, setProfiles] = React.useState<{ id: string; first_name: string | null; last_name: string | null }[]>([])
  const [customValues, setCustomValues] = React.useState<Record<string, any>>({})
  const [customFieldErrors, setCustomFieldErrors] = React.useState<Record<string, string>>({})

  const setCustomValue = React.useCallback((name: string, value: any) => {
    setCustomValues(prev => ({ ...prev, [name]: value }))
  }, [])

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    mode: "onChange",
    defaultValues: {
      status: "Active",
      unit_price: 0,
      unit_cost: 0,
      billing_frequency: "One-time",
    }
  })

  const unitPrice = watch("unit_price") || 0
  const unitCost = watch("unit_cost") || 0
  const margin = unitPrice - unitCost

  React.useEffect(() => {
    async function fetchProfiles() {
      try {
        const { data, error } = await laravelApi.get<{ data: { id: string; name: string; email: string }[] }>("/workspace/members")

        if (error) throw new Error(error)
        setProfiles((data?.data || []).map((m: { id: string; name: string }) => ({
          id: m.id,
          first_name: m.name,
          last_name: null,
        })))
      } catch (err) {
        console.error("Failed to fetch profiles:", { message: (err as Error)?.message })
      }
    }
    fetchProfiles()
  }, [])

  const onSubmit = async (data: ProductValues) => {
    if (Object.keys(customFieldErrors).length > 0) {
      toast.error("Please fill in all required custom fields")
      return
    }
    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        sku: data.sku || null,
        unit_price: data.unit_price,
        status: data.status,
        product_folder: data.product_folder || null,
      }
      if (Object.keys(customValues).length > 0) {
        payload.custom_fields = customValues
      }

      await productsService.create(payload as Partial<Product>)

      toast.success(`Product "${data.name}" created`)
      setImagePreview(null)
      setSelectedDate(new Date())
      setCustomValues({})
      setCustomFieldErrors({})
      reset()
      onSuccess?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create product")
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  React.useEffect(() => {
    if (!open) {
      reset()
      setImagePreview(null)
      setSelectedDate(new Date())
      setCustomValues({})
      setCustomFieldErrors({})
    }
  }, [open, reset])

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Create product</SheetTitle>
        </SheetHeader>
      <form onSubmit={handleSubmit(onSubmit)} className="gap-6 h-full flex flex-col overflow-y-auto">
        <p className="text-muted-foreground text-sm">Add a new product or service to your catalog.</p>

        {/* Section 1: Product Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Product information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground font-semibold after:content-['*'] after:ml-0.5 after:text-destructive">
                Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Enterprise Subscription"
                className="border-border focus-visible:ring-[var(--color-hs-teal)]"
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku" className="text-foreground font-semibold">
                SKU
              </Label>
              <Input
                id="sku"
                placeholder="e.g. CRM-001"
                className="border-border focus-visible:ring-[var(--color-hs-teal)]"
                {...register("sku")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_type" className="text-foreground font-semibold">
                Product Type
              </Label>
              <Controller
                name="product_type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="border-border focus:ring-[var(--color-hs-teal)]">
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-semibold">
                Product Image
              </Label>
              <div className="border-2 border-dashed border-border rounded-md p-4 text-center">
                {imagePreview ? (
                  <div className="space-y-2">
                    <Image src={imagePreview} alt="Preview" width={80} height={80} className="mx-auto h-20 w-auto object-contain" />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="text-xs text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div className="flex items-center justify-center gap-2">
                      <label htmlFor="image-upload" className="cursor-pointer text-xs font-semibold text-[var(--color-hs-teal)] hover:underline">
                        <Upload className="inline h-3 w-3 mr-1" />
                        Upload
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <span className="text-muted-foreground/50">|</span>
                      <button
                        type="button"
                        className="text-xs font-semibold text-[var(--color-hs-teal)] hover:underline"
                      >
                        <Link className="inline h-3 w-3 mr-1" />
                        Browse images
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_description" className="text-foreground font-semibold">
              Product Description
            </Label>
            <Textarea
              id="product_description"
              placeholder="Describe your product..."
              className="border-border focus-visible:ring-[var(--color-hs-teal)] min-h-[100px]"
              {...register("product_description")}
            />
          </div>
        </div>

        {/* Section 2: Additional Product Information (Collapsible) */}
        <Collapsible open={isAdditionalInfoOpen} onOpenChange={setIsAdditionalInfoOpen}>
          <div className="space-y-4">
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground">
              <ChevronRight className={cn("h-4 w-4 transition-transform", isAdditionalInfoOpen && "rotate-90")} />
              Additional product information
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground font-semibold">Owner</Label>
                  <Controller
                    name="owner_id"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="border-border focus:ring-[var(--color-hs-teal)]">
                          <SelectValue placeholder="No owner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-owner">No owner</SelectItem>
                          {profiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.first_name} {profile.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url" className="text-foreground font-semibold">
                    URL
                  </Label>
                  <Input
                    id="url"
                    placeholder="https://example.com"
                    className="border-border focus-visible:ring-[var(--color-hs-teal)]"
                    {...register("url")}
                  />
                  {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-semibold">Create Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-border",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "MM/dd/yyyy") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date)
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Section 3: Billing Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Billing details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground font-semibold">Billing Frequency</Label>
              <Controller
                name="billing_frequency"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="border-border focus:ring-[var(--color-hs-teal)]">
                      <SelectValue placeholder="Select billing frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {BILLING_FREQUENCIES.map((freq) => (
                        <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Pricing Configuration */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Pricing configuration</h3>

          <Tabs value={pricingType} onValueChange={(v) => setPricingType(v as "flat" | "tiered")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="flat">Flat rate pricing</TabsTrigger>
              <TabsTrigger value="tiered" disabled>
                <Lock className="mr-1 h-3 w-3" />
                Tiered pricing
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_price" className="text-foreground font-semibold after:content-['*'] after:ml-0.5 after:text-destructive">
                Unit Price
              </Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="border-border focus-visible:ring-[var(--color-hs-teal)]"
                {...register("unit_price", { valueAsNumber: true })}
              />
              {errors.unit_price && <p className="text-xs text-destructive">{errors.unit_price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_cost" className="text-foreground font-semibold flex items-center gap-1">
                Unit Cost
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The cost you pay for this product</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="unit_cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="border-border focus-visible:ring-[var(--color-hs-teal)]"
                {...register("unit_cost", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-semibold flex items-center gap-1">
              Margin
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Auto-calculated: Unit Price - Unit Cost</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <div className="border border-border rounded-md px-3 py-2 text-sm bg-[color:var(--color-zinc-50)]">
              ${margin.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Status and Folder (existing fields) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="border-border focus:ring-[var(--color-hs-teal)]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Folder</Label>
            <Controller
              name="product_folder"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="border-border focus:ring-[var(--color-hs-teal)]">
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Hardware">Hardware</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <CustomFieldsForm
            objectType="product"
            values={customValues}
            onChange={setCustomValue}
            onValidationChange={setCustomFieldErrors}
          />
        </div>

        <div className="mt-auto pt-6 border-t border-[var(--color-hs-border)] flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="bg-[var(--color-hs-teal)] hover:bg-[var(--color-hs-teal-hover)] text-[var(--color-hs-card-bg)] border-0 shadow-sm"
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </div>
      </form>
      </SheetContent>
    </Sheet>
  )
}
