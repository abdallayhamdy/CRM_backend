"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
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
import { superAdminService, type Tenant } from "@/services/super-admin"
import { Building2, ArrowLeft, Loader2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function buildSchema(currentUserCount: number) {
  return z
    .object({
      company_name: z.string().min(1, "Company name is required").max(255),
      admin_full_name: z.string().min(1, "Admin name is required").max(255),
      admin_email: z.string().min(1, "Admin email is required").email("Enter a valid email"),
      admin_phone: z.string().optional(),
      plan: z.enum(["starter", "pro", "enterprise"]),
      user_limit: z
        .number()
        .min(currentUserCount, `User limit cannot be lower than the current number of users (${currentUserCount})`)
        .max(1000, "Maximum limit is 1000"),
      status: z.enum(["active", "trial", "suspended", "churned"]),
      trial_end_date: z.string().optional(),
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
}

type EditTenantValues = z.infer<ReturnType<typeof buildSchema>>

export default function ViewEditTenantPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [tenant, setTenant] = React.useState<Tenant | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      const result = await superAdminService.getTenantById(id)
      if (cancelled) return
      if (result.data) {
        setTenant(result.data)
      } else {
        setNotFound(true)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id])

  const schema = React.useMemo(
    () => buildSchema(tenant?.current_user_count ?? 0),
    [tenant?.current_user_count]
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditTenantValues>({
    resolver: zodResolver(schema),
    defaultValues: tenant
      ? {
          company_name: tenant.company_name,
          admin_full_name: tenant.admin_full_name,
          admin_email: tenant.admin_email,
          admin_phone: tenant.admin_phone || "",
          plan: tenant.plan,
          user_limit: tenant.user_limit,
          status: tenant.status,
          trial_end_date: tenant.trial_end_date || "",
        }
      : undefined,
  })

  React.useEffect(() => {
    if (tenant) {
      reset({
        company_name: tenant.company_name,
        admin_full_name: tenant.admin_full_name,
        admin_email: tenant.admin_email,
        admin_phone: tenant.admin_phone || "",
        plan: tenant.plan,
        user_limit: tenant.user_limit,
        status: tenant.status,
        trial_end_date: tenant.trial_end_date || "",
      })
    }
  }, [tenant, reset])

  const watchedStatus = watch("status")

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !tenant) {
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
          <h1 className="text-[15px] font-semibold text-foreground">
            Tenant Not Found
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">
            This tenant does not exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  const onSubmit = async (values: EditTenantValues) => {
    setIsSaving(true)
    try {
      const result = await superAdminService.updateTenant(id, {
        company_name: values.company_name,
        admin_full_name: values.admin_full_name,
        admin_email: values.admin_email,
        admin_phone: values.admin_phone,
        plan: values.plan,
        user_limit: values.user_limit,
        status: values.status,
        trial_end_date: values.status === "trial" ? values.trial_end_date : undefined,
      })
      if (result.error) {
        toast.error(result.error.message)
      } else {
        toast.success("Tenant updated successfully")
        if (result.data) setTenant(result.data)
        reset(values)
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await superAdminService.deleteTenant(id)
      if (result.error) {
        toast.error(result.error.message)
      } else {
        toast.success("Tenant deleted successfully")
        router.push("/super-admin/tenants")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsDeleting(false)
    }
  }

  const inputClass = cn(
    "h-10 bg-background border-border focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-xs"
  )

  const labelClass = "text-[13px] font-bold text-foreground"
  const errorClass = "text-[12px] text-destructive font-medium mt-1"
  const helperClass = "text-[12px] text-muted-foreground mt-1"
  const readOnlyClass = "h-10 bg-muted/50 border-border rounded-xs cursor-not-allowed"

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
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
              {tenant.company_name}
            </h1>
            <p className="text-xs text-muted-foreground">
              Tenant ID: {tenant.id}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto crm-scrollbar">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-2xl mx-auto p-6 space-y-8"
        >
          <section className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
              Company &amp; Admin Info
              <span className="ml-2 text-[11px] font-normal text-primary">
                (editable)
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>
                  Company name <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("company_name")}
                  className={cn(inputClass, errors.company_name && "border-destructive focus:ring-destructive focus:border-destructive")}
                />
                {errors.company_name && (
                  <p className={errorClass}>{errors.company_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Created</label>
                <Input
                  value={new Date(tenant.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  readOnly
                  className={readOnlyClass}
                  tabIndex={-1}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>
                  Admin full name <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("admin_full_name")}
                  className={cn(inputClass, errors.admin_full_name && "border-destructive focus:ring-destructive focus:border-destructive")}
                />
                {errors.admin_full_name && (
                  <p className={errorClass}>{errors.admin_full_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>
                  Admin email <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  {...register("admin_email")}
                  className={cn(inputClass, errors.admin_email && "border-destructive focus:ring-destructive focus:border-destructive")}
                />
                {errors.admin_email && (
                  <p className={errorClass}>{errors.admin_email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Admin phone</label>
                <Input
                  {...register("admin_phone")}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Current users</label>
                <Input
                  value={`${tenant.current_user_count} users currently active`}
                  readOnly
                  className={readOnlyClass}
                  tabIndex={-1}
                />
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
              Plan &amp; Settings
              <span className="ml-2 text-[11px] font-normal text-primary">
                (editable)
              </span>
            </h2>

            <div className="space-y-1.5">
              <label className={labelClass}>
                Status <span className="text-destructive">*</span>
              </label>
              <Select
                value={watch("status")}
                onValueChange={(v) => {
                  setValue("status", v as Tenant["status"], { shouldDirty: true })
                  if (v !== "trial") {
                    setValue("trial_end_date", "", { shouldDirty: true })
                  }
                }}
              >
                <SelectTrigger className={cn("w-full h-10", errors.status && "border-destructive")}>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="churned">Churned</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className={errorClass}>{errors.status.message}</p>
              )}
            </div>

            {watchedStatus === "trial" && (
              <div className="space-y-1.5">
                <label className={labelClass}>
                  Trial end date <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  {...register("trial_end_date")}
                  className={cn(inputClass, errors.trial_end_date && "border-destructive focus:ring-destructive focus:border-destructive")}
                />
                {errors.trial_end_date && (
                  <p className={errorClass}>{errors.trial_end_date.message}</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className={labelClass}>
                Plan <span className="text-destructive">*</span>
              </label>
              <Select
                value={watch("plan")}
                onValueChange={(v) => setValue("plan", v as EditTenantValues["plan"], { shouldDirty: true })}
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
              {errors.plan && (
                <p className={errorClass}>{errors.plan.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>
                User limit <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={tenant.current_user_count}
                max={1000}
                {...register("user_limit", { valueAsNumber: true })}
                className={cn(inputClass, errors.user_limit && "border-destructive focus:ring-destructive focus:border-destructive")}
              />
              {tenant.current_user_count > 0 && (
                <p className={helperClass}>
                  Cannot be lower than the current number of users ({tenant.current_user_count})
                </p>
              )}
              {errors.user_limit && (
                <p className={errorClass}>{errors.user_limit.message}</p>
              )}
            </div>
          </section>

          <div className="flex items-center gap-3 pb-6">
            <Button
              type="submit"
              disabled={isSaving || !isDirty}
              className="h-9 px-6 font-bold"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/super-admin/tenants")}
              className="h-9 px-6 font-bold"
            >
              Cancel
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  className="h-9 px-4 font-bold ml-auto"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? "Deleting..." : "Delete tenant"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete tenant?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {tenant.company_name}, all of its
                    users and their data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={(e) => {
                      e.preventDefault()
                      handleDelete()
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </div>
    </div>
  )
}
