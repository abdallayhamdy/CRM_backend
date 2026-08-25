"use client"

import * as React from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/shared/DataTable"
import { superAdminService, type Tenant } from "@/services/super-admin"
import { Building2, Loader2 } from "lucide-react"

const PLAN_LABELS: Record<Tenant["plan"], string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
}

const STATUS_CONFIG: Record<
  Tenant["status"],
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  trial: {
    label: "Trial",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  suspended: {
    label: "Suspended",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  churned: {
    label: "Churned",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  },
}

function buildColumns(): ColumnDef<Tenant, unknown>[] {
  return [
    {
      accessorKey: "company_name",
      header: "Company",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.company_name}</span>
      ),
    },
    {
      accessorKey: "plan",
      header: "Plan",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{PLAN_LABELS[row.original.plan]}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const config = STATUS_CONFIG[row.original.status]
        return (
          <Badge variant="outline" className={config.className}>
            {config.label}
          </Badge>
        )
      },
    },
    {
      id: "users",
      header: "Users",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{row.original.current_user_count}</span>
          {" / "}
          {row.original.user_limit}
        </span>
      ),
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
      accessorKey: "admin_email",
      header: "Admin Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.admin_email}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Link href={`/super-admin/tenants/${row.original.id}`}>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              View
            </Button>
          </Link>
          <Link href={`/super-admin/tenants/${row.original.id}`}>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              Edit
            </Button>
          </Link>
        </div>
      ),
    },
  ]
}

export default function TenantsPage() {
  const [tenants, setTenants] = React.useState<Tenant[]>([])
  const [loading, setLoading] = React.useState(true)
  const columns = React.useMemo(() => buildColumns(), [])

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      const result = await superAdminService.getTenants({ limit: 100 })
      if (!cancelled && !result.error) {
        setTenants(result.data)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-foreground">Tenants</h1>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading..." : `${tenants.length} organizations`}
            </p>
          </div>
        </div>
        <Link href="/super-admin/tenants/new">
          <Button size="sm" className="gap-1.5 h-8 px-3 text-xs">
            Create Client Account
          </Button>
        </Link>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={tenants}
            searchKey="company_name"
            emptyTitle="No tenants found"
            emptyDescription="No client organizations have been created yet."
          />
        )}
      </div>
    </div>
  )
}
