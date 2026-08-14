"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Task } from "@/lib/types/crm"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Phone, Mail, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"

export const columns = (onComplete: (id: string) => void): ColumnDef<Task>[] => [
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
          checked={row.original.status === "completed"}
          onCheckedChange={() => onComplete(row.original.id)}
          aria-label="Mark completed"
          className="size-4 rounded-full border-border data-checked:bg-status-success data-checked:border-status-success"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 28,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div                 className={`text-[13px] font-semibold hover:underline cursor-pointer ${row.original.status === "completed" ? 'text-muted-foreground line-through' : 'text-[var(--color-hs-blue)]'}`}>
        {row.getValue("title")}
      </div>
    ),
    meta: { editable: true },
  },
  {
    accessorKey: "type",
    header: "Task type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      return (
        <div className="flex items-center gap-2">
          {type === "Call" && <Phone className="h-3.5 w-3.5 text-muted-foreground" />}
          {type === "Email" && <Mail className="h-3.5 w-3.5 text-muted-foreground" />}
          {type === "To-do" && <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-[13px] text-muted-foreground">{type || "To-do"}</span>
        </div>
      )
    },
    meta: {
      editable: true,
      options: [
        { value: "Call", label: "Call" },
        { value: "Email", label: "Email" },
        { value: "To-do", label: "To-do" },
      ]
    },
  },
  {
    accessorKey: "due_date",
    header: "Due date",
    cell: ({ row }) => {
      const date = row.getValue("due_date") as string
      if (!date) return <span className="text-[13px] text-muted-foreground">-</span>
      return <div className="text-[13px] text-muted-foreground">{format(new Date(date), "MMM d, yyyy")}</div>
    },
    meta: { editable: true, hideBelow: 'md' },
  },
  {
    accessorKey: "owner",
    header: "Assigned to",
    cell: ({ row }) => {
      const owner = row.original.assigned_to
      if (!owner) return <span className="text-[13px] text-muted-foreground">Unassigned</span>
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5 border border-border">
            <AvatarFallback className="text-[10px] bg-muted">
              {owner.name?.[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-[13px] text-muted-foreground">{owner.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "task_queue",
    header: "Queue",
    cell: ({ row }) => (
      <div className="text-[13px] text-muted-foreground">General</div>
    ),
    meta: { editable: true, hideBelow: 'md' },
  },
]

