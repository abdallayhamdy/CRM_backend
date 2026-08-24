"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Company } from "@/lib/types/crm"
import { Avatar } from "@/components/crm/Avatar"
import { StageConfig } from "@/lib/default-object-configs"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { CrmDateCell } from "@/components/crm/CrmDateCell"
import { LifecycleBadge } from "@/components/crm/LifecycleBadge"
import Link from "next/link"

export function getCompanyColumns(lifecycleStages: StageConfig[]): ColumnDef<Company>[] {
  return [{
    id: "select",
    header: ({ table }) => {
      return (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="size-4 rounded-full border-border data-checked:bg-primary data-checked:border-primary data-indeterminate:bg-primary data-indeterminate:border-primary"
          />
        </div>
      )
    },
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="size-4 rounded-full border-border data-checked:bg-primary data-checked:border-primary"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 28,
  },
  {
    accessorKey: "name",
    header: "Company name",
    cell: ({ row }) => {
      const company = row.original
      const domainUrl = company.domain ? `https://${company.domain}` : undefined

      return (
        <div className="flex items-center gap-3">
          <Avatar
             firstName={company.name}
             lastName=""
             size="sm"
          />
          <div className="flex flex-col flex-1 min-w-0">
            <Link
              href={`/companies/${company.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-primary hover:underline cursor-pointer"
            >
              {company.name}
            </Link>
            {company.domain && (
               <a href={domainUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground/60 hover:underline hover:text-primary">
                  {company.domain}
               </a>
            )}
          </div>
        </div>
      )
    },
    size: 240,
    meta: { editable: true },
  },
  {
    accessorKey: "industry",
    header: "Industry",
    cell: ({ row }) => (
      <span className="text-foreground font-medium">
        {row.getValue("industry") || '--'}
      </span>
    ),
    size: 160,
    meta: { editable: true },
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => (
      <span className="text-foreground font-medium">
        {row.getValue("size") || '--'}
      </span>
    ),
    size: 140,
    meta: { editable: true, hideBelow: 'md' },
  },
  {
    id: "owner",
    header: "Company owner",
    cell: ({ row }) => {
      const owner = row.original.owner
      if (!owner) return <span className="text-muted-foreground">Unassigned</span>
      
      return (
         <div className="flex items-center gap-2">
            <Avatar firstName={owner.first_name} lastName={owner.last_name} avatarUrl={owner.avatar_url} size="sm" />
            <span className="text-foreground font-medium">
               {`${owner.first_name} ${owner.last_name || ''}`}
            </span>
         </div>
      )
    },
    size: 200,
  },
  {
    accessorKey: "phone",
    header: "Phone Number",
    cell: ({ row }) => (
      <span className="text-foreground font-medium">
        {row.getValue("phone") || '--'}
      </span>
    ),
    size: 160,
    meta: { editable: true, hideBelow: 'md' },
  },
  {
    accessorKey: "lifecycle_stage",
    header: "Lifecycle Stage",
    cell: ({ row }) => {
      const stageValue = row.getValue("lifecycle_stage") as string
      return <LifecycleBadge stageId={stageValue} objectType="company" />
    },
    size: 150,
    meta: { 
      editable: true,
      options: lifecycleStages.filter(s => s.is_active).map(s => ({
        value: s.id,
        label: s.name,
        color: s.color,
      }))
    }
  },
  {
    id: "createDate",
    accessorKey: "created_at",
    header: "Create Date",
    cell: ({ row }) => (
      <CrmDateCell date={row.getValue("createDate")} />
    ),
    size: 160,
    meta: { editable: false, hideBelow: 'md' },
  },
]
}

export const columns = getCompanyColumns([])

