"use client"

import * as React from "react"
import { columns } from "./columns"
import { TicketCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

// Generic CRM Components
import { CrmPageLayout, CrmPageHeader, CrmPageContent } from "@/components/crm/CrmPageLayout"
import { CrmTabs } from "@/components/crm/CrmTabs"
import { CrmDataTable } from "@/components/crm/CrmDataTable"
import { CrmFilterBar, GenericActiveFilter } from "@/components/crm/CrmFilterBar"
import { CrmFilterSidebar, SidebarFilterConfig } from "@/components/crm/CrmFilterSidebar"
import { useCrmFilters } from "@/hooks/use-crm-filters"
import { SummaryStatsBar, type SummaryStat } from "@/components/crm/SummaryStatsBar"

import { ticketsService } from "@/services/tickets"
import { Ticket } from "@/lib/types/crm"
import { CrmTableSkeleton } from "@/components/crm/Skeletons"
import { CrmEmptyState } from "@/components/crm/CrmEmptyState"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { useProperties } from "@/hooks/use-properties"
import { buildPropertySidebarFilters } from "@/lib/filter-data"
import { propertiesToGroups, propertiesToColumnDefs } from "@/lib/crm-properties"

import { SortField } from "@/components/crm/SortPopover"
import { CrmColumnEditor, ColumnItem } from "@/components/crm/CrmColumnEditor"
import { CreateTicketSheet } from "./create-ticket-sheet"
import { TicketPreviewSheet } from "./preview-sheet"
import { PropertyHistoryPanel } from "@/components/crm/PropertyHistoryPanel"
import dynamic from "next/dynamic"
import { useBulkSelection } from "@/hooks/use-bulk-selection"
import { BulkActionToolbar } from "@/components/crm/BulkActionToolbar"
import { ExportSlideOver, ExportColumn, ExportFormat, ExportScope } from "@/components/crm/ExportSlideOver"
import type { BulkEditField } from "@/components/crm/BulkEditSheet"
const BulkEditSheet = dynamic(
  () => import("@/components/crm/BulkEditSheet").then(mod => ({ default: mod.BulkEditSheet })),
  { ssr: false }
)
const TaskEditorSheet = dynamic(
  () => import("@/components/activities/TaskEditorSheet").then(mod => ({ default: mod.TaskEditorSheet })),
  { ssr: false }
)
import { exportToCSV } from "@/lib/utils"
import { logAudit } from "@/lib/audit"
import { Profile } from "@/lib/types/crm"
import { authService } from "@/services/auth"
import { useTableSettings } from "@/hooks/use-table-settings"
import { useSortState } from "@/hooks/use-sort-state"
import { useOwners } from "@/hooks/use-owners"

export default function TicketsPage() {
  const [data, setData] = React.useState<Ticket[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [summaryFilter, setSummaryFilter] = React.useState<string | null>(null)

  const [historyTicket, setHistoryTicket] = React.useState<Ticket | null>(null)
  const [historyOpen, setHistoryOpen] = React.useState(false)

  const ticketStats: SummaryStat<Ticket>[] = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of data) {
      const key = item.subject?.toLowerCase().trim() || ""
      if (key) counts.set(key, (counts.get(key) || 0) + 1)
    }
    const duplicateKeys = new Set<string>()
    for (const [key, count] of counts) {
      if (count > 1) duplicateKeys.add(key)
    }

    return [
      { key: "all", label: "tickets", filterFn: () => true },
      { key: "open", label: "open", color: "text-badge-info-text", filterFn: (t) => t.status === 'open' || t.status === 'open_ticket' },
      { key: "waiting", label: "waiting", color: "text-badge-warning-text", filterFn: (t) => t.status === 'waiting' },
      { key: "duplicates", label: "duplicates", color: "text-destructive", filterFn: (t) => {
        const subject = t.subject?.toLowerCase().trim()
        if (!subject) return false
        return duplicateKeys.has(subject)
      }},
    ]
  }, [data])

  const summaryFilteredData = React.useMemo(() => {
    if (!summaryFilter) return data
    const stat = ticketStats.find(s => s.key === summaryFilter)
    if (!stat) return data
    return data.filter(stat.filterFn)
  }, [data, summaryFilter, ticketStats])

  const handleRowClick = React.useCallback((ticket: any) => setSelectedTicket(ticket), [])

  const [totalReady, setTotalReady] = React.useState(0)
  const [activeTab, setActiveTab] = React.useState("all")
  const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false)
  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [bulkEditOpen, setBulkEditOpen] = React.useState(false)
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)
  const [exportOpen, setExportOpen] = React.useState(false)
  const { sortBy, sortDir, handleSortChange } = useSortState({ storageKey: "crm_tickets_sort" })
  const [columnEditorOpen, setColumnEditorOpen] = React.useState(false)
  const [visibleColumns, setVisibleColumns] = React.useState<ColumnItem[]>([
    { id: "subject", label: "Subject", visible: true },
    { id: "status", label: "Status", visible: true },
    { id: "priority", label: "Priority", visible: true },
    { id: "owner", label: "Assignee", visible: true },
    { id: "created_at", label: "Created", visible: true },
  ])

  const [tabsConfig, setTabsConfig] = React.useState<{ id: string; label: string; closable: boolean; color?: string }[]>(() => {
    if (typeof window === 'undefined') {
      return [
        { id: "all", label: "All tickets", closable: false },
        { id: "my", label: "My open tickets", closable: true },
        { id: "unassigned", label: "Unassigned", closable: true },
        { id: "closed", label: "Closed tickets", closable: true },
      ]
    }
    try {
      const saved = localStorage.getItem("crm_ticket_tabs")
      return saved ? JSON.parse(saved) : [
        { id: "all", label: "All tickets", closable: false },
        { id: "my", label: "My open tickets", closable: true },
        { id: "unassigned", label: "Unassigned", closable: true },
        { id: "closed", label: "Closed tickets", closable: true },
      ]
    } catch {
      return [
        { id: "all", label: "All tickets", closable: false },
        { id: "my", label: "My open tickets", closable: true },
        { id: "unassigned", label: "Unassigned", closable: true },
        { id: "closed", label: "Closed tickets", closable: true },
      ]
    }
  })

  const router = useRouter()
  const { workspaceId, user, loading: authLoading } = useAuth()
  const { canCreateTicket, canEditTicket, canDeleteTicket, canCreateTask } = usePermissions()
  const { properties } = useProperties("ticket")
  const { tableSettings, handleTableSettingsChange } = useTableSettings()
  const owners = useOwners(workspaceId)

  const TICKET_SORT_FIELDS: SortField[] = [
    { value: "created_at", label: "Create date" },
    { value: "updated_at", label: "Update date" },
    { value: "subject", label: "Subject" },
  ]

  React.useEffect(() => {
    if (!authLoading && !workspaceId) {
      router.replace("/login")
    }
  }, [authLoading, workspaceId, router])

  const {
    selectedIds, selectedItems, toggleOne, toggleAll,
    clearSelection, isAllSelected, isPartialSelected, count
  } = useBulkSelection(data)

  const {
    filters,
    activeFilterCount,
    sidebarOpen,
    setSidebarOpen,
    updateSearch,
    toggleProperty,
    setProperty,
    updateDateRange,
    updateNumber,
    clearAll,
    removeAdvancedFilter,
    addAdvancedFilter,
  } = useCrmFilters()

  const debouncedSearch = useDebounce(filters.search, 300)

  const matchDateRange = React.useCallback((dateStr: string, range: string): boolean => {
    if (!range || range === "all") return true
    const date = new Date(dateStr)
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    switch (range) {
      case "today": return date >= startOfDay
      case "yesterday": {
        const yesterday = new Date(startOfDay); yesterday.setDate(yesterday.getDate() - 1)
        return date >= yesterday && date < startOfDay
      }
      case "last_7_days": {
        const cutoff = new Date(startOfDay); cutoff.setDate(cutoff.getDate() - 7)
        return date >= cutoff
      }
      case "last_30_days": {
        const cutoff = new Date(startOfDay); cutoff.setDate(cutoff.getDate() - 30)
        return date >= cutoff
      }
      case "last_90_days": {
        const cutoff = new Date(startOfDay); cutoff.setDate(cutoff.getDate() - 90)
        return date >= cutoff
      }
      case "this_month": {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      }
      case "last_month": {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
        return date.getMonth() === lastMonth && date.getFullYear() === year
      }
      case "this_year": return date.getFullYear() === now.getFullYear()
      default: return true
    }
  }, [])

  React.useEffect(() => {
    const controller = new AbortController()
    async function loadTickets() {
      if (!workspaceId) return
      setIsLoading(true)
      try {
        const ownerFilter = filters.properties["owner"]?.[0]
        const statusFilter = filters.properties["status"]?.[0]
        const priorityFilter = filters.properties["priority"]?.[0]
        const createDateRange = filters.dateRanges["createDate"]

        let apiOwnerFilter = ownerFilter
        let apiStatusFilter = statusFilter
        let clientFilterFn: ((t: Ticket) => boolean) | null = null

        if (activeTab === "my" && user?.id) {
          apiOwnerFilter = user.id
        } else if (activeTab === "closed") {
          apiStatusFilter = "closed"
        } else if (activeTab === "unassigned") {
          clientFilterFn = (t) => !t.owner_id && t.status !== "closed"
        }

        const { data: fetchResult, error, meta } = await ticketsService.getAll({
          search: debouncedSearch,
          owner_id: apiOwnerFilter,
          status: apiStatusFilter,
          priority: priorityFilter,
          workspace_id: workspaceId,
          limit: 100,
          properties: filters.properties,
          sortBy,
          sortDir,
        })

        if (error) throw error
        if (!controller.signal.aborted) {
          let filtered = (fetchResult || []) as Ticket[]

          if (clientFilterFn) {
            filtered = filtered.filter(clientFilterFn)
          }

          if (createDateRange && createDateRange !== "all") {
            filtered = filtered.filter((t) => matchDateRange(t.created_at, createDateRange))
          }

          setData(filtered)
          setTotalReady(meta?.total || 0)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          toast.error("Failed to load tickets")
          console.error("Failed to load tickets:", { message: (err as Error)?.message })
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }
    loadTickets()
    return () => controller.abort()
  }, [debouncedSearch, filters.properties, filters.dateRanges, workspaceId, refreshKey, activeTab, user, matchDateRange, sortBy, sortDir])

  const allOwners: string[] = owners.map(o => `${o.first_name} ${o.last_name}`.trim())
  const allStatuses = ["open", "pending", "resolved", "closed"]
  const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"]

  const exportColumns = React.useMemo<ExportColumn[]>(() => {
    const standard = [
      { id: "subject", label: "Subject", visible: true },
      { id: "status", label: "Status", visible: true },
      { id: "priority", label: "Priority", visible: true },
      { id: "assignee", label: "Assignee", visible: true },
      { id: "contact", label: "Contact", visible: true },
      { id: "company", label: "Company", visible: true },
      { id: "created_at", label: "Created", visible: true },
      { id: "updated_at", label: "Updated", visible: true },
    ]
    const custom = properties
      .filter(p => !p.is_archived)
      .map(p => ({ id: `cf_${p.name}`, label: p.label || p.name, visible: false }))
    return [...standard, ...custom]
  }, [properties])

  const propertyGroups = React.useMemo(() => propertiesToGroups(properties), [properties])

  const allPossibleColumns = React.useMemo(() => {
    const map = new Map<string, typeof columns[number]>()
    columns.forEach(col => {
      const id = col.id || (col as any).accessorKey
      if (id) map.set(id, col)
    })
    propertiesToColumnDefs<Ticket>(properties).forEach(col => {
      if (col.id && !map.has(col.id)) map.set(col.id, col as typeof columns[number])
    })
    return map
  }, [properties])

  const tableColumns = React.useMemo(() => {
    return [...allPossibleColumns.values()]
  }, [allPossibleColumns])

  const tabItems = tabsConfig.map(tab => ({
    ...tab,
    count: activeTab === tab.id ? totalReady : undefined,
  }))

  const handleTabClose = (id: string) => {
    const newTabs = tabsConfig.filter(t => t.id !== id)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_ticket_tabs", JSON.stringify(newTabs))
    if (activeTab === id) setActiveTab("all")
  }

  const handleTabReorder = (newTabs: { id: string; label: string; closable?: boolean; color?: string }[]) => {
    const persisted = newTabs.map(({ id, label, closable, color }) => ({ id, label, closable: closable ?? false, color }))
    setTabsConfig(persisted)
    localStorage.setItem("crm_ticket_tabs", JSON.stringify(persisted))
  }

  const handleTabRename = (id: string, newName: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, label: newName } : t)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_ticket_tabs", JSON.stringify(newTabs))
    toast.success(`View renamed to "${newName}"`)
  }

  const handleTabColorChange = (id: string, color: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, color: color || undefined } : t)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_ticket_tabs", JSON.stringify(newTabs))
    toast.success("Color updated")
  }

  const handleAddTab = () => {
    const name = prompt("Enter view name:")
    if (!name) return
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const newTabs = [...tabsConfig, { id, label: name, closable: true }]
    setTabsConfig(newTabs)
    localStorage.setItem("crm_ticket_tabs", JSON.stringify(newTabs))
    setActiveTab(id)
  }

  const activeFilters: GenericActiveFilter[] = [
    {
      id: "owner",
      label: "Ticket owner",
      type: "searchable-property",
      options: allOwners,
      value: filters.properties["owner"] || [],
      onChange: (val) => setProperty("owner", val),
    },
    {
      id: "priority",
      label: "Priority",
      type: "simple-property",
      options: TICKET_PRIORITIES,
      value: filters.properties["priority"] || [],
      onChange: (val) => setProperty("priority", val),
    },
    {
      id: "status",
      label: "Ticket status",
      type: "searchable-property",
      options: allStatuses,
      value: filters.properties["status"] || [],
      onChange: (val) => setProperty("status", val),
    },
    {
      id: "createDate",
      label: "Create date",
      type: "date",
      value: filters.dateRanges["createDate"] || "all",
      onChange: (val) => updateDateRange("createDate", val as any),
    },
  ]

  const sidebarConfig: SidebarFilterConfig[] = React.useMemo(() => {
    const base: SidebarFilterConfig[] = [
      { id: "name", label: "Ticket name", type: "text" },
      { id: "owner", label: "Ticket owner", type: "property", options: allOwners },
      { id: "priority", label: "Priority", type: "property", options: TICKET_PRIORITIES },
      { id: "status", label: "Ticket status", type: "property", options: allStatuses },
      { id: "createDate", label: "Create date", type: "date" },
    ]
    const propertyFilters = buildPropertySidebarFilters(properties)
    if (propertyFilters.length > 0) {
      return [...base, ...propertyFilters]
    }
    return base
  }, [allOwners, properties])

  const handleBulkDelete = async () => {
    if (!canDeleteTicket) {
      toast.error("You don't have permission to delete tickets")
      return
    }
    try {
      const results = await Promise.allSettled(selectedItems.map(t => ticketsService.delete(t.id, workspaceId!)))
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        console.error("[tickets] Some deletions failed:", failed)
        toast.error(`Failed to delete ${failed.length} ticket${failed.length > 1 ? 's' : ''}`)
      }
      const succeeded = results.length - failed.length
      if (succeeded > 0) toast.success(`Deleted ${succeeded} ticket${succeeded > 1 ? 's' : ''}`)
      clearSelection()
      setRefreshKey(k => k + 1)
    } catch (err) {
      console.error("[tickets] Bulk delete failed:", err)
      toast.error("Failed to delete tickets")
    }
  }

  const handleBulkExport = () => {
    const exportData = selectedItems.map(t => ({
      "Subject": t.subject,
      "Status": t.status,
      "Priority": t.priority,
    }))
    exportToCSV(exportData, `tickets-export-${Date.now()}.csv`)
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Ticket',
        subcategory: 'Tickets Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success(`Exported ${count} tickets`)
  }

  const handleExportSlideOver = (format: ExportFormat, columnIds: string[], scope: ExportScope) => {
    if (format !== "csv") {
      toast.info("Only CSV export is supported in this client-side build")
    }
    const source = scope === "selected" && selectedItems.length > 0 ? selectedItems : data
    if (!source || source.length === 0) {
      toast.error("Nothing to export")
      return
    }
    const labelOf = (id: string) => exportColumns.find(c => c.id === id)?.label || id
    const fieldMap: Record<string, (t: Ticket) => unknown> = {
      subject: (t) => t.subject,
      status: (t) => t.status,
      priority: (t) => t.priority,
      assignee: (t) => t.owner ? `${t.owner.first_name ?? ""} ${t.owner.last_name ?? ""}`.trim() : "",
      contact: (t) => t.contact ? `${t.contact.first_name ?? ""} ${t.contact.last_name ?? ""}`.trim() : "",
      company: (t) => t.contact?.company?.name ?? "",
      created_at: (t) => t.created_at,
      updated_at: (t) => t.updated_at,
      ...Object.fromEntries(
        properties.filter(p => !p.is_archived).map(p => [
          `cf_${p.name}`,
          (t: Ticket) => t.custom_fields?.[p.name] ?? ""
        ])
      ),
    }
    const exportData = source.map((t) => {
      const row: Record<string, unknown> = {}
      for (const id of columnIds) {
        const accessor = fieldMap[id]
        row[labelOf(id)] = accessor ? accessor(t) : ""
      }
      return row
    })
    const date = new Date().toISOString().slice(0, 10)
    exportToCSV(exportData, `tickets_${date}.csv`)
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Ticket',
        subcategory: 'Tickets Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success(`Exported ${exportData.length} tickets`)
  }

  const bulkEditFields: BulkEditField[] = React.useMemo(() => [
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "open", label: "Open" },
        { value: "pending", label: "Pending" },
        { value: "resolved", label: "Resolved" },
        { value: "closed", label: "Closed" },
      ],
    },
    {
      id: "priority",
      label: "Priority",
      type: "select",
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "urgent", label: "Urgent" },
      ],
    },
    {
      id: "owner_id",
      label: "Ticket Owner",
      type: "select",
      options: owners.map(o => ({ value: o.clerk_user_id || o.id, label: `${o.first_name} ${o.last_name}`.trim() })),
    },
  ], [owners])

  const handleBulkEditUpdate = async (updates: Record<string, any>) => {
    if (!canEditTicket) {
      toast.error("You don't have permission to edit tickets")
      return { success: 0, failed: selectedItems.length }
    }
    try {
      const results = await Promise.allSettled(
        selectedItems.map(t => ticketsService.update(t.id, updates as any, workspaceId!))
      )
      const failed = results.filter(r => r.status === 'rejected')
      const succeeded = results.length - failed.length
      if (failed.length > 0) {
        toast.error(`Failed to update ${failed.length} ticket${failed.length > 1 ? 's' : ''}`)
      }
      if (succeeded > 0) {
        toast.success(`Updated ${succeeded} ticket${succeeded > 1 ? 's' : ''}`)
      }
      return { success: succeeded, failed: failed.length }
    } catch (err) {
      toast.error('Failed to update tickets')
      console.error('[handleBulkEditUpdate]', err)
      return { success: 0, failed: selectedItems.length }
    }
  }

  const handleBulkAssign = async (ownerId: string, ownerName: string) => {
    try {
      const results = await Promise.allSettled(
        selectedItems.map(t => ticketsService.update(t.id, { owner_id: ownerId } as any, workspaceId!))
      )
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        toast.error(`Failed to assign ${failed.length} ticket${failed.length > 1 ? 's' : ''}`)
      }
      const succeeded = results.length - failed.length
      if (succeeded > 0) {
        toast.success(`Assigned ${succeeded} ticket${succeeded > 1 ? 's' : ''} to ${ownerName}`)
      }
      clearSelection()
      setRefreshKey(k => k + 1)
    } catch (err) {
      toast.error('Failed to assign tickets')
      console.error('[handleBulkAssign]', err)
      clearSelection()
    }
  }

  const handleUpdateCell = async (ticket: Ticket, columnId: string, value: string | number | boolean | null) => {
    if (!canEditTicket) {
      toast.error("You don't have permission to edit tickets")
      return
    }
    if (!workspaceId) return
    try {
      const standardFields = ['subject', 'priority', 'status']
      const updates: Partial<Ticket> = {}
      if (standardFields.includes(columnId)) {
        (updates as Record<string, unknown>)[columnId] = value
      } else {
        updates.custom_fields = {
          ...(ticket.custom_fields as Record<string, unknown> || {}),
          [columnId]: value
        }
      }

      const { error } = await ticketsService.update(ticket.id, updates, workspaceId)
      if (error) throw error
      toast.success("Ticket updated")
      setRefreshKey(k => k + 1)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update ticket"
      toast.error(message)
    }
  }

  return (
    <CrmPageLayout>
      <CrmPageHeader 
        title="Tickets" 
        icon={<TicketCheck className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            {canCreateTicket && (
              <Button 
                onClick={() => setIsCreateSheetOpen(true)}
                className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 gap-2 border-0 shadow-sm transition-all active:scale-95"
              >
                Create ticket
              </Button>
            )}
          </div>
        }
      >
        <CrmTabs 
          items={tabItems} 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onTabClose={handleTabClose}
          onReorder={handleTabReorder}
          onAddTab={handleAddTab}
          onRenameTab={handleTabRename}
          onColorChangeTab={handleTabColorChange}
          className="ml-0"
        />
      </CrmPageHeader>

      <div className="flex flex-col flex-1 min-h-0 border border-border rounded-xl overflow-hidden mx-2 mt-2">
      <CrmFilterBar 
        placeholder="Search tickets..." 
        searchValue={filters.search}
        onSearchChange={updateSearch}
        activeFilters={activeFilters}
        onClearAll={clearAll}
        activeFilterCount={activeFilterCount}
        onAdvancedFilterClick={() => setSidebarOpen(true)}
        onExportClick={() => setExportOpen(true)}
        tableSettings={tableSettings}
        onTableSettingsChange={handleTableSettingsChange}
        sortFields={TICKET_SORT_FIELDS}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        onEditColumnsClick={() => setColumnEditorOpen(true)}
      />

      <CrmPageContent>
        <div className="p-2 flex-1 min-h-0 flex flex-col">
          <div className="bg-background rounded-xl border border-border/60 overflow-hidden flex-1 flex flex-col min-h-0">
            {isLoading ? (
              <CrmTableSkeleton columnCount={7} rowCount={10} />
            ) : totalReady === 0 ? (
               <div className="p-6">
                  <CrmEmptyState 
                    title="No tickets yet" 
                    description="Create your first ticket to start managing support requests." 
                    icon={TicketCheck} 
                    actionLabel={canCreateTicket ? "Create ticket" : undefined}
                    onAction={canCreateTicket ? () => setIsCreateSheetOpen(true) : undefined}
                  />
               </div>
            ) : data.length === 0 ? (
               <div className="p-6">
                  <CrmEmptyState 
                    title="No tickets found" 
                    description="We couldn't find any tickets matching your criteria. Try adjusting your filters or search query." 
                    icon={TicketCheck} 
                    actionLabel="Clear Filters"
                    onAction={clearAll}
                  />
               </div>
            ) : (
              <div className="flex flex-col flex-1">
                <SummaryStatsBar
                  data={data}
                  stats={ticketStats}
                  activeFilter={summaryFilter}
                  onFilterChange={setSummaryFilter}
                />
                <CrmDataTable 
                  columns={tableColumns} 
                  data={summaryFilteredData} 
                  onRowClick={handleRowClick}
                  onUpdateCell={handleUpdateCell}
                  onHistoryClick={(item) => {
                    setHistoryTicket(item)
                    setHistoryOpen(true)
                  }}
                  entityName="ticket"
                  selectedIds={selectedIds}
                  onToggleOne={toggleOne}
                  tableSettings={tableSettings}
                />
              </div>
            )}
          </div>
        </div>
      </CrmPageContent>
      </div>

      <CrmFilterSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        filters={filters}
        config={sidebarConfig}
        onToggleProperty={toggleProperty}
        onUpdateNumber={updateNumber}
        onClearAll={clearAll}
        onAddAdvancedFilter={addAdvancedFilter}
        onRemoveAdvancedFilter={removeAdvancedFilter}
        activeFilterCount={activeFilterCount}
      />

      <CreateTicketSheet 
        open={isCreateSheetOpen} 
        onOpenChange={setIsCreateSheetOpen} 
        onSuccess={() => {
          setRefreshKey(k => k + 1)
        }} 
      />

      <TicketPreviewSheet
        ticket={selectedTicket}
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />

      {count > 0 && canDeleteTicket && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <BulkActionToolbar
            count={count}
            entityName="ticket"
            onDelete={handleBulkDelete}
            onAssignOwner={canEditTicket ? handleBulkAssign : undefined}
            onExport={() => setExportOpen(true)}
            onEdit={canEditTicket ? () => setBulkEditOpen(true) : undefined}
            onCreateTask={canCreateTask ? () => setCreateTaskOpen(true) : undefined}
            onClear={clearSelection}
            members={owners.map(o => ({ id: o.clerk_user_id || o.id, name: `${o.first_name} ${o.last_name}`.trim() }))}
          />
        </div>
      )}

      <BulkEditSheet
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        onSaved={() => { clearSelection(); setRefreshKey(k => k + 1) }}
        entityName="ticket"
        count={count}
        fields={bulkEditFields}
        onBulkUpdate={handleBulkEditUpdate}
      />

      {selectedItems.length > 0 && workspaceId && (
        <TaskEditorSheet
          open={createTaskOpen}
          onClose={() => setCreateTaskOpen(false)}
          onSaved={() => { clearSelection(); setRefreshKey(k => k + 1) }}
          entityType="ticket"
          entityId={selectedItems[0]?.id || ""}
          workspaceId={workspaceId}
        />
      )}

      <ExportSlideOver
        open={exportOpen}
        onOpenChange={setExportOpen}
        entityLabel="Tickets"
        columns={exportColumns}
        totalCount={totalReady}
        filteredCount={data.length}
        selectedCount={count}
        hasActiveFilter={activeFilterCount > 0}
        onExport={handleExportSlideOver}
      />

      <PropertyHistoryPanel
        entityType="ticket"
        entityId={historyTicket?.id ?? null}
        entityTitle={historyTicket?.subject || undefined}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />

      <CrmColumnEditor
        open={columnEditorOpen}
        onOpenChange={setColumnEditorOpen}
        columns={visibleColumns}
        onSave={(cols) => setVisibleColumns(cols)}
        title="Edit columns"
        description="Choose which columns to show in your table and their order."
      />
    </CrmPageLayout>
  )
}
