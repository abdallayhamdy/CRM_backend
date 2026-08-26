"use client"

import * as React from "react"
import { columns } from "./columns"
import { productsService } from "@/services/products"
import { ShoppingBag, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { useProperties } from "@/hooks/use-properties"
import { buildPropertySidebarFilters } from "@/lib/filter-data"
import { propertiesToGroups, propertiesToColumnDefs } from "@/lib/crm-properties"
import { ColumnDef } from "@tanstack/react-table"

// Generic CRM Components
import { CrmPageLayout, CrmPageHeader, CrmPageContent } from "@/components/crm/CrmPageLayout"
import { CrmTabs } from "@/components/crm/CrmTabs"
import { CrmDataTable } from "@/components/crm/CrmDataTable"
import dynamic from "next/dynamic"
const RecordPreviewPanel = dynamic(
  () => import("@/components/crm/RecordPreviewPanel").then(mod => ({ default: mod.RecordPreviewPanel })),
  { ssr: false }
)
import { CrmFilterBar, GenericActiveFilter } from "@/components/crm/CrmFilterBar"
import { SortField } from "@/components/crm/SortPopover"
import { CrmColumnEditor, ColumnItem } from "@/components/crm/CrmColumnEditor"
import { CrmFilterSidebar, SidebarFilterConfig } from "@/components/crm/CrmFilterSidebar"
import { useCrmFilters } from "@/hooks/use-crm-filters"
import { SummaryStatsBar, type SummaryStat } from "@/components/crm/SummaryStatsBar"
import { CreateProductSheet } from "./create-product-sheet"
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
import { exportToCSV } from "@/lib/utils"
import { logAudit } from "@/lib/audit"
import { ExportSlideOver, ExportColumn, ExportFormat, ExportScope } from "@/components/crm/ExportSlideOver"
import { CrmEmptyState } from "@/components/crm/CrmEmptyState"
import { CrmTableSkeleton } from "@/components/crm/Skeletons"
import { useTableSettings } from "@/hooks/use-table-settings"
import { useSortState } from "@/hooks/use-sort-state"
import { Product } from "@/lib/types/crm"
import { PropertyHistoryPanel } from "@/components/crm/PropertyHistoryPanel"

const DEFAULT_PRODUCT_COLUMNS = ["name", "sku", "unit_price", "status", "created_at"]

const productSortFields: SortField[] = [
  { value: "name", label: "Name" },
  { value: "sku", label: "SKU" },
  { value: "unit_price", label: "Unit Price" },
  { value: "status", label: "Status" },
  { value: "product_folder", label: "Folder" },
  { value: "created_at", label: "Created" },
]

export default function ProductsPage() {
  const [activeTab, setActiveTab] = React.useState("all")
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(true)
  const [summaryFilter, setSummaryFilter] = React.useState<string | null>(null)

  const [historyProduct, setHistoryProduct] = React.useState<Product | null>(null)
  const [historyOpen, setHistoryOpen] = React.useState(false)

  const productStats: SummaryStat<Product>[] = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of products) {
      const key = item.name?.toLowerCase().trim() || ""
      if (key) counts.set(key, (counts.get(key) || 0) + 1)
    }
    const duplicateKeys = new Set<string>()
    for (const [key, count] of counts) {
      if (count > 1) duplicateKeys.add(key)
    }

    return [
      { key: "all", label: "products", filterFn: () => true },
      { key: "archived", label: "archived", color: "text-badge-warning-text", filterFn: (p) => (p.status || "").toLowerCase() === 'archived' },
      { key: "no_sku", label: "no SKU", filterFn: (p) => !p.sku },
      { key: "duplicates", label: "duplicates", color: "text-destructive", filterFn: (p) => {
        const name = p.name?.toLowerCase().trim()
        if (!name) return false
        return duplicateKeys.has(name)
      }},
    ]
  }, [products])

  const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [bulkEditOpen, setBulkEditOpen] = React.useState(false)
  const [createTaskOpen, setCreateTaskOpen] = React.useState(false)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
  const [columnEditorOpen, setColumnEditorOpen] = React.useState(false)
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>(DEFAULT_PRODUCT_COLUMNS)

  const handleRowClick = React.useCallback((product: any) => setSelectedProduct(product), [])

  const handleColumnSave = React.useCallback((cols: ColumnItem[]) => {
    const newIds = cols.filter(c => c.visible).map(c => c.id)
    setVisibleColumns(newIds)
  }, [])

  const { sortBy, sortDir, handleSortChange } = useSortState({ storageKey: "crm_products_sort" })
  const { workspaceId, user } = useAuth()
  const { canCreateProduct, canDeleteProduct, canEditProduct, canCreateTask } = usePermissions()
  const { properties } = useProperties("product")
  const { tableSettings, handleTableSettingsChange } = useTableSettings()

  const [tabsConfig, setTabsConfig] = React.useState<{ id: string; label: string; closable: boolean; color?: string }[]>(() => {
    if (typeof window === 'undefined') {
      return [
        { id: "all", label: "All products", closable: false },
        { id: "active", label: "Active", closable: true },
        { id: "archived", label: "Archived", closable: true },
      ]
    }
    try {
      const saved = localStorage.getItem("crm_product_tabs")
      return saved ? JSON.parse(saved) : [
        { id: "all", label: "All products", closable: false },
        { id: "active", label: "Active", closable: true },
        { id: "archived", label: "Archived", closable: true },
      ]
    } catch {
      return [
        { id: "all", label: "All products", closable: false },
        { id: "active", label: "Active", closable: true },
        { id: "archived", label: "Archived", closable: true },
      ]
    }
  })

  const {
    filters,
    activeFilterCount,
    sidebarOpen,
    setSidebarOpen,
    updateSearch,
    toggleProperty,
    updateNumber,
    clearAll,
    removeAdvancedFilter,
    addAdvancedFilter,
  } = useCrmFilters()

  React.useEffect(() => {
    async function loadProducts() {
      if (!workspaceId) return
      setLoading(true)
      try {
        const { data } = await productsService.getAll({
          workspace_id: workspaceId,
          search: filters.search || undefined,
          sortBy,
          sortDir,
          limit: 100,
          properties: filters.properties,
          status: (filters.properties["status"] as any) || undefined,
          productFolder: (filters.properties["productFolder"] as any) || undefined,
        })
        setProducts(data || [])
      } catch {
        toast.error("Failed to load products")
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [refreshKey, workspaceId, filters.search, filters.properties, activeTab, sortBy, sortDir])

  const allStatuses = React.useMemo(
    () => Array.from(new Set(products.map((p) => p.status))).sort(),
    [products]
  )

  const filteredData = React.useMemo(() => {
    return products.filter((product) => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !product.name.toLowerCase().includes(q) &&
          !(product.sku || "").toLowerCase().includes(q)
        ) {
          return false
        }
      }

      const selectedStatuses = filters.properties["status"] || []
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(product.status)) return false

      const selectedFolders = filters.properties["productFolder"] || []
      if (selectedFolders.length > 0 && !selectedFolders.includes(product.product_folder || "")) return false

      return true
    })
  }, [filters, products])

  const summaryFilteredData = React.useMemo(() => {
    if (!summaryFilter) return filteredData
    const stat = productStats.find(s => s.key === summaryFilter)
    if (!stat) return filteredData
    return filteredData.filter(stat.filterFn)
  }, [filteredData, summaryFilter, productStats])

  const propertyGroups = React.useMemo(() => propertiesToGroups(properties), [properties])

  const allPossibleColumns = React.useMemo(() => {
    const map = new Map<string, ColumnDef<any>>()
    columns.forEach(col => {
      const id = col.id || (col as any).accessorKey
      if (id) map.set(id, col)
    })
    propertiesToColumnDefs(properties as any).forEach(col => {
      if (col.id && !map.has(col.id)) map.set(col.id, col)
    })
    return map
  }, [properties])

  const allColumnOptions = React.useMemo(() => {
    const seen = new Set<string>()
    const allPotential: ColumnItem[] = []
    columns.forEach(col => {
      const colId = col.id || (col as any).accessorKey
      if (!colId || seen.has(colId)) return
      seen.add(colId)
      allPotential.push({ id: colId, label: (col as any).header || colId, visible: visibleColumns.includes(colId) })
    })
    propertyGroups.forEach(group => {
      group.items.forEach(prop => {
        if (!seen.has(prop.id)) {
          seen.add(prop.id)
          allPotential.push({ id: prop.id, label: prop.label, visible: visibleColumns.includes(prop.id) })
        }
      })
    })
    const visible = visibleColumns.map(id => allPotential.find(c => c.id === id)).filter((c): c is ColumnItem => !!c)
    const hidden = allPotential.filter(c => !visibleColumns.includes(c.id))
    return [...visible, ...hidden]
  }, [visibleColumns, columns, propertyGroups])

  const tableColumns = React.useMemo(() => {
    const visIds = new Set(visibleColumns)
    return [...allPossibleColumns.values()].filter(col => {
      const id = col.id || (col as any).accessorKey
      return id && visIds.has(id)
    }) as ColumnDef<any>[]
  }, [allPossibleColumns, visibleColumns])

  const {
    selectedIds, selectedItems, toggleOne,
    clearSelection, count
  } = useBulkSelection(filteredData)

  const tabItems = tabsConfig.map(tab => ({
    ...tab,
    count: activeTab === tab.id ? products.length : undefined,
  }))

  const handleTabClose = (id: string) => {
    const newTabs = tabsConfig.filter(t => t.id !== id)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_product_tabs", JSON.stringify(newTabs))
    if (activeTab === id) setActiveTab("all")
  }

  const handleTabReorder = (newTabs: { id: string; label: string; closable?: boolean; color?: string }[]) => {
    const persisted = newTabs.map(({ id, label, closable, color }) => ({ id, label, closable: closable ?? false, color }))
    setTabsConfig(persisted)
    localStorage.setItem("crm_product_tabs", JSON.stringify(persisted))
  }

  const handleTabRename = (id: string, newName: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, label: newName } : t)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_product_tabs", JSON.stringify(newTabs))
    toast.success(`View renamed to "${newName}"`)
  }

  const handleTabColorChange = (id: string, color: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, color: color || undefined } : t)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_product_tabs", JSON.stringify(newTabs))
    toast.success("Color updated")
  }

  const handleAddTab = () => {
    const name = prompt("Enter view name:")
    if (!name) return
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const newTabs = [...tabsConfig, { id, label: name, closable: true }]
    setTabsConfig(newTabs)
    localStorage.setItem("crm_product_tabs", JSON.stringify(newTabs))
    setActiveTab(id)
  }

  const PRODUCT_FOLDERS = ["Software", "Hardware", "Services"]

  const activeFilters: GenericActiveFilter[] = [
    {
      id: "status",
      label: "Status",
      type: "searchable-property",
      options: allStatuses,
      value: filters.properties["status"] || [],
      onChange: (val) => toggleProperty("status", val),
    },
    {
      id: "productFolder",
      label: "Product folder",
      type: "searchable-property",
      options: PRODUCT_FOLDERS,
      value: filters.properties["productFolder"] || [],
      onChange: (val) => toggleProperty("productFolder", val),
    },
  ]

  const sidebarConfig: SidebarFilterConfig[] = React.useMemo(() => {
    const base: SidebarFilterConfig[] = [
      { id: "name", label: "Product name", type: "text" },
      { id: "sku", label: "SKU", type: "text" },
      { id: "status", label: "Status", type: "property", options: allStatuses },
      { id: "productFolder", label: "Product folder", type: "property", options: PRODUCT_FOLDERS },
      { id: "createDate", label: "Create date", type: "date" },
    ]
    const propertyFilters = buildPropertySidebarFilters(properties)
    if (propertyFilters.length > 0) {
      return [...base, ...propertyFilters]
    }
    return base
  }, [allStatuses, properties])

  const handleUpdateCell = async (product: any, columnId: string, value: any) => {
    if (!canEditProduct) { toast.error("You don't have permission to edit products"); return }
    try {
      const updates: any = { [columnId]: value }

      if (columnId === 'unit_price') {
        const num = parseFloat(String(value).replace(/[^0-9.-]+/g, ""))
        if (isNaN(num)) throw new Error("Invalid price format")
        updates[columnId] = num
      }

      await productsService.update(product.id, updates, workspaceId!)
      toast.success("Product updated")
      setRefreshKey(k => k + 1)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update product")
    }
  }

  const handleBulkDelete = async () => {
    if (!canDeleteProduct) return
    try {
      const results = await Promise.allSettled(selectedItems.map(p => productsService.delete(p.id, workspaceId!)))
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        toast.error(`Failed to delete ${failed.length} product${failed.length > 1 ? 's' : ''}`)
      }
      const succeeded = results.length - failed.length
      if (succeeded > 0) toast.success(`Deleted ${succeeded} product${succeeded > 1 ? 's' : ''}`)
      clearSelection()
      setRefreshKey(k => k + 1)
    } catch {
      toast.error("Failed to delete products")
    }
  }

  const handleBulkExport = () => {
    const exportData = selectedItems.map(p => ({
      "Name": p.name,
      "SKU": p.sku || "",
      "Unit Price": p.unit_price,
      "Status": p.status,
      "Folder": p.product_folder || "",
    }))
    exportToCSV(exportData, `products-export-${Date.now()}.csv`)
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Product',
        subcategory: 'Products Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success(`Exported ${count} products`)
  }

  const exportColumns = React.useMemo<ExportColumn[]>(() => {
    const labels: Record<string, string> = {
      name: "Name", sku: "SKU", unit_price: "Unit Price",
      status: "Status", product_folder: "Folder", created_at: "Created",
    }
    const ids = ["name", "sku", "unit_price", "status", "product_folder", "created_at"]
    const standard = ids.map(id => ({ id, label: labels[id] || id, visible: true }))
    const custom = properties
      .filter(p => !p.is_archived)
      .map(p => ({ id: `cf_${p.name}`, label: p.label || p.name, visible: false }))
    return [...standard, ...custom]
  }, [properties])

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
    const fieldMap: Record<string, (p: any) => unknown> = {
      name: (p) => p.name,
      sku: (p) => p.sku || "",
      unit_price: (p) => p.unit_price,
      status: (p) => p.status,
      product_folder: (p) => p.product_folder || "",
      created_at: (p) => p.created_at,
      ...Object.fromEntries(
        properties.filter(p => !p.is_archived).map(prop => [
          `cf_${prop.name}`,
          (p: any) => p.custom_fields?.[prop.name] ?? ""
        ])
      ),
    }
    const exportData = source.map((p) => {
      const row: Record<string, unknown> = {}
      for (const id of columnIds) {
        const accessor = fieldMap[id]
        row[labelOf(id)] = accessor ? accessor(p) : (p as any)[id] ?? ""
      }
      return row
    })
    const date = new Date().toISOString().slice(0, 10)
    exportToCSV(exportData, `products_${date}.csv`)
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Product',
        subcategory: 'Products Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success(`Exported ${exportData.length} products`)
  }

  const bulkEditFields: BulkEditField[] = React.useMemo(() => [
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "Active", label: "Active" },
        { value: "Archived", label: "Archived" },
      ],
    },
    {
      id: "unit_price",
      label: "Unit Price",
      type: "number",
      placeholder: "Enter new price",
    },
  ], [])

  const handleBulkEditUpdate = async (updates: Record<string, any>) => {
    try {
      const results = await Promise.allSettled(
        selectedItems.map(p => productsService.update(p.id, updates as any, workspaceId!))
      )
      const failed = results.filter(r => r.status === 'rejected')
      const succeeded = results.length - failed.length
      if (failed.length > 0) {
        toast.error(`Failed to update ${failed.length} product${failed.length > 1 ? 's' : ''}`)
      }
      if (succeeded > 0) {
        toast.success(`Updated ${succeeded} product${succeeded > 1 ? 's' : ''}`)
      }
      return { success: succeeded, failed: failed.length }
    } catch {
      toast.error('Failed to update products')
      return { success: 0, failed: selectedItems.length }
    }
  }

  return (
    <CrmPageLayout>
      <CrmPageHeader 
        title="Products" 
        icon={<ShoppingBag className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            {canCreateProduct && (
              <Button 
                onClick={() => setIsCreateSheetOpen(true)}
                className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 gap-2 border-0 shadow-sm transition-all active:scale-95"
              >
                Create product
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
        placeholder="Search products..." 
        searchValue={filters.search}
        onSearchChange={updateSearch}
        activeFilters={activeFilters}
        onClearAll={clearAll}
        activeFilterCount={activeFilterCount}
        onAdvancedFilterClick={() => setSidebarOpen(true)}
        onExportClick={() => setExportOpen(true)}
        onEditColumnsClick={() => setColumnEditorOpen(true)}
        sortFields={productSortFields}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={handleSortChange}
        tableSettings={tableSettings}
        onTableSettingsChange={handleTableSettingsChange}
      />

       <CrmPageContent
         inlinePanel={
           <RecordPreviewPanel
             recordType="product"
             recordId={selectedProduct?.id || null}
             open={!!selectedProduct}
             onOpenChange={(open) => !open && setSelectedProduct(null)}
             onSuccess={() => setRefreshKey(k => k + 1)}
           />
         }
       >
          <div className="p-2 flex-1 min-h-0 flex flex-col">
           <div className="bg-card rounded-xl border border-border/60 overflow-hidden flex-1 flex flex-col min-h-0">
               {!loading && products.length > 0 && (
                <SummaryStatsBar
                  data={filteredData}
                  stats={productStats}
                  activeFilter={summaryFilter}
                  onFilterChange={setSummaryFilter}
                />
              )}
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <CrmTableSkeleton columnCount={12} rowCount={4} />
                </div>
              ) : products.length === 0 ? (
               <div className="flex-1 flex items-center justify-center">
                 <CrmEmptyState
                   title="No products in catalog yet"
                   description="Add your first product to start building your catalog."
                   icon={Package}
                   actionLabel={canCreateProduct ? "Add product" : undefined}
                   onAction={canCreateProduct ? () => setIsCreateSheetOpen(true) : undefined}
                 />
               </div>
             ) : filteredData.length === 0 ? (
               <div className="flex-1 flex items-center justify-center">
                 <CrmEmptyState
                   title="No products found"
                   description="We couldn't find any products matching your criteria. Try adjusting your filters or search query."
                   icon={Package}
                   actionLabel="Clear Filters"
                   onAction={clearAll}
                 />
               </div>
             ) : (
                <CrmDataTable 
                 columns={tableColumns} 
                 data={summaryFilteredData} 
                 onUpdateCell={handleUpdateCell}
                 selectedIds={selectedIds}
                 onToggleOne={toggleOne}
                 entityName="product"
  hideFullPageAction
                 onRowClick={handleRowClick}
                 onHistoryClick={(item) => {
                   setHistoryProduct(item)
                   setHistoryOpen(true)
                 }}
                 tableSettings={tableSettings}
               />
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

      <CreateProductSheet 
        open={isCreateSheetOpen} 
        onOpenChange={setIsCreateSheetOpen}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />

      <CrmColumnEditor
        open={columnEditorOpen}
        onOpenChange={setColumnEditorOpen}
        columns={allColumnOptions}
        propertyGroups={propertyGroups}
        onSave={handleColumnSave}
        onCreateProperty={() => {}}
        title="Edit product columns"
      />

      {count > 0 && (canDeleteProduct || canEditProduct) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <BulkActionToolbar
            count={count}
            entityName="product"
            onDelete={handleBulkDelete}
            onExport={handleBulkExport}
            onEdit={canEditProduct ? () => setBulkEditOpen(true) : undefined}
            onCreateTask={canCreateTask ? () => setCreateTaskOpen(true) : undefined}
            onClear={clearSelection}
          />
        </div>
      )}

      <BulkEditSheet
        open={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        onSaved={() => { clearSelection(); setRefreshKey(k => k + 1) }}
        entityName="product"
        count={count}
        fields={bulkEditFields}
        onBulkUpdate={handleBulkEditUpdate}
      />

      <ExportSlideOver
        open={exportOpen}
        onOpenChange={setExportOpen}
        entityLabel="Products"
        columns={exportColumns}
        totalCount={products.length}
        filteredCount={filteredData.length}
        selectedCount={count}
        hasActiveFilter={activeFilterCount > 0}
        onExport={handleExportSlideOver}
      />

      {selectedItems.length > 0 && workspaceId && (
        <TaskEditorSheet
          open={createTaskOpen}
          onClose={() => setCreateTaskOpen(false)}
          onSaved={() => { clearSelection(); setRefreshKey(k => k + 1) }}
          entityType="deal"
          entityId={selectedItems[0]?.id || ""}
          workspaceId={workspaceId}
        />
      )}

      <PropertyHistoryPanel
        entityType="product"
        entityId={historyProduct?.id ?? null}
        entityTitle={historyProduct?.name || undefined}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </CrmPageLayout>
  )
}
