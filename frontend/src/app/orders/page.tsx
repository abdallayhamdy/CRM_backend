"use client"

import * as React from "react"
import { ShoppingCart, Plus, Settings2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CrmPageLayout, CrmPageHeader, CrmPageContent } from "@/components/crm/CrmPageLayout"
import { CrmTabs } from "@/components/crm/CrmTabs"
import { CrmDataTable } from "@/components/crm/CrmDataTable"
import { CrmFilterBar, GenericActiveFilter } from "@/components/crm/CrmFilterBar"
import { CrmFilterSidebar, SidebarFilterConfig } from "@/components/crm/CrmFilterSidebar"
import { CrmColumnEditor, ColumnItem } from "@/components/crm/CrmColumnEditor"
import { CrmEmptyState } from "@/components/crm/CrmEmptyState"
import { CrmTableSkeleton } from "@/components/crm/Skeletons"
import { useCrmFilters } from "@/hooks/use-crm-filters"
import { SummaryStatsBar, type SummaryStat } from "@/components/crm/SummaryStatsBar"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { useProperties } from "@/hooks/use-properties"
import { TableSettings, loadTableSettings, saveTableSettings as persistTableSettings } from "@/components/crm/TableSettingsDialog"
import { propertiesToGroups, propertiesToColumnDefs } from "@/lib/crm-properties"
import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { CreateOrderSheet } from "@/components/orders/CreateOrderSheet"
import dynamic from "next/dynamic"
const RecordPreviewPanel = dynamic(
  () => import("@/components/crm/RecordPreviewPanel").then(mod => ({ default: mod.RecordPreviewPanel })),
  { ssr: false }
)
import { toast } from "sonner"
import { useBulkSelection } from "@/hooks/use-bulk-selection"
import { BulkActionToolbar } from "@/components/crm/BulkActionToolbar"
import type { BulkEditField } from "@/components/crm/BulkEditSheet"
const BulkEditSheet = dynamic(
  () => import("@/components/crm/BulkEditSheet").then(mod => ({ default: mod.BulkEditSheet })),
  { ssr: false }
)
const TaskEditorSheet = dynamic(
  () => import("@/components/activities/TaskEditorSheet").then(mod => ({ default: mod.TaskEditorSheet })),
  { ssr: false }
)
import { ExportSlideOver, ExportColumn, ExportFormat, ExportScope } from "@/components/crm/ExportSlideOver"
import { exportToCSV } from "@/lib/utils"
import { logAudit } from "@/lib/audit"
import { ordersService } from "@/services/orders"
import { getBadgeClasses } from "@/lib/badge-colors"
import { PropertyHistoryPanel } from "@/components/crm/PropertyHistoryPanel"

export interface Order {
  id: string
  title: string | null
  order_number: string | null
  stage: string | null
  pipeline: string | null
  store: string | null
  amount: number | null
  total: number
  currency: string | null
  contact?: { id: string; first_name: string; last_name: string | null } | null
  created_at: string
  updated_at: string
  [key: string]: any
}

const DEFAULT_ORDER_COLUMNS = ["select", "title", "stage", "amount", "created_at"]

export default function OrdersPage() {
  const router = useRouter()
  const { workspaceId, user, loading: authLoading } = useAuth()

  React.useEffect(() => {
    if (!authLoading && !workspaceId) {
      router.replace("/login")
    }
  }, [authLoading, workspaceId, router])

  const { canCreateOrder, canEditOrder, canDeleteOrder, canCreateTask } = usePermissions()
  const { properties } = useProperties("order")
  const [tableSettings, setTableSettingsState] = React.useState<TableSettings>(() => loadTableSettings())
  const handleTableSettingsChange = React.useCallback((settings: TableSettings) => {
    setTableSettingsState(settings)
    persistTableSettings(settings)
  }, [])
  const [activeTab, setActiveTab] = React.useState("all")
  const [orders, setOrders] = React.useState<Order[]>([])
  const [loading, setLoading] = React.useState(true)
  const [summaryFilter, setSummaryFilter] = React.useState<string | null>(null)

  const [historyOrder, setHistoryOrder] = React.useState<Order | null>(null)
  const [historyOpen, setHistoryOpen] = React.useState(false)

  const orderStats: SummaryStat<Order>[] = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of orders) {
      const key = item.order_number?.toLowerCase().trim() || ""
      if (key) counts.set(key, (counts.get(key) || 0) + 1)
    }
    const duplicateKeys = new Set<string>()
    for (const [key, count] of counts) {
      if (count > 1) duplicateKeys.add(key)
    }

    return [
      { key: "all", label: "orders", filterFn: () => true },
      { key: "open", label: "open", filterFn: (o) => o.status === 'open' },
      { key: "paid", label: "paid", filterFn: (o) => o.status === 'paid' },
      { key: "refunded", label: "refunded", filterFn: (o) => o.status === 'refunded' },
      { key: "unassigned", label: "unassigned", color: "text-badge-warning-text", filterFn: (o) => !o.contact },
      { key: "duplicates", label: "duplicates", color: "text-destructive", filterFn: (o) => {
        const num = o.order_number?.toLowerCase().trim()
        if (!num) return false
        return duplicateKeys.has(num)
      }},
    ]
  }, [orders])

  const [createSheetOpen, setCreateSheetOpen] = React.useState(false)
  const [columnEditorOpen, setColumnEditorOpen] = React.useState(false)
  const [bulkEditOpen, setBulkEditOpen] = React.useState(false)
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const [totalCount, setTotalCount] = React.useState(0)

  const handleRowClick = React.useCallback((order: any) => setSelectedOrder(order), [])

  const [sortBy, setSortBy] = React.useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('crm_orders_sort_by') || 'created_at'
    return 'created_at'
  })
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('crm_orders_sort_dir') as "asc" | "desc") || 'desc'
    return 'desc'
  })

  const [tabsConfig, setTabsConfig] = React.useState<{ id: string; label: string; closable: boolean; color?: string }[]>(() => {
    if (typeof window === 'undefined') {
      return [
        { id: "all", label: "All orders", closable: false },
        { id: "open", label: "Open", closable: true },
        { id: "paid", label: "Paid", closable: true },
        { id: "refunded", label: "Refunded", closable: true },
      ]
    }
    try {
      const saved = localStorage.getItem("crm_order_tabs")
      return saved ? JSON.parse(saved) : [
        { id: "all", label: "All orders", closable: false },
        { id: "open", label: "Open", closable: true },
        { id: "paid", label: "Paid", closable: true },
        { id: "refunded", label: "Refunded", closable: true },
      ]
    } catch {
      return [
        { id: "all", label: "All orders", closable: false },
        { id: "open", label: "Open", closable: true },
        { id: "paid", label: "Paid", closable: true },
        { id: "refunded", label: "Refunded", closable: true },
      ]
    }
  })

  const [visibleColumnIds, setVisibleColumnIds] = React.useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crm_order_visible_columns')
      if (saved) {
        try { return [...new Set(JSON.parse(saved) as string[])] } catch { return DEFAULT_ORDER_COLUMNS }
      }
    }
    return DEFAULT_ORDER_COLUMNS
  })

  const {
    filters,
    activeFilterCount,
    sidebarOpen,
    setSidebarOpen,
    updateSearch,
    toggleProperty,
    updateDateRange,
    updateNumber,
    clearAll,
    removeAdvancedFilter,
    addAdvancedFilter,
  } = useCrmFilters()

  const fetchOrders = React.useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    try {
      const result = await ordersService.list({
        workspace_id: workspaceId,
        search: filters.search || undefined,
        status: activeTab !== "all" ? activeTab : undefined,
        sort_by: sortBy || undefined,
        sort_dir: sortDir,
        limit: 100,
      })
      if (!result.error) {
        const mapped = (result.data || []).map(o => ({
          ...o,
          stage: o.status,
          amount: o.total,
        })) as unknown as Order[]
        setOrders(mapped)
        setTotalCount(result.meta?.total || 0)
      } else {
        toast.error(result.error.message)
      }
    } catch {
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }, [workspaceId, filters.search, activeTab, sortBy, sortDir])

  React.useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleUpdateCell = React.useCallback(async (order: Order, field: string, value: any) => {
    if (!canEditOrder) {
      toast.error("You don't have permission to edit orders")
      return
    }
    if (!workspaceId) return
    try {
      const { error } = await ordersService.update(order.id, { [field]: value }, workspaceId)
      if (error) throw error
      toast.success("Order updated")
      fetchOrders()
    } catch (err) {
      toast.error("Failed to update order")
    }
  }, [canEditOrder, workspaceId, fetchOrders])

  const propertyGroups = React.useMemo(() => propertiesToGroups(properties), [properties])

  const baseColumns: ColumnDef<Order>[] = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => {
        return (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={table.getIsAllPageRowsSelected()}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all orders"
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
            aria-label={`Select order ${row.original.title || row.id}`}
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
      header: "Order Name",
      cell: ({ row }) => {
        const title = row.getValue("title") as string | null
        return (
          <a href="#" className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors truncate">
            {title || row.original.order_number || "Untitled Order"}
          </a>
        )
      },
      size: 180,
    },
    {
      accessorKey: "stage",
      header: "Status",
      cell: ({ row }) => {
        const stage = row.getValue("stage") as string
        const badgeStyles = getBadgeClasses('order_status', stage || 'open')
        return (
          <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border shadow-xs whitespace-nowrap capitalize ${badgeStyles}`}>
            {stage}
          </div>
        )
      },
      size: 150,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount") as string) || row.original.total || 0
        const currency = row.original.currency || "USD"
        const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)
        return <div className="text-right font-bold text-foreground">{formatted}</div>
      },
      size: 120,
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-muted-foreground font-medium">{new Date(row.getValue("created_at")).toLocaleDateString()}</span>
      ),
      size: 120,
    },
  ], [])

  const allPossibleColumns = React.useMemo(() => {
    const map = new Map<string, ColumnDef<Order>>()
    baseColumns.forEach(col => {
      const id = col.id || (col as any).accessorKey
      if (id) map.set(id, col)
    })
    propertiesToColumnDefs<Order>(properties).forEach(col => {
      if (col.id && !map.has(col.id)) map.set(col.id, col as ColumnDef<Order>)
    })
    return map
  }, [baseColumns, properties])

  const tableColumns = React.useMemo(() => {
    return visibleColumnIds.map(id => allPossibleColumns.get(id)).filter((col): col is ColumnDef<Order> => !!col)
  }, [allPossibleColumns, visibleColumnIds])

  const allColumnOptions = React.useMemo(() => {
    const seen = new Set<string>()
    const allPotential: ColumnItem[] = []
    baseColumns.forEach(col => {
      if (col.id === 'select') return
      const colId = col.id || (col as any).accessorKey
      if (!colId || seen.has(colId)) return
      seen.add(colId)
      allPotential.push({ id: colId, label: (col as any).header || colId, visible: visibleColumnIds.includes(colId) })
    })
    propertyGroups.forEach(group => {
      group.items.forEach(prop => {
        if (!seen.has(prop.id)) {
          seen.add(prop.id)
          allPotential.push({ id: prop.id, label: prop.label, visible: visibleColumnIds.includes(prop.id) })
        }
      })
    })
    const visible = visibleColumnIds.filter(id => id !== 'select').map(id => allPotential.find(c => c.id === id)).filter((c): c is ColumnItem => !!c)
    const hidden = allPotential.filter(c => !visibleColumnIds.includes(c.id))
    return [...visible, ...hidden]
  }, [visibleColumnIds, baseColumns, propertyGroups])

  const handleColumnSave = (updatedColumns: ColumnItem[]) => {
    const newIds = ["select", ...updatedColumns.filter(c => c.visible).map(c => c.id)]
    const unique = [...new Set(newIds)]
    setVisibleColumnIds(unique)
    localStorage.setItem('crm_order_visible_columns', JSON.stringify(unique))
    toast.success("Columns updated")
  }

  const allStages = React.useMemo(() => Array.from(new Set(orders.map((o) => o.stage).filter(Boolean) as string[])).sort(), [orders])
  const allPipelines = React.useMemo(() => Array.from(new Set(orders.map((o) => o.pipeline).filter(Boolean) as string[])).sort(), [orders])

  const filteredData = React.useMemo(() => {
    return orders.filter((order) => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const title = order.title || order.order_number || ""
        if (!title.toLowerCase().includes(q)) return false
      }
      const selectedStages = filters.properties["stage"] || []
      if (selectedStages.length > 0 && !selectedStages.includes(order.stage ?? '')) return false
      const selectedPipelines = filters.properties["pipeline"] || []
      if (selectedPipelines.length > 0 && (!order.pipeline || !selectedPipelines.includes(order.pipeline))) return false

      const dateRange = filters.dateRanges["createdAt"] as string
      if (dateRange && dateRange !== "all") {
        const orderDate = new Date(order.created_at)
        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        let start: Date | null = null
        let end: Date | null = null
        switch (dateRange) {
          case "today":
            start = startOfToday; break
          case "yesterday":
            start = new Date(startOfToday); start.setDate(start.getDate() - 1)
            end = new Date(startOfToday); end.setMilliseconds(end.getMilliseconds() - 1); break
          case "this_week": {
            const d = new Date(now); d.setDate(d.getDate() - d.getDay()); d.setHours(0, 0, 0, 0)
            start = d; break
          }
          case "last_7_days":
            start = new Date(startOfToday); start.setDate(start.getDate() - 7); break
          case "this_month":
            start = new Date(now.getFullYear(), now.getMonth(), 1); break
          case "last_month":
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            end = new Date(now.getFullYear(), now.getMonth(), 0); end.setHours(23, 59, 59, 999); break
          case "last_30_days":
            start = new Date(startOfToday); start.setDate(start.getDate() - 30); break
          case "last_90_days":
            start = new Date(startOfToday); start.setDate(start.getDate() - 90); break
        }
        if (start && orderDate < start) return false
        if (end && orderDate > end) return false
      }
      return true
    })
  }, [orders, filters])

  const summaryFilteredData = React.useMemo(() => {
    if (!summaryFilter) return filteredData
    const stat = orderStats.find(s => s.key === summaryFilter)
    if (!stat) return filteredData
    return filteredData.filter(stat.filterFn)
  }, [filteredData, summaryFilter, orderStats])

  const {
    selectedIds, selectedItems, toggleOne,
    clearSelection, count
  } = useBulkSelection(filteredData)

  const tabItems = tabsConfig.map(tab => ({
    ...tab,
    count: activeTab === tab.id ? totalCount : undefined,
  }))

  const handleTabClose = (id: string) => {
    const newTabs = tabsConfig.filter(t => t.id !== id)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_order_tabs", JSON.stringify(newTabs))
    if (activeTab === id) setActiveTab("all")
  }

  const handleTabReorder = (newTabs: { id: string; label: string; closable?: boolean; color?: string }[]) => {
    const persisted = newTabs.map(({ id, label, closable, color }) => ({ id, label, closable: closable ?? false, color }))
    setTabsConfig(persisted)
    localStorage.setItem("crm_order_tabs", JSON.stringify(persisted))
  }

  const handleTabRename = (id: string, newName: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, label: newName } : t)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_order_tabs", JSON.stringify(newTabs))
    toast.success(`View renamed to "${newName}"`)
  }

  const handleTabColorChange = (id: string, color: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, color: color || undefined } : t)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_order_tabs", JSON.stringify(newTabs))
    toast.success("Color updated")
  }

  const handleAddTab = () => {
    const name = prompt("Enter view name:")
    if (!name) return
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const newTabs = [...tabsConfig, { id, label: name, closable: true }]
    setTabsConfig(newTabs)
    localStorage.setItem("crm_order_tabs", JSON.stringify(newTabs))
    setActiveTab(id)
  }

  const activeFilters: GenericActiveFilter[] = [
    {
      id: "createdAt",
      label: "Create date",
      type: "date",
      value: filters.dateRanges["createdAt"] || "all",
      onChange: (val) => updateDateRange("createdAt", val as any),
    },
    {
      id: "pipeline",
      label: "Pipeline",
      type: "searchable-property",
      options: allPipelines,
      value: filters.properties["pipeline"] || [],
      onChange: (val) => toggleProperty("pipeline", val),
    },
    {
      id: "stage",
      label: "Order stage",
      type: "searchable-property",
      options: allStages,
      value: filters.properties["stage"] || [],
      onChange: (val) => toggleProperty("stage", val),
    },
  ]

  const sidebarConfig: SidebarFilterConfig[] = [
    { id: "name", label: "Order Name", type: "text" },
    { id: "createdAt", label: "Create date", type: "date" },
    { id: "pipeline", label: "Pipeline", type: "property", options: allPipelines },
    { id: "stage", label: "Order stage", type: "property", options: allStages },
  ]

  const exportColumns = React.useMemo<ExportColumn[]>(() => {
    const labels: Record<string, string> = {
      select: "Select", title: "Order Name", stage: "Status",
      amount: "Amount", created_at: "Created"
    }
    const standard = DEFAULT_ORDER_COLUMNS.filter(id => id !== "select").map(id => ({
      id,
      label: labels[id] || id,
      visible: visibleColumnIds.includes(id),
    }))
    const custom = properties
      .filter(p => !p.is_archived)
      .map(p => ({ id: `cf_${p.name}`, label: p.label || p.name, visible: false }))
    return [...standard, ...custom]
  }, [visibleColumnIds, properties])

  const handleBulkDelete = async () => {
    if (!canDeleteOrder) return
    if (!workspaceId) return
    try {
      const results = await Promise.allSettled(selectedItems.map(o => ordersService.delete(o.id, workspaceId)))
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        console.error("[orders] Some deletions failed:", failed)
        toast.error(`Failed to delete ${failed.length} order${failed.length > 1 ? 's' : ''}`)
      }
      const succeeded = results.length - failed.length
      if (succeeded > 0) toast.success(`Deleted ${succeeded} order${succeeded > 1 ? 's' : ''}`)
      clearSelection()
      fetchOrders()
    } catch (err) {
      console.error("[orders] Bulk delete failed:", err)
      toast.error("Failed to delete orders")
    }
  }

  const handleBulkExport = () => {
    const exportData = selectedItems.map(o => ({
      "Title": o.title,
      "Status": o.status,
      "Amount": o.amount,
    }))
    exportToCSV(exportData, `orders-export-${Date.now()}.csv`)
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Order',
        subcategory: 'Orders Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success(`Exported ${count} orders`)
  }

  const handleExportSlideOver = (format: ExportFormat, columnIds: string[], scope: ExportScope) => {
    if (format !== "csv") {
      toast.info("Only CSV export is supported in this client-side build")
    }
    const source = scope === "selected" && selectedItems.length > 0 ? selectedItems : filteredData
    if (!source || source.length === 0) {
      toast.error("Nothing to export")
      return
    }
    const labelOf = (id: string) => exportColumns.find(c => c.id === id)?.label || id
    const fieldMap: Record<string, (o: Order) => unknown> = {
      title: (o) => o.title || o.order_number,
      stage: (o) => o.stage,
      amount: (o) => o.amount,
      created_at: (o) => o.created_at,
      ...Object.fromEntries(
        properties.filter(p => !p.is_archived).map(p => [
          `cf_${p.name}`,
          (o: Order) => (o as any).custom_fields?.[p.name] ?? ""
        ])
      ),
    }
    const exportData = source.map((o) => {
      const row: Record<string, unknown> = {}
      for (const id of columnIds) {
        const accessor = fieldMap[id]
        row[labelOf(id)] = accessor ? accessor(o) : (o as any)[id] ?? ""
      }
      return row
    })
    const date = new Date().toISOString().slice(0, 10)
    exportToCSV(exportData, `orders_${date}.csv`)
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Order',
        subcategory: 'Orders Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success(`Exported ${exportData.length} orders`)
  }

  const bulkEditFields: BulkEditField[] = React.useMemo(() => [
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "open", label: "Open" },
        { value: "paid", label: "Paid" },
        { value: "refunded", label: "Refunded" },
      ],
    },
  ], [])

  const handleBulkEditUpdate = async (updates: Record<string, any>) => {
    if (!workspaceId) return { success: 0, failed: selectedItems.length }
    try {
      const results = await Promise.allSettled(
        selectedItems.map(o => ordersService.update(o.id, updates as any, workspaceId))
      )
      const failed = results.filter(r => r.status === 'rejected')
      const succeeded = results.length - failed.length
      if (failed.length > 0) {
        toast.error(`Failed to update ${failed.length} order${failed.length > 1 ? 's' : ''}`)
      }
      if (succeeded > 0) {
        toast.success(`Updated ${succeeded} order${succeeded > 1 ? 's' : ''}`)
      }
      return { success: succeeded, failed: failed.length }
    } catch (err) {
      toast.error('Failed to update orders')
      console.error('[handleBulkEditUpdate]', err)
      return { success: 0, failed: selectedItems.length }
    }
  }

  return (
    <CrmPageLayout>
      <CrmPageHeader
        title="Orders"
        icon={<ShoppingCart className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 font-bold text-foreground bg-background border-border">Actions</Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={() => setColumnEditorOpen(true)}>
              <Settings2 className="h-4 w-4" />
            </Button>
            {canCreateOrder && (
              <Button onClick={() => setCreateSheetOpen(true)} className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 gap-2 border-0 shadow-sm transition-all active:scale-95">
                <Plus className="h-4 w-4" />
                Create order
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

      <div className="flex flex-col flex-1 min-h-0 border border-border rounded-xl overflow-hidden mx-2 mt-2 mb-2">
      <CrmFilterBar
        placeholder="Search orders..."
        searchValue={filters.search}
        onSearchChange={updateSearch}
        activeFilters={activeFilters}
        onClearAll={clearAll}
        activeFilterCount={activeFilterCount}
        onAdvancedFilterClick={() => setSidebarOpen(true)}
        onExportClick={() => setExportOpen(true)}
        onEditColumnsClick={() => setColumnEditorOpen(true)}
        tableSettings={tableSettings}
        onTableSettingsChange={handleTableSettingsChange}
      />

       <CrmPageContent
         inlinePanel={
           <RecordPreviewPanel
             recordType="order"
             recordId={selectedOrder?.id || null}
             open={!!selectedOrder}
             onOpenChange={(open) => !open && setSelectedOrder(null)}
             onSuccess={fetchOrders}
           />
         }
       >
          <div className="p-2 flex-1 min-h-0 flex flex-col relative pb-16">
           <div className="bg-card rounded-xl border border-border/60 overflow-hidden flex-1 flex flex-col min-h-0">
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <CrmTableSkeleton columnCount={visibleColumnIds.length - 1} rowCount={10} />
                </div>
              ) : filteredData.length === 0 ? (
                <div className="p-6 flex-1 flex items-center justify-center">
                  <CrmEmptyState
                    title="No orders found"
                    description="We couldn't find any orders matching your criteria. Try adjusting your filters or search query."
                    icon={Package}
                    actionLabel="Clear Filters"
                    onAction={clearAll}
                  />
                </div>
              ) : (
                <>
                  <SummaryStatsBar
                    data={filteredData}
                    stats={orderStats}
                    activeFilter={summaryFilter}
                    onFilterChange={setSummaryFilter}
                  />
                  <CrmDataTable
                    columns={tableColumns}
                    data={summaryFilteredData}
                    isLoading={loading}
                    entityName="order"
                    selectedIds={selectedIds}
                    onToggleOne={toggleOne}
                    onRowClick={handleRowClick}
                    onUpdateCell={handleUpdateCell}
                    onHistoryClick={(item) => {
                      setHistoryOrder(item)
                      setHistoryOpen(true)
                    }}
                    tableSettings={tableSettings}
                  />
               </>
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

      <CrmColumnEditor
        open={columnEditorOpen}
        onOpenChange={setColumnEditorOpen}
        columns={allColumnOptions}
        propertyGroups={propertyGroups}
        onSave={handleColumnSave}
        title="Edit order columns"
      />

      <CreateOrderSheet
        isOpen={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        onCreated={fetchOrders}
      />

      {count > 0 && (canDeleteOrder || canEditOrder) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <BulkActionToolbar
            count={count}
            entityName="order"
            onDelete={handleBulkDelete}
            onExport={handleBulkExport}
            onEdit={canEditOrder ? () => setBulkEditOpen(true) : undefined}
            onCreateTask={canCreateTask ? () => setCreateTaskOpen(true) : undefined}
            onClear={clearSelection}
          />
        </div>
      )}

      <BulkEditSheet
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        onSaved={() => { clearSelection(); fetchOrders() }}
        entityName="order"
        count={count}
        fields={bulkEditFields}
        onBulkUpdate={handleBulkEditUpdate}
      />

      {selectedItems.length > 0 && workspaceId && (
        <TaskEditorSheet
          open={createTaskOpen}
          onClose={() => setCreateTaskOpen(false)}
          onSaved={() => { clearSelection(); fetchOrders() }}
          entityType="contact"
          entityId={selectedItems[0]?.contact_id || ""}
          workspaceId={workspaceId}
        />
      )}

      <ExportSlideOver
        open={exportOpen}
        onOpenChange={setExportOpen}
        entityLabel="Orders"
        columns={exportColumns}
        totalCount={totalCount}
        filteredCount={filteredData.length}
        selectedCount={count}
        hasActiveFilter={activeFilterCount > 0}
        onExport={handleExportSlideOver}
      />

      <PropertyHistoryPanel
        entityType="order"
        entityId={historyOrder?.id ?? null}
        entityTitle={historyOrder?.title || historyOrder?.order_number || undefined}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </CrmPageLayout>
  )
}
