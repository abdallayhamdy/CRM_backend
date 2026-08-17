"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Activity } from "@/lib/types/crm"
import { Phone, Mail, Calendar, CheckCircle2, FileText } from "lucide-react"
import { format } from "date-fns"
import { getBadgeClasses } from "@/lib/badge-colors"
import { cn } from "@/lib/utils"

const ACTIVITY_TYPE_ICONS: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: CheckCircle2,
  note: FileText,
}

export const columns: ColumnDef<Activity>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="size-4 rounded-full border-border data-checked:bg-primary data-checked:border-primary data-indeterminate:bg-primary data-indeterminate:border-primary"
        />
      </div>
    ),
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
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type
      const Icon = ACTIVITY_TYPE_ICONS[type] || FileText
      return (
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-[13px] text-foreground capitalize">{type}</span>
        </div>
      )
    },
    size: 120,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <span className="text-[13px] text-foreground font-medium truncate block max-w-[300px]">
        {row.original.title || "--"}
      </span>
    ),
    size: 250,
  },
  {
    accessorKey: "completed",
    header: "Status",
    cell: ({ row }) => {
      const completed = row.original.completed
      const status = completed ? "completed" : "pending"
      const badgeClasses = getBadgeClasses("task_status", status)
      return (
        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border shadow-xs capitalize", badgeClasses)}>
          {status}
        </span>
      )
    },
    size: 100,
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => {
      const contact = row.original.contact
      if (!contact) return <span className="text-[13px] text-muted-foreground">--</span>
      return (
        <span className="text-[13px] text-foreground">
          {contact.first_name} {contact.last_name || ""}
        </span>
      )
    },
    size: 150,
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => (
      <span className="text-[13px] text-muted-foreground">
        {row.original.created_at ? format(new Date(row.original.created_at), "MMM d, yyyy") : "--"}
      </span>
    ),
    size: 120,
  },
]
