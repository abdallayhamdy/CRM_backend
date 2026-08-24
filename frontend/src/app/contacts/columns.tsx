"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar } from "@/components/crm/Avatar"
import { ExternalLink } from "lucide-react"
import Link from "next/link"
import { Contact } from "@/lib/types/crm"
import { LEAD_STATUS_OPTIONS } from "@/lib/crm-constants"
import { StageConfig } from "@/lib/default-object-configs"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { CrmDateCell } from "@/components/crm/CrmDateCell"
import { LifecycleBadge } from "@/components/crm/LifecycleBadge"

import { PropertyFromDB } from "@/hooks/use-properties"

export function getCoreColumns(lifecycleStages: StageConfig[], properties?: PropertyFromDB[], owners?: { value: string; label: string }[], companyOptions?: { value: string; label: string }[]): ColumnDef<Contact>[] {
  const leadStatusProp = properties?.find(p => p.name === 'lead_status' && p.options?.some(o => typeof o !== 'string' && !!o.color))
  const leadStatusOptions = leadStatusProp?.options
    ? leadStatusProp.options
        .map(o => typeof o === 'string' ? { label: o, value: o, color: undefined } : o)
        .map(o => ({
          value: o.value ?? o.internal_name ?? o.name ?? o.label ?? "",
          label: o.label ?? o.name ?? o.value ?? o.internal_name ?? "",
          color: o.color || '#94a3b8',
          badgeColor: LEAD_STATUS_OPTIONS.find(l => l.value.toLowerCase() === (o.value ?? "").toLowerCase())?.badgeColor,
        }))
    : LEAD_STATUS_OPTIONS
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
    id: "full_name",
    header: "Full Name",
    cell: ({ row }) => {
      const contact = row.original
      const fullName = `${contact.first_name} ${contact.last_name || ''}`.trim()

      return (
        <div className="flex items-center gap-3 py-1 text-foreground">
          <Avatar firstName={contact.first_name} lastName={contact.last_name || undefined} size="md" />
          <div className="flex flex-col min-w-0 flex-1">
            <Link
              href={`/contacts/${contact.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-primary hover:underline cursor-pointer truncate"
            >
              {fullName || '--'}
            </Link>
          </div>
        </div>
      )
    },
    size: 200,
    minSize: 150,
  },
  {
    accessorKey: "first_name",
    header: "First Name",
    cell: ({ row }) => <span className="text-foreground font-medium">{row.getValue("first_name") || '--'}</span>,
    size: 150,
    minSize: 100,
    meta: { editable: true, hideBelow: 'md' },
  },
  {
    accessorKey: "last_name",
    header: "Last Name",
    cell: ({ row }) => {
      const contact = row.original
      return <span className="text-foreground font-medium">{contact.last_name || '--'}</span>
    },
    size: 150,
    minSize: 100,
    meta: { editable: true, hideBelow: 'md' },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email") as string;
      if (!email) return <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">No email</span>;
      return (
        <div className="flex items-center gap-1.5 overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <a href={`mailto:${email}`} className="text-foreground hover:underline hover:text-primary font-medium truncate">
            {email}
          </a>
          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
        </div>
      )
    },
    size: 220,
    minSize: 150,
    meta: { editable: true },
  },
  {
    accessorKey: "phone",
    header: "Phone Number",
    cell: ({ row }) => <span className="text-foreground font-medium">{row.getValue("phone") || '--'}</span>,
    size: 150,
    minSize: 100,
    meta: { editable: true, hideBelow: 'md' },
  },
  {
    id: "company",
    accessorFn: (row) => row.company_id ?? "",
    header: "Company",
    cell: ({ row }) => <span className="text-foreground font-medium truncate">{row.original.company?.name || '--'}</span>,
    size: 150,
    minSize: 120,
    meta: { editable: true, hideBelow: 'md', options: companyOptions || [] },
  },
  {
    accessorKey: "lifecycle_stage",
    header: "Lifecycle Stage",
    cell: ({ row }) => {
      const stageValue = row.getValue("lifecycle_stage") as string
      return <LifecycleBadge stageId={stageValue} objectType="contact" />
    },
    size: 150,
    minSize: 120,
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
    accessorKey: "lead_status",
    header: "Lead Status",
    cell: ({ row }) => {
      const value = row.getValue("lead_status") as string
      const option = leadStatusOptions.find(o => o.value.toLowerCase() === value?.toLowerCase())
      const optColor = option && 'color' in option ? (option as any).color : undefined
      const badgeColorClass = option && 'badgeColor' in option ? (option as any).badgeColor : undefined
      return (
        <Badge
          className={cn("font-bold rounded-full px-3 py-0.5 border-0 shadow-sm", badgeColorClass)}
          style={optColor ? { backgroundColor: optColor, color: "#fff" } : undefined}
        >
          {option?.label || value || '--'}
        </Badge>
      )
    },
    size: 150,
    minSize: 100,
    meta: {
      editable: true,
      options: leadStatusOptions
    }
  },
  {
    id: "owner",
    accessorFn: (row) => row.owner_id ?? "",
    header: "Contact Owner",
    cell: ({ row }) => {
      const owner = row.original.owner
      if (!owner) return <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Unassigned</span>
      const name = `${owner.first_name} ${owner.last_name || ''}`.trim()
      return (
        <div className="flex items-center gap-2">
          <Avatar firstName={owner.first_name} lastName={owner.last_name} avatarUrl={owner.avatar_url} size="sm" />
          <span className="text-foreground font-medium text-[13px]">{name}</span>
        </div>
      )
    },
    size: 180,
    minSize: 100,
    meta: { editable: true, options: owners || [] },
  },
  {
    id: "createDate",
    accessorKey: "created_at",
    header: "Create Date",
    cell: ({ row }) => <CrmDateCell date={row.getValue("createDate")} />,
    size: 150,
    minSize: 100,
    meta: { editable: false, hideBelow: 'md' },
  },
  {
    id: "updated_at",
    accessorKey: "updated_at",
    header: "Last Modified",
    cell: ({ row }) => <CrmDateCell date={row.getValue("updated_at")} />,
    size: 150,
    minSize: 100,
    meta: { editable: false, hideBelow: 'md' },
  },
]
}

export function createDynamicColumn(field: {
  id: string,
  label: string,
  type?: string
}): ColumnDef<Contact> {
  // Map property IDs to actual object keys if they differ
  const systemMappings: Record<string, string> = {
    'createDate': 'created_at',
    'created_at': 'created_at',
    'updated_at': 'updated_at',
    'lastActivity': 'last_activity_at',
    'last_activity_at': 'last_activity_at',
    'last_contacted_at': 'last_contacted_at',
  }

  const actualKey = systemMappings[field.id] || field.id

  return {
    id: field.id,
    header: field.label,
    accessorFn: (row) => {
      // First check root property (for system fields)
      if (actualKey in row) return row[actualKey as keyof Contact]
      // Then check custom fields
      return row.custom_fields?.[field.id]
    },
    cell: ({ getValue }) => {
      const value = getValue()
      if (value === null || value === undefined || value === "") return <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Empty</span>

      // Use Badge for lifecycle type
      if (field.type === "lifecycle") {
        return <LifecycleBadge stageId={String(value)} objectType="contact" />
      }

      // Use CrmDateCell for date types or things that look like dates
      if (field.type === 'date' || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
        return <CrmDateCell date={value as string} />
      }

      return <span className="text-muted-foreground font-medium truncate inline-block max-w-full">{String(value)}</span>
    },
    size: 180,
    meta: {
      editable: !['created_at', 'updated_at', 'createDate', 'lastActivity', 'last_activity_at', 'last_contacted_at'].includes(field.id) && field.type !== 'date'
    },
  }
}

export const CORE_COLUMNS = getCoreColumns([])

export const columns = CORE_COLUMNS
