"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { superAdminService } from "@/services/super-admin"
import { Building2, ArrowLeft, Upload, MailCheck } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Reference data ──────────────────────────────────────────────────

const CURRENCIES = [
  { name: "US Dollar (USD)", code: "USD", symbol: "$" },
  { name: "Euro (EUR)", code: "EUR", symbol: "€" },
  { name: "British Pound (GBP)", code: "GBP", symbol: "£" },
  { name: "Australian Dollar (AUD)", code: "AUD", symbol: "AU$" },
  { name: "Canadian Dollar (CAD)", code: "CAD", symbol: "$" },
  { name: "Japanese Yen (JPY)", code: "JPY", symbol: "¥" },
  { name: "Chinese Yuan (CNY)", code: "CNY", symbol: "CN¥" },
  { name: "Indian Rupee (INR)", code: "INR", symbol: "₹" },
  { name: "UAE Dirham (AED)", code: "AED", symbol: "د.إ" },
  { name: "Egyptian Pound (EGP)", code: "EGP", symbol: "E£" },
  { name: "Saudi Riyal (SAR)", code: "SAR", symbol: "﷼" },
  { name: "Kuwaiti Dinar (KWD)", code: "KWD", symbol: "د.ك" },
]

const TIMEZONES = [
  "UTC -12:00 International Date Line West",
  "UTC -11:00 Coordinated Universal Time -11",
  "UTC -10:00 Hawaii",
  "UTC -09:00 Alaska",
  "UTC -08:00 Pacific Standard Time",
  "UTC -07:00 Mountain Standard Time",
  "UTC -06:00 Central Standard Time",
  "UTC -05:00 Eastern Standard Time",
  "UTC -04:00 Atlantic Standard Time",
  "UTC -03:00 Argentina Standard Time",
  "UTC -02:00 Coordinated Universal Time -02",
  "UTC -01:00 Azores Standard Time",
  "UTC +00:00 Greenwich Mean Time",
  "UTC +01:00 Central European Time",
  "UTC +02:00 Eastern European Time",
  "UTC +03:00 Moscow Standard Time",
  "UTC +04:00 Gulf Standard Time",
  "UTC +05:00 Pakistan Standard Time",
  "UTC +05:30 India Standard Time",
  "UTC +06:00 Bangladesh Standard Time",
  "UTC +07:00 Indochina Time",
  "UTC +08:00 China Standard Time",
  "UTC +09:00 Japan Standard Time",
  "UTC +10:00 Australian Eastern Standard Time",
  "UTC +11:00 Solomon Islands Time",
  "UTC +12:00 New Zealand Standard Time",
  "UTC +13:00 Samoa Standard Time",
]

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "العربية (Arabic)" },
  { value: "fr", label: "Français (French)" },
  { value: "es", label: "Español (Spanish)" },
  { value: "de", label: "Deutsch (German)" },
]

const DATE_FORMATS = [
  { value: "us", label: "MM/DD/YYYY", example: "07/31/2026" },
  { value: "eu", label: "DD/MM/YYYY", example: "31/07/2026" },
  { value: "iso", label: "YYYY-MM-DD", example: "2026-07-31" },
]

const INDUSTRIES = [
  { value: "technology", label: "Technology" },
  { value: "real_estate", label: "Real Estate" },
  { value: "finance", label: "Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "services", label: "Professional Services" },
  { value: "other", label: "Other" },
]

const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia", "New Zealand",
  "United Arab Emirates", "Saudi Arabia", "Kuwait", "Qatar", "Bahrain", "Oman",
  "Egypt", "Jordan", "Lebanon", "Morocco", "Tunisia", "Algeria",
  "Germany", "France", "Spain", "Italy", "Netherlands", "Belgium", "Switzerland", "Austria",
  "Sweden", "Norway", "Denmark", "Finland", "Ireland", "Poland",
  "India", "China", "Japan", "South Korea", "Singapore", "Malaysia", "Indonesia", "Philippines",
  "Brazil", "Mexico", "Argentina", "Chile", "Colombia", "South Africa", "Turkey",
]

const FISCAL_MONTHS = [
  { value: "jan-dec", label: "January - December", start: "jan" },
  { value: "feb-jan", label: "February - January", start: "feb" },
  { value: "mar-feb", label: "March - February", start: "mar" },
  { value: "apr-mar", label: "April - March", start: "apr" },
  { value: "may-apr", label: "May - April", start: "may" },
  { value: "jun-may", label: "June - May", start: "jun" },
  { value: "jul-jun", label: "July - June", start: "jul" },
  { value: "aug-jul", label: "August - July", start: "aug" },
  { value: "sep-aug", label: "September - August", start: "sep" },
  { value: "oct-sep", label: "October - September", start: "oct" },
  { value: "nov-oct", label: "November - October", start: "nov" },
  { value: "dec-nov", label: "December - November", start: "dec" },
]

const PLANS: Record<string, { label: string; description: string }> = {
  starter: { label: "Starter", description: "$49/mo — Essential CRM for small teams" },
  pro: { label: "Pro", description: "$149/mo — Advanced pipelines, automation & reporting" },
  enterprise: { label: "Enterprise", description: "$399/mo — Full platform with SSO & priority support" },
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  trial: "Trial",
}

const BILLING_CYCLE_LABELS: Record<string, string> = {
  monthly: "Monthly",
  annual: "Annual (save ~20%)",
}

// ── Styling tokens ──────────────────────────────────────────────────

const labelClass = "text-[13px] font-bold text-foreground"
const errorClass = "text-[12px] text-destructive font-medium mt-1"
const helperClass = "text-[12px] text-muted-foreground mt-1"
const inputClass =
  "h-10 bg-background border-border focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-xs"
const errorInputClass =
  "border-destructive focus:ring-destructive focus:border-destructive"

function Field({
  label,
  required,
  error,
  helper,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  helper?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className={labelClass}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      {children}
      {helper && <p className={helperClass}>{helper}</p>}
      {error && <p className={errorClass}>{error}</p>}
    </div>
  )
}

// ── Schema ──────────────────────────────────────────────────────────

const today = new Date()
today.setHours(0, 0, 0, 0)

const tenantFormSchema = z
  .object({
    company_name: z.string().min(1, "Company name is required"),
    company_domain: z.string().optional(),
    industry: z.string().min(1, "Industry is required"),
    company_address: z.string().optional(),
    company_address2: z.string().optional(),
    company_city: z.string().optional(),
    company_state: z.string().optional(),
    company_zip: z.string().optional(),
    company_country: z.string().min(1, "Country is required"),

    workspace_name: z.string().min(1, "Workspace name is required"),
    slug: z
      .string()
      .min(1, "Workspace slug is required")
      .max(63, "Slug must be 63 characters or fewer")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use only lowercase letters, numbers and single hyphens"
      ),
    fiscal_year_start: z.string().optional(),

    timezone: z.string().min(1, "Timezone is required"),
    currency: z.string().min(1, "Currency is required"),
    default_language: z.string().min(1, "Language is required"),
    default_date_format: z.string().min(1, "Date format is required"),

    admin_full_name: z.string().min(1, "Admin full name is required"),
    admin_email: z
      .string()
      .min(1, "Admin email is required")
      .email("Please enter a valid email address"),
    admin_phone: z.string().optional(),
    admin_job_title: z.string().optional(),

    plan: z.enum(["starter", "pro", "enterprise"]),
    billing_cycle: z.enum(["monthly", "annual"]),
    user_limit: z
      .number()
      .min(1, "Must be at least 1")
      .max(1000, "Maximum limit is 1000"),
    status: z.enum(["active", "trial"]),
    trial_end_date: z.string().optional(),
    subscription_start_date: z.string().optional(),

    billing_email: z
      .string()
      .min(1, "Billing email is required")
      .email("Please enter a valid email address"),
    billing_phone: z.string().optional(),
    tax_id: z.string().optional(),
    billing_address: z.string().optional(),
    billing_city: z.string().optional(),
    billing_state: z.string().optional(),
    billing_zip: z.string().optional(),
    billing_country: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "trial") {
        return !!data.trial_end_date && data.trial_end_date.length > 0
      }
      return true
    },
    {
      message: "Trial end date is required when status is Trial",
      path: ["trial_end_date"],
    }
  )
  .refine(
    (data) => !data.trial_end_date || new Date(data.trial_end_date) >= today,
    {
      message: "Trial end date must be today or in the future",
      path: ["trial_end_date"],
    }
  )

type TenantFormValues = z.infer<typeof tenantFormSchema>

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function CreateTenantPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [logoFile, setLogoFile] = React.useState<File | null>(null)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const logoInputRef = React.useRef<HTMLInputElement>(null)

  const workspaceNameTouched = React.useRef(false)
  const slugTouched = React.useRef(false)
  const billingEmailTouched = React.useRef(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      company_name: "",
      company_domain: "",
      industry: "technology",
      company_address: "",
      company_address2: "",
      company_city: "",
      company_state: "",
      company_zip: "",
      company_country: "",
      workspace_name: "",
      slug: "",
      fiscal_year_start: "jan-dec",
      timezone: "UTC +00:00 Greenwich Mean Time",
      currency: "USD",
      default_language: "en",
      default_date_format: "us",
      admin_full_name: "",
      admin_email: "",
      admin_phone: "",
      admin_job_title: "",
      plan: "pro",
      billing_cycle: "monthly",
      user_limit: 10,
      status: "active",
      trial_end_date: "",
      subscription_start_date: new Date().toISOString().slice(0, 10),
      billing_email: "",
      billing_phone: "",
      tax_id: "",
      billing_address: "",
      billing_city: "",
      billing_state: "",
      billing_zip: "",
      billing_country: "",
    },
  })

  const watchedStatus = watch("status")
  const watchedValues = watch()

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValue("company_name", v, { shouldValidate: true })
    if (!workspaceNameTouched.current) setValue("workspace_name", v)
    if (!slugTouched.current) setValue("slug", slugify(v))
  }

  const handleWorkspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    workspaceNameTouched.current = true
    const v = e.target.value
    setValue("workspace_name", v, { shouldValidate: true })
    if (!slugTouched.current) setValue("slug", slugify(v))
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    slugTouched.current = true
    setValue("slug", slugify(e.target.value), { shouldValidate: true })
  }

  const handleAdminEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValue("admin_email", v, { shouldValidate: true })
    if (!billingEmailTouched.current) setValue("billing_email", v)
  }

  const handleBillingEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    billingEmailTouched.current = true
    setValue("billing_email", e.target.value, { shouldValidate: true })
  }

  const handleSameAsCompany = (checked: boolean) => {
    if (checked) {
      const g = getValues()
      setValue("billing_address", g.company_address || "")
      setValue("billing_city", g.company_city || "")
      setValue("billing_state", g.company_state || "")
      setValue("billing_zip", g.company_zip || "")
      setValue("billing_country", g.company_country || "")
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be smaller than 2MB")
      e.target.value = ""
      return
    }
    if (!/^image\/(png|jpe?g|svg\+xml|webp)$/.test(file.type)) {
      toast.error("Only PNG, JPG, SVG or WebP images are allowed")
      e.target.value = ""
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (values: TenantFormValues) => {
    setIsSubmitting(true)
    try {
      const result = await superAdminService.createTenant({
        company_name: values.company_name,
        name: values.workspace_name,
        slug: values.slug,
        industry: values.industry,
        company_domain: values.company_domain || undefined,
        company_address: values.company_address || undefined,
        company_address2: values.company_address2 || undefined,
        company_city: values.company_city || undefined,
        company_state: values.company_state || undefined,
        company_zip: values.company_zip || undefined,
        company_country: values.company_country,
        timezone: values.timezone,
        currency: values.currency,
        default_language: values.default_language,
        default_date_format: values.default_date_format,
        fiscal_year_start:
          FISCAL_MONTHS.find((m) => m.value === values.fiscal_year_start)?.start ?? "jan",
        admin_full_name: values.admin_full_name,
        admin_email: values.admin_email,
        admin_phone: values.admin_phone || undefined,
        admin_job_title: values.admin_job_title || undefined,
        plan: values.plan,
        billing_cycle: values.billing_cycle,
        user_limit: values.user_limit,
        status: values.status,
        trial_end_date:
          values.status === "trial" ? values.trial_end_date : undefined,
        subscription_start_date: values.subscription_start_date || undefined,
        billing_email: values.billing_email,
        billing_phone: values.billing_phone || undefined,
        tax_id: values.tax_id || undefined,
        billing_address: values.billing_address || undefined,
        billing_city: values.billing_city || undefined,
        billing_state: values.billing_state || undefined,
        billing_zip: values.billing_zip || undefined,
        billing_country: values.billing_country || undefined,
        logo: logoFile,
      })
      if (result.error) {
        toast.error(result.error.message)
      } else {
        toast.success("Client account created successfully")
        router.push("/super-admin/tenants")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const slugPreview = watchedValues.slug ? `${watchedValues.slug}.crm.leadswift.app` : ""

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => router.push("/super-admin/tenants")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-[15px] font-semibold text-foreground">
            Create Client Account
          </h1>
          <p className="text-xs text-muted-foreground">
            Onboard a new organization — the admin receives an invitation email to complete setup
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto crm-scrollbar">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-3xl mx-auto p-6 space-y-8"
        >
          {/* ── Company Information ── */}
          <section className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Company Information
              </h2>
              <p className="text-[12px] text-muted-foreground mt-2">
                Legal details of the client organization. Used for contracts, invoices and defaults.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Company name" required error={errors.company_name?.message}>
                <Input
                  {...register("company_name")}
                  onChange={handleCompanyNameChange}
                  placeholder="e.g. Acme Corp"
                  className={cn(inputClass, errors.company_name && errorInputClass)}
                />
              </Field>

              <Field
                label="Website / Domain"
                helper="e.g. acme.com — used for branded emails and defaults"
              >
                <Input
                  {...register("company_domain")}
                  placeholder="e.g. acme.com"
                  className={inputClass}
                />
              </Field>

              <Field label="Industry" required error={errors.industry?.message}>
                <Select
                  value={watch("industry")}
                  onValueChange={(v) => setValue("industry", v, { shouldValidate: true })}
                >
                  <SelectTrigger className={cn("w-full h-10", errors.industry && "border-destructive")}>
                    <SelectValue placeholder="Choose an industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind.value} value={ind.value}>
                        {ind.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Company logo"
                helper="PNG, JPG, SVG or WebP · max 2MB · recommended 256×256px"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 border border-border rounded-lg shrink-0">
                    <AvatarImage src={logoPreview || undefined} />
                    <AvatarFallback className="bg-muted/50 rounded-lg">
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 border-border text-foreground font-semibold hover:bg-accent"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {logoFile ? "Change logo" : "Upload logo"}
                    </Button>
                    {logoFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null)
                          setLogoPreview(null)
                          if (logoInputRef.current) logoInputRef.current.value = ""
                        }}
                        className="block text-[12px] text-destructive font-medium hover:underline"
                      >
                        Remove logo
                      </button>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </div>
                </div>
              </Field>

              <Field label="Street address">
                <Input
                  {...register("company_address")}
                  placeholder="e.g. 100 Market Street"
                  className={inputClass}
                />
              </Field>

              <Field label="Address line 2">
                <Input
                  {...register("company_address2")}
                  placeholder="Apt, suite, unit, etc."
                  className={inputClass}
                />
              </Field>

              <Field label="City">
                <Input
                  {...register("company_city")}
                  placeholder="e.g. Dubai"
                  className={inputClass}
                />
              </Field>

              <Field label="State / Province">
                <Input
                  {...register("company_state")}
                  placeholder="e.g. California"
                  className={inputClass}
                />
              </Field>

              <Field label="ZIP / Postal code">
                <Input
                  {...register("company_zip")}
                  placeholder="e.g. 90210"
                  className={inputClass}
                />
              </Field>

              <Field label="Country / Region" required error={errors.company_country?.message}>
                <Select
                  value={watch("company_country")}
                  onValueChange={(v) => setValue("company_country", v, { shouldValidate: true })}
                >
                  <SelectTrigger className={cn("w-full h-10", errors.company_country && "border-destructive")}>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          {/* ── Workspace Configuration ── */}
          <section className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Workspace Configuration
              </h2>
              <p className="text-[12px] text-muted-foreground mt-2">
                Defines the tenant&apos;s unique subdomain and financial reporting period.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Workspace name"
                required
                error={errors.workspace_name?.message}
                helper="Usually matches the company name"
              >
                <Input
                  {...register("workspace_name")}
                  onChange={handleWorkspaceNameChange}
                  placeholder="e.g. Acme Corp Workspace"
                  className={cn(inputClass, errors.workspace_name && errorInputClass)}
                />
              </Field>

              <Field
                label="Workspace slug / subdomain"
                required
                error={errors.slug?.message}
                helper={
                  slugPreview
                    ? `Login URL preview: ${slugPreview}`
                    : "Lowercase letters, numbers and hyphens"
                }
              >
                <Input
                  {...register("slug")}
                  onChange={handleSlugChange}
                  placeholder="e.g. acme-corp"
                  className={cn("font-mono", inputClass, errors.slug && errorInputClass)}
                />
              </Field>

              <Field
                label="Fiscal year start"
                helper="Start month of the client&apos;s financial reporting period"
              >
                <Select
                  value={watch("fiscal_year_start")}
                  onValueChange={(v) => setValue("fiscal_year_start", v, { shouldValidate: true })}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select fiscal year" />
                  </SelectTrigger>
                  <SelectContent>
                    {FISCAL_MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          {/* ── Localization ── */}
          <section className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Localization
              </h2>
              <p className="text-[12px] text-muted-foreground mt-2">
                Regional defaults applied across the client&apos;s CRM — records, reports and notifications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Timezone" required error={errors.timezone?.message}>
                <Select
                  value={watch("timezone")}
                  onValueChange={(v) => setValue("timezone", v, { shouldValidate: true })}
                >
                  <SelectTrigger className={cn("w-full h-10", errors.timezone && "border-destructive")}>
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Currency"
                required
                error={errors.currency?.message}
                helper="Base currency for deal values and financial reporting"
              >
                <Select
                  value={watch("currency")}
                  onValueChange={(v) => setValue("currency", v, { shouldValidate: true })}
                >
                  <SelectTrigger className={cn("w-full h-10", errors.currency && "border-destructive")}>
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name} ({c.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Language" required error={errors.default_language?.message}>
                <Select
                  value={watch("default_language")}
                  onValueChange={(v) => setValue("default_language", v, { shouldValidate: true })}
                >
                  <SelectTrigger className={cn("w-full h-10", errors.default_language && "border-destructive")}>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Date format"
                required
                error={errors.default_date_format?.message}
                helper={
                  DATE_FORMATS.find((d) => d.value === watchedValues.default_date_format)
                    ?.example
                }
              >
                <Select
                  value={watch("default_date_format")}
                  onValueChange={(v) => setValue("default_date_format", v, { shouldValidate: true })}
                >
                  <SelectTrigger className={cn("w-full h-10", errors.default_date_format && "border-destructive")}>
                    <SelectValue placeholder="Select a date format" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FORMATS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          {/* ── Admin User ── */}
          <section className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Admin User
              </h2>
              <p className="text-[12px] text-muted-foreground mt-2">
                The account owner provisioned for this client. They set their own password via a secure invite.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <MailCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                An <span className="font-bold text-foreground">invitation email</span> is sent to the admin
                with a secure link to set their password and activate the account. No password is created
                or stored at provisioning time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Admin full name" required error={errors.admin_full_name?.message}>
                <Input
                  {...register("admin_full_name")}
                  placeholder="e.g. Jane Smith"
                  className={cn(inputClass, errors.admin_full_name && errorInputClass)}
                />
              </Field>

              <Field
                label="Admin job title"
                helper="e.g. CEO, Sales Director, IT Manager"
              >
                <Input
                  {...register("admin_job_title")}
                  placeholder="e.g. Sales Director"
                  className={inputClass}
                />
              </Field>

              <Field label="Admin email" required error={errors.admin_email?.message}>
                <Input
                  {...register("admin_email")}
                  type="email"
                  onChange={handleAdminEmailChange}
                  placeholder="e.g. admin@acme.com"
                  className={cn(inputClass, errors.admin_email && errorInputClass)}
                />
              </Field>

              <Field label="Admin phone">
                <Input
                  {...register("admin_phone")}
                  placeholder="e.g. +1-555-0123"
                  className={inputClass}
                />
              </Field>
            </div>
          </section>

          {/* ── Subscription ── */}
          <section className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Subscription
              </h2>
              <p className="text-[12px] text-muted-foreground mt-2">
                Plan, seat allowance and billing/activation status for the new tenant.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Plan"
                required
                error={errors.plan?.message}
                helper={PLANS[watchedValues.plan]?.description}
              >
                <Select
                  value={watch("plan")}
                  onValueChange={(v) => setValue("plan", v as TenantFormValues["plan"], { shouldValidate: true })}
                >
                  <SelectTrigger className={cn("w-full h-10", errors.plan && "border-destructive")}>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Billing cycle"
                required
                error={errors.billing_cycle?.message}
                helper="Annual billing grants ~2 months free per year"
              >
                <Select
                  value={watch("billing_cycle")}
                  onValueChange={(v) => setValue("billing_cycle", v as TenantFormValues["billing_cycle"], { shouldValidate: true })}
                >
                  <SelectTrigger className={cn("w-full h-10", errors.billing_cycle && "border-destructive")}>
                    <SelectValue placeholder="Select a billing cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual (save ~20%)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="User limit"
                required
                error={errors.user_limit?.message}
                helper="Maximum number of team members this client can invite"
              >
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  {...register("user_limit", { valueAsNumber: true })}
                  className={cn(inputClass, errors.user_limit && errorInputClass)}
                />
              </Field>

              <Field
                label="Subscription start date"
                helper="Defaults to today"
              >
                <Input
                  type="date"
                  {...register("subscription_start_date")}
                  className={inputClass}
                />
              </Field>

              <Field label="Status" required error={errors.status?.message}>
                <Select
                  value={watch("status")}
                  onValueChange={(v) => {
                    setValue("status", v as TenantFormValues["status"], { shouldValidate: true })
                    if (v === "active") {
                      setValue("trial_end_date", "")
                    }
                  }}
                >
                  <SelectTrigger className={cn("w-full h-10", errors.status && "border-destructive")}>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {watchedStatus === "trial" && (
                <Field
                  label="Trial end date"
                  required
                  error={errors.trial_end_date?.message}
                  helper="When the trial expires the workspace is suspended unless converted"
                >
                  <Input
                    type="date"
                    {...register("trial_end_date")}
                    className={cn(inputClass, errors.trial_end_date && errorInputClass)}
                  />
                </Field>
              )}
            </div>
          </section>

          {/* ── Billing ── */}
          <section className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Billing
              </h2>
              <p className="text-[12px] text-muted-foreground mt-2">
                Invoice recipient and billing details. Defaults to the admin email when left blank.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-[13px] font-bold text-foreground">Billing address same as company</p>
                <p className="text-[12px] text-muted-foreground">
                  Copy the company address into the billing fields below
                </p>
              </div>
              <Switch onCheckedChange={handleSameAsCompany} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Billing email" required error={errors.billing_email?.message}>
                <Input
                  {...register("billing_email")}
                  type="email"
                  onChange={handleBillingEmailChange}
                  placeholder="e.g. invoices@acme.com"
                  className={cn(inputClass, errors.billing_email && errorInputClass)}
                />
              </Field>

              <Field label="Billing phone">
                <Input
                  {...register("billing_phone")}
                  placeholder="e.g. +1-555-0199"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Tax / VAT ID"
                helper="Tax registration number used on invoices"
              >
                <Input
                  {...register("tax_id")}
                  placeholder="e.g. 123456789"
                  className={inputClass}
                />
              </Field>

              <Field label="Billing street address">
                <Input
                  {...register("billing_address")}
                  placeholder="e.g. 200 Billing Lane"
                  className={inputClass}
                />
              </Field>

              <Field label="Billing city">
                <Input
                  {...register("billing_city")}
                  placeholder="e.g. London"
                  className={inputClass}
                />
              </Field>

              <Field label="Billing state / province">
                <Input
                  {...register("billing_state")}
                  placeholder="e.g. England"
                  className={inputClass}
                />
              </Field>

              <Field label="Billing ZIP / postal code">
                <Input
                  {...register("billing_zip")}
                  placeholder="e.g. SW1A 1AA"
                  className={inputClass}
                />
              </Field>

              <Field label="Billing country / region">
                <Select
                  value={watch("billing_country")}
                  onValueChange={(v) => setValue("billing_country", v, { shouldValidate: true })}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          {/* ── Summary ── */}
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                Summary
              </h2>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company</span>
                <span className="font-medium text-foreground">
                  {watchedValues.company_name || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Workspace URL</span>
                <span className="font-medium text-foreground font-mono">
                  {slugPreview || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium text-foreground">
                  {PLANS[watchedValues.plan]?.label || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billing cycle</span>
                <span className="font-medium text-foreground">
                  {BILLING_CYCLE_LABELS[watchedValues.billing_cycle] || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User limit</span>
                <span className="font-medium text-foreground">
                  {watchedValues.user_limit || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-foreground">
                  {STATUS_LABELS[watchedValues.status] || "—"}
                </span>
              </div>
              {watchedValues.status === "trial" && watchedValues.trial_end_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trial ends</span>
                  <span className="font-medium text-foreground">
                    {new Date(watchedValues.trial_end_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium text-foreground">
                  {watchedValues.currency || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timezone</span>
                <span className="font-medium text-foreground">
                  {watchedValues.timezone || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Admin</span>
                <span className="font-medium text-foreground">
                  {watchedValues.admin_email || "—"}
                </span>
              </div>
            </div>
          </section>

          <div className="flex items-center gap-3 pb-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-6 font-bold"
            >
              {isSubmitting ? "Creating..." : "Create Client Account"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/super-admin/tenants")}
              className="h-9 px-6 font-bold"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
