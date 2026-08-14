"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Ticket } from "@/lib/types/crm"
import { Badge } from "@/components/crm/Badge"
import { getBadgeClasses } from "@/lib/badge-colors"
import { Avatar } from "@/components/crm/Avatar"

export const columns: ColumnDef<Ticket>[] = [
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
    accessorKey: "subject",
    header: "Ticket Name",
    cell: ({ row }) => (
      <span                 className="text-[var(--color-hs-blue)] font-semibold text-[13.5px] hover:underline cursor-pointer tracking-tight">
        {row.getValue("subject")}
      </span>
    ),
    meta: { editable: true },
  },
  {
    accessorKey: "created_at",
    header: "Create Date",
    cell: ({ row }) => (
      <span className="text-foreground font-medium">
        {new Date(row.getValue("created_at")).toLocaleDateString()}
      </span>
    ),
    meta: { hideBelow: 'md' },
  },
  {
    id: "owner",
    header: "Ticket Owner",
    cell: ({ row }) => {
      const owner = row.original.owner
      if (!owner) return <span className="text-muted-foreground">Unassigned</span>
      const name = `${owner.first_name} ${owner.last_name || ''}`.trim()
      
      return (
        <div className="flex items-center gap-2">
          <Avatar firstName={owner.first_name} lastName={owner.last_name} avatarUrl={owner.avatar_url} size="sm" />
          <span className="text-[13px] text-foreground font-semibold hover:text-primary transition-colors cursor-pointer truncate max-w-[150px]">
            {name}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string
      if (!priority) return '--'
      return <Badge variant="outline" className={getBadgeClasses('ticket_priority', priority)} value={priority.toUpperCase()} />
    },
    meta: {
      editable: true,
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "urgent", label: "Urgent" },
      ]
    },
  },
  {
    accessorKey: "status",
    header: "Ticket Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      if (!status) return '--'
      return <Badge variant="outline" className={getBadgeClasses('ticket_status', status)} value={status.charAt(0).toUpperCase() + status.slice(1)} />
    },
    meta: {
      editable: true,
      options: [
        { value: "open", label: "Open" },
        { value: "pending", label: "Pending" },
        { value: "resolved", label: "Resolved" },
        { value: "closed", label: "Closed" },
      ]
    },
  },
]
