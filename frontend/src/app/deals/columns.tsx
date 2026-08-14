"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar } from "@/components/crm/Avatar"
import { Deal } from "@/lib/types/crm"
import { CrmDateCell } from "@/components/crm/CrmDateCell"
import { cn } from "@/lib/utils"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { DEAL_STAGE_OPTIONS } from "@/lib/crm-constants"

export const columns: ColumnDef<Deal>[] = [
  {
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
    accessorKey: "title",
    header: "Deal Name",
    cell: ({ row }) => {
      return (
        <Link
          href={`/deals/${row.original.id}`}
          className="font-semibold text-primary hover:underline hover:text-primary/80 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {row.getValue("title")}
        </Link>
      )
    },
    size: 250,
    meta: { editable: true },
  },
  {
    accessorKey: "stage",
    header: "Deal Stage",
    cell: ({ row }) => {
      const stageValue = row.getValue("stage") as string
      const stage = DEAL_STAGE_OPTIONS.find(s => s.value.toLowerCase() === stageValue?.toLowerCase())

      return (
        <Badge
          className="font-bold rounded-full px-3 py-0.5 border-0 shadow-sm"
          style={stage ? { backgroundColor: stage.color, color: "#fff" } : undefined}
        >
          {stage?.label || stageValue}
        </Badge>
      )
    },
    size: 200,
    meta: {
      editable: true,
      options: DEAL_STAGE_OPTIONS
    },
  },
  {
    accessorKey: "close_date",
    header: "Close Date",
    cell: ({ row }) => {
      const val = row.getValue("close_date") as string
      return <CrmDateCell date={val} useRelative={false} />
    },
    size: 150,
    meta: { editable: true, hideBelow: 'md' },
  },
  {
    id: "owner",
    header: "Deal owner",
    cell: ({ row }) => {
      const owner = row.original.owner
      if (!owner) return <span className="text-muted-foreground">Unassigned</span>

      const name = `${owner.first_name} ${owner.last_name || ''}`.trim()

      return (
        <div className="flex items-center gap-2">
          <Avatar firstName={owner.first_name} lastName={owner.last_name} avatarUrl={owner.avatar_url} size="sm" />
          <span className="text-foreground font-medium truncate max-w-[150px]">{name}</span>
        </div>
      )
    },
    size: 200,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      if (isNaN(amount)) return <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">No amount</span>

      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(amount)
      return <div className="text-right font-medium text-foreground">{formatted}</div>
    },
    size: 150,
    meta: { editable: true },
  },
  {
    id: "createDate",
    accessorKey: "created_at",
    header: "Create Date",
    cell: ({ row }) => {
      const val = row.getValue("createDate") as string
      return <CrmDateCell date={val} />
    },
    size: 150,
    meta: { editable: false, hideBelow: 'md' },
  },
]
