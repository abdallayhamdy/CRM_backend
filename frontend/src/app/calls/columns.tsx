"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Activity } from "@/lib/types/crm"
import { PhoneIncoming, PhoneOutgoing } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"

export const columns: ColumnDef<Activity>[] = [
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
    accessorKey: "created_at",
    header: "Activity date",
    cell: ({ row }) => (
      <div className="text-[13px] text-muted-foreground">
        {format(new Date(row.original.created_at), "MMM d, yyyy h:mm a")}
      </div>
    ),
  },
  {
    accessorKey: "call_duration",
    header: "Call duration",
    cell: ({ row }) => (
      <div className="text-[13px] text-muted-foreground">{row.original.call_duration || "-"}</div>
    ),
    meta: { hideBelow: 'md' },
  },
  {
    accessorKey: "call_direction",
    header: "Direction",
    cell: ({ row }) => {
      const direction = row.original.call_direction
      return (
        <div className="flex items-center gap-2">
          {direction === "Inbound" ? (
            <PhoneIncoming className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <PhoneOutgoing className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="text-[13px] text-muted-foreground">{direction || "Unknown"}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "call_outcome",
    header: "Call outcome",
    cell: ({ row }) => (
      <div className="text-[13px] text-muted-foreground">{row.original.call_outcome || "-"}</div>
    ),
    meta: { hideBelow: 'md' },
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => {
      const contact = row.original.contact
      if (!contact) return <span className="text-[13px] text-muted-foreground">-</span>
      return (
        <div className="text-[13px] text-primary hover:underline cursor-pointer font-medium">
          {contact.first_name} {contact.last_name}
        </div>
      )
    },
  },
  {
    accessorKey: "company",
    header: "Company",
    cell: ({ row }) => {
      const company = row.original.company
      if (!company) return <span className="text-[13px] text-muted-foreground">-</span>
      return (
        <div className="text-[13px] text-primary hover:underline cursor-pointer font-medium">
          {company.name}
        </div>
      )
    },
    meta: { hideBelow: 'md' },
  },
  {
    accessorKey: "owner",
    header: "Activity assigned to",
    cell: ({ row }) => {
      const owner = row.original.owner
      if (!owner) return <span className="text-[13px] text-muted-foreground">Unassigned</span>
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5 border border-border">
            <AvatarImage src={owner.avatar_url || ""} />
            <AvatarFallback className="text-[10px] bg-muted">
              {owner.first_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <span className="text-[13px] text-muted-foreground">{owner.first_name} {owner.last_name}</span>
        </div>
      )
    },
  },
]
