"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { superAdminService, type SuperAdminUser } from "@/services/super-admin"
import { storeImpersonationToken } from "@/lib/laravel-api"
import { Users, ArrowLeft, Loader2, UserCheck } from "lucide-react"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const STATUS_BADGE: Record<SuperAdminUser["status"], { className: string }> = {
  Active: {
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  Deactivated: {
    className:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  },
}

export default function ViewUserPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [user, setUser] = React.useState<SuperAdminUser | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [impersonating, setImpersonating] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      const result = await superAdminService.getUserById(id)
      if (cancelled) return
      if (result.data) {
        setUser(result.data)
      } else {
        setNotFound(true)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !user) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => router.push("/super-admin/users")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-[15px] font-semibold text-foreground">
            User Not Found
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">
            This user does not exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  const isDeactivated = user.status === "Deactivated"

  const handleStatusToggle = async () => {
    const newStatus = isDeactivated ? "Active" : "Deactivated"
    const result = await superAdminService.updateMembershipStatus(id, user.tenant_id, newStatus)
    setConfirmOpen(false)
    if (result.error) {
      toast.error(result.error.message)
    } else {
      setUser({ ...user, status: newStatus })
      toast.success(
        newStatus === "Deactivated"
          ? `${user.name} has been deactivated`
          : `${user.name} has been reactivated`
      )
    }
  }

  const handleImpersonate = async () => {
    setImpersonating(true)
    const result = await superAdminService.startImpersonation(id, user.tenant_id)
    if (result.error) {
      toast.error(result.error.message)
      setImpersonating(false)
      return
    }
    if (result.data) {
      storeImpersonationToken(result.data.token, result.data.workspace.id)
      toast.success(`Now impersonating ${user.name}`)
      window.location.href = "/dashboard"
    }
    setImpersonating(false)
  }

  const labelClass = "text-[13px] font-bold text-foreground"
  const readOnlyClass = "h-10 bg-muted/50 border-border rounded-xs cursor-not-allowed"

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => router.push("/super-admin/users")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-[13px] font-bold text-muted-foreground shrink-0">
            {getInitials(user.name)}
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-foreground">
              {user.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              User ID: {user.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isDeactivated && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-bold"
              onClick={handleImpersonate}
              disabled={impersonating}
            >
              {impersonating ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <UserCheck className="h-3 w-3 mr-1" />
              )}
              Impersonate
            </Button>
          )}
          <Button
            variant={isDeactivated ? "default" : "destructive"}
            size="sm"
            className="h-8 px-3 text-xs font-bold"
            onClick={() => setConfirmOpen(true)}
          >
            {isDeactivated ? "Reactivate" : "Deactivate"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto crm-scrollbar">
        <div className="max-w-2xl mx-auto p-6 space-y-8">
          <section className="space-y-5">
            <h2 className="text-sm font-semibold text-foreground border-b border-border pb-2">
              User Info
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Name</label>
                <Input
                  value={user.name}
                  readOnly
                  className={readOnlyClass}
                  tabIndex={-1}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Email</label>
                <Input
                  value={user.email}
                  readOnly
                  className={readOnlyClass}
                  tabIndex={-1}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Company</label>
                <div className="h-10 flex items-center">
                  <Link
                    href={`/super-admin/tenants/${user.tenant_id}`}
                    className="text-primary hover:underline font-medium text-[14px]"
                  >
                    {user.tenant_name}
                  </Link>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Role</label>
                <Input
                  value={user.role}
                  readOnly
                  className={readOnlyClass}
                  tabIndex={-1}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Status</label>
                <div className="h-10 flex items-center">
                  <Badge variant="outline" className={STATUS_BADGE[user.status].className}>
                    {user.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Created</label>
                <Input
                  value={new Date(user.created_at).toLocaleDateString("en-US", {
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
          </section>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isDeactivated ? "Reactivate user?" : "Deactivate user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will {isDeactivated ? "reactivate" : "deactivate"} {user.name}&apos;s
              account. They will {isDeactivated ? "regain" : "lose"} access to the
              platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusToggle}
              className={
                isDeactivated
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              }
            >
              {isDeactivated ? "Reactivate" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
