"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export type Product = {
  id: string
  name: string
  status: string
  sku: string
  unit_price: number
  created_at: string
}

export const columns: ColumnDef<Product>[] = [
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
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span                 className="text-primary font-semibold text-[13px] hover:underline cursor-pointer">
        {row.getValue("name")}
      </span>
    ),
    meta: { editable: true } as any,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2 rounded-full",
            status === "Active" ? "bg-status-success" : "bg-muted"
          )} />
          <span className="text-[13px] text-foreground">{status}</span>
        </div>
      )
    },
    meta: { 
      editable: true,
      options: ['Active', 'Inactive']
    } as any,
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => <span className="text-[13px] text-foreground font-medium">{row.getValue("sku")}</span>,
    meta: { editable: true, hideBelow: 'md' } as any,
  },
  {
    accessorKey: "unit_price",
    header: "Unit Price",
    cell: ({ row }) => {
      const price = row.getValue("unit_price") as number
      return (
        <span className="text-[13px] text-foreground font-bold">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price || 0)}
        </span>
      )
    },
    meta: { editable: true } as any,
  },
  {
    accessorKey: "created_at",
    header: "Create Date",
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string
      if (!date) return null
      return (
        <span className="text-[13px] text-muted-foreground">
          {new Date(date).toLocaleDateString()}
        </span>
      )
    },
    meta: { hideBelow: 'md' },
  },
]
