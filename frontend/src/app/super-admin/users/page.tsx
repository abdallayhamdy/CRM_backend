"use client"

import * as React from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { DataTable } from "@/components/shared/DataTable"
import { superAdminService, type SuperAdminUser, type Tenant } from "@/services/super-admin"
import { Users, Loader2 } from "lucide-react"

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

function ActionsCell({
  user,
  onStatusChanged,
}: {
  user: SuperAdminUser
  onStatusChanged: () => void
}) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const isDeactivated = user.status === "Deactivated"

  const handleConfirm = async () => {
    const newStatus = isDeactivated ? "Active" : "Deactivated"
    const result = await superAdminService.updateMembershipStatus(user.id, user.tenant_id, newStatus)
    setConfirmOpen(false)
    if (result.error) {
      toast.error(result.error.message)
    } else {
      onStatusChanged()
      toast.success(
        newStatus === "Deactivated"
          ? `${user.name} has been deactivated`
          : `${user.name} has been reactivated`
      )
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={`/super-admin/users/${user.id}`}>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          View
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 px-2 text-xs ${
          isDeactivated
            ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            : "text-red-600 hover:text-red-700 hover:bg-red-50"
        }`}
        onClick={() => setConfirmOpen(true)}
      >
        {isDeactivated ? "Reactivate" : "Deactivate"}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isDeactivated ? "Reactivate user?" : "Deactivate user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will {isDeactivated ? "reactivate" : "deactivate"}{" "}
              {user.name}&apos;s account. They will{" "}
              {isDeactivated ? "regain" : "lose"} access to the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
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

export default function UsersPage() {
  const [allUsers, setAllUsers] = React.useState<SuperAdminUser[]>([])
  const [tenants, setTenants] = React.useState<Tenant[]>([])
  const [loading, setLoading] = React.useState(true)

  const [companyFilter, setCompanyFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [roleFilter, setRoleFilter] = React.useState<string>("all")
  const [refreshKey, setRefreshKey] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      const [usersResult, tenantsResult] = await Promise.all([
        superAdminService.getUsers({ limit: 200 }),
        superAdminService.getTenants({ limit: 200 }),
      ])
      if (cancelled) return
      if (!usersResult.error) setAllUsers(usersResult.data)
      if (!tenantsResult.error) setTenants(tenantsResult.data)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [refreshKey])

  const filteredUsers = React.useMemo(() => {
    return allUsers.filter((u) => {
      if (companyFilter !== "all" && u.tenant_id !== companyFilter) return false
      if (statusFilter !== "all" && u.status !== statusFilter) return false
      if (roleFilter !== "all" && u.role !== roleFilter) return false
      return true
    })
  }, [allUsers, companyFilter, statusFilter, roleFilter])

  const columns: ColumnDef<SuperAdminUser, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-muted-foreground shrink-0">
              {getInitials(row.original.name)}
            </div>
            <span className="font-medium text-foreground">
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "tenant_name",
        header: "Company",
        cell: ({ row }) => (
          <Link
            href={`/super-admin/tenants/${row.original.tenant_id}`}
            className="text-primary hover:underline font-medium"
          >
            {row.original.tenant_name}
          </Link>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <span
            className={
              row.original.role === "Admin"
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            }
          >
            {row.original.role}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const config = STATUS_BADGE[row.original.status]
          return (
            <Badge variant="outline" className={config.className}>
              {row.original.status}
            </Badge>
          )
        },
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ActionsCell
            user={row.original}
            onStatusChanged={() => setRefreshKey((k) => k + 1)}
          />
        ),
      },
    ],
    []
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-foreground">Users</h1>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading..." : `${allUsers.length} users across ${tenants.length} organizations`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-[180px] h-8 text-[12px]">
                  <SelectValue placeholder="All companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All companies</SelectItem>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-8 text-[12px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Deactivated">Deactivated</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] h-8 text-[12px]">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Member">Member</SelectItem>
                </SelectContent>
              </Select>

              {(companyFilter !== "all" || statusFilter !== "all" || roleFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[12px] text-muted-foreground"
                  onClick={() => {
                    setCompanyFilter("all")
                    setStatusFilter("all")
                    setRoleFilter("all")
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>

            <DataTable
              columns={columns}
              data={filteredUsers}
              searchKey="name"
              emptyTitle="No users found"
              emptyDescription="No users match your current filters."
            />
          </>
        )}
      </div>
    </div>
  )
}
