"use client"

import * as React from "react"
import { FolderOpen, Plus, Download, Folder, Trash2, Pencil, Link2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { format } from "date-fns"
import NextLink from "next/link"

// Generic CRM Components
import { CrmPageLayout, CrmPageHeader, CrmPageContent } from "@/components/crm/CrmPageLayout"
import { ExportSlideOver, ExportColumn, ExportFormat, ExportScope } from "@/components/crm/ExportSlideOver"
import { CrmTabs } from "@/components/crm/CrmTabs"
import { CrmDataTable } from "@/components/crm/CrmDataTable"
import { CrmFilterBar, GenericActiveFilter } from "@/components/crm/CrmFilterBar"
import { CrmFilterSidebar, SidebarFilterConfig } from "@/components/crm/CrmFilterSidebar"
import { CrmEmptyState } from "@/components/crm/CrmEmptyState"
import { getBadgeClasses } from "@/lib/badge-colors"
import { useCrmFilters } from "@/hooks/use-crm-filters"
import { SummaryStatsBar, type SummaryStat } from "@/components/crm/SummaryStatsBar"
import { UploadDocumentSheet } from "@/components/documents/UploadDocumentSheet"
import { documentsService } from "@/services/documents"
import { useAuth } from "@/hooks/use-auth"
import { usePermissions } from "@/hooks/use-permissions"
import { Skeleton } from "@/components/ui/skeleton"
import { usePanelCards } from "@/hooks/use-panel-cards"
import { logAudit } from "@/lib/audit"
import { Input } from "@/components/ui/input"

const DOC_TYPES = ["Proposal", "Contract", "Invoice", "General"]

export default function DocumentsPage() {
  const { workspaceId, user } = useAuth()
  const { canCreateDocument, canEditDocument, canDeleteDocument } = usePermissions()
  const { tableSettings, saveTableSettings } = usePanelCards("documents" as any)
  const [activeTab, setActiveTab] = React.useState("all")
  const [docs, setDocs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [summaryFilter, setSummaryFilter] = React.useState<string | null>(null)
  const [isUploadSheetOpen, setIsUploadSheetOpen] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [renamingId, setRenamingId] = React.useState<string | null>(null)
  const [renameValue, setRenameValue] = React.useState("")

  const docStats: SummaryStat<any>[] = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of docs) {
      const key = item.name?.toLowerCase().trim() || ""
      if (key) counts.set(key, (counts.get(key) || 0) + 1)
    }
    const duplicateKeys = new Set<string>()
    for (const [key, count] of counts) {
      if (count > 1) duplicateKeys.add(key)
    }

    return [
      { key: "all", label: "documents", filterFn: () => true },
      { key: "no_type", label: "no type", color: "text-badge-warning-text", filterFn: (d: any) => !d.type },
      { key: "duplicates", label: "duplicates", color: "text-destructive", filterFn: (d: any) => {
        const name = d.name?.toLowerCase().trim()
        if (!name) return false
        return duplicateKeys.has(name)
      }},
    ]
  }, [docs])

  const [tabsConfig, setTabsConfig] = React.useState<{ id: string; label: string; closable: boolean; color?: string }[]>(() => {
    if (typeof window === 'undefined') {
      return [
        { id: "all", label: "All documents", closable: false },
        { id: "proposal", label: "Proposals", closable: true },
        { id: "contract", label: "Contracts", closable: true },
      ]
    }
    try {
      const saved = localStorage.getItem("crm_document_tabs")
      return saved ? JSON.parse(saved) : [
        { id: "all", label: "All documents", closable: false },
        { id: "proposal", label: "Proposals", closable: true },
        { id: "contract", label: "Contracts", closable: true },
      ]
    } catch {
      return [
        { id: "all", label: "All documents", closable: false },
        { id: "proposal", label: "Proposals", closable: true },
        { id: "contract", label: "Contracts", closable: true },
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
    updateDateRange,
    updateNumber,
    clearAll,
    removeAdvancedFilter,
    addAdvancedFilter,
  } = useCrmFilters()

  React.useEffect(() => {
    async function loadDocs() {
      if (!workspaceId) return
      setLoading(true)
      try {
        const { data } = await documentsService.getAll({ workspace_id: workspaceId })
        setDocs(data || [])
      } catch {
        toast.error("Failed to load documents")
      } finally {
        setLoading(false)
      }
    }
    loadDocs()
  }, [workspaceId, refreshKey])

  const filteredData = React.useMemo(() => {
    return docs.filter((doc) => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !doc.name?.toLowerCase().includes(q) &&
          !doc.type?.toLowerCase().includes(q) &&
          !doc.mime_type?.toLowerCase().includes(q)
        ) return false
      }
      const selectedTypes = filters.properties["type"] || []
      if (selectedTypes.length > 0 && !selectedTypes.includes(doc.type)) return false

      return true
    })
  }, [docs, filters])

  const summaryFilteredData = React.useMemo(() => {
    if (!summaryFilter) return filteredData
    const stat = docStats.find(s => s.key === summaryFilter)
    if (!stat) return filteredData
    return filteredData.filter(stat.filterFn)
  }, [filteredData, summaryFilter, docStats])

  const exportColumns = React.useMemo<ExportColumn[]>(() => [
    { id: "name", label: "Name", visible: true },
    { id: "type", label: "Type", visible: true },
    { id: "size", label: "Size", visible: true },
    { id: "created_at", label: "Uploaded", visible: true },
  ], [])

  const handleExportSlideOver = (_format: ExportFormat, _columnIds: string[], _scope: ExportScope) => {
    // Stub: in production, would generate file server-side or via client library
  }

  const tabItems = tabsConfig.map(tab => ({
    ...tab,
    count: activeTab === tab.id ? filteredData.length : undefined,
  }))

  const handleTabClose = (id: string) => {
    const newTabs = tabsConfig.filter(t => t.id !== id)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_document_tabs", JSON.stringify(newTabs))
    if (activeTab === id) setActiveTab("all")
  }

  const handleTabReorder = (newTabs: { id: string; label: string; closable?: boolean; color?: string }[]) => {
    const persisted = newTabs.map(({ id, label, closable, color }) => ({ id, label, closable: closable ?? false, color }))
    setTabsConfig(persisted)
    localStorage.setItem("crm_document_tabs", JSON.stringify(persisted))
  }

  const handleTabRename = (id: string, newName: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, label: newName } : t)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_document_tabs", JSON.stringify(newTabs))
    toast.success(`View renamed to "${newName}"`)
  }

  const handleTabColorChange = (id: string, color: string) => {
    const newTabs = tabsConfig.map(t => t.id === id ? { ...t, color: color || undefined } : t)
    setTabsConfig(newTabs)
    localStorage.setItem("crm_document_tabs", JSON.stringify(newTabs))
    toast.success("Color updated")
  }

  const handleAddTab = () => {
    const name = prompt("Enter view name:")
    if (!name) return
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now()
    const newTabs = [...tabsConfig, { id, label: name, closable: true }]
    setTabsConfig(newTabs)
    localStorage.setItem("crm_document_tabs", JSON.stringify(newTabs))
    setActiveTab(id)
  }

  const tabFilteredData = React.useMemo(() => {
    if (activeTab === "proposal") return summaryFilteredData.filter(d => d.type === "Proposal")
    if (activeTab === "contract") return summaryFilteredData.filter(d => d.type === "Contract")
    return summaryFilteredData
  }, [summaryFilteredData, activeTab])

  const handleDownload = async (doc: any) => {
    try {
      const blob = await documentsService.download(doc.id)
      if (!blob) {
        toast.error("Download URL not available")
        return
      }
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = doc.name || 'document'
      a.click()
      URL.revokeObjectURL(url)
      if (workspaceId) {
        logAudit({
          workspace_id: workspaceId,
          action: 'Download',
          category: 'Document',
          subcategory: 'Document Downloaded',
          source: 'web',
          modifiedBy: user,
        })
      }
    } catch {
      toast.error("Download failed")
    }
  }

  const handleDelete = async (doc: any) => {
    if (!confirm(`Delete "${doc.name}"?`)) return

    try {
      await documentsService.delete(doc.id)
      toast.success("Document deleted")
      if (workspaceId) {
        logAudit({
          workspace_id: workspaceId,
          action: 'Delete',
          category: 'Document',
          subcategory: 'Document Deleted',
          source: 'web',
          modifiedBy: user,
        })
      }
      setRefreshKey(k => k + 1)
    } catch (error: unknown) {
      toast.error(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleRename = (doc: any) => {
    setRenamingId(doc.id)
    setRenameValue(doc.name || "")
  }

  const handleRenameSubmit = async (doc: any) => {
    if (!renameValue.trim() || renameValue.trim() === doc.name) {
      setRenamingId(null)
      return
    }
    try {
      await documentsService.update(doc.id, { name: renameValue.trim() } as any)
      toast.success("Document renamed")
      setRenamingId(null)
      setRefreshKey(k => k + 1)
    } catch (err: unknown) {
      toast.error(`Rename failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleCopyLink = (doc: any) => {
    const url = `${window.location.origin}/documents/${doc.id}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied to clipboard")
    }).catch(() => {
      toast.error("Failed to copy link")
    })
  }

  const activeFilters: GenericActiveFilter[] = [
    {
      id: "type",
      label: "Document type",
      type: "simple-property",
      options: DOC_TYPES,
      value: filters.properties["type"] || [],
      onChange: (val) => toggleProperty("type", val),
    },
    {
      id: "createDate",
      label: "Upload date",
      type: "date",
      value: filters.dateRanges["createDate"] || "all",
      onChange: (val) => updateDateRange("createDate", val as any),
    },
  ]

  const sidebarConfig: SidebarFilterConfig[] = [
    { id: "name", label: "Document name", type: "text" },
    { id: "type", label: "Document type", type: "property", options: DOC_TYPES },
    { id: "createDate", label: "Upload date", type: "date" },
  ]

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: any) => {
        const doc = row.original
        if (renamingId === doc.id) {
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Folder className="h-4 w-4 text-primary" />
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); handleRenameSubmit(doc) }}
                className="flex items-center gap-1 flex-1"
              >
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleRenameSubmit(doc)}
                  className="h-7 text-sm font-semibold flex-1"
                  autoFocus
                />
              </form>
            </div>
          )
        }
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Folder className="h-4 w-4 text-primary" />
            </div>
            <NextLink
              href={`/documents/${doc.id}`}
              className="font-semibold text-primary hover:underline truncate max-w-[260px]"
            >
              {doc.name || "Untitled"}
            </NextLink>
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: any) => {
        const type = row.original.type || "General"
        const badgeClass = getBadgeClasses('document_type', type)
        return (
          <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${badgeClass}`}>
            {type}
          </span>
        )
      },
    },
    {
      accessorKey: "size",
      header: "Size",
      cell: ({ row }: any) => {
        const size = row.original.size
        if (!size) return <span className="text-muted-foreground">—</span>
        if (size < 1024) return <span className="text-muted-foreground">{size} B</span>
        if (size < 1024 * 1024) return <span className="text-muted-foreground">{(size / 1024).toFixed(1)} KB</span>
        return <span className="text-muted-foreground">{(size / (1024 * 1024)).toFixed(1)} MB</span>
      },
    },
    {
      accessorKey: "created_at",
      header: "Uploaded",
      cell: ({ row }: any) => {
        try {
          return (
            <span className="text-muted-foreground whitespace-nowrap">
              {format(new Date(row.original.created_at), "MMM d, yyyy")}
            </span>
          )
        } catch {
          return <span className="text-muted-foreground">—</span>
        }
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }: any) => {
        const doc = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 opacity-0 group-hover:opacity-100 transition-all"
              onClick={(e) => {
                e.stopPropagation()
                window.open(`/documents/${doc.id}`, '_blank')
              }}
              title="Open"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/5 opacity-0 group-hover:opacity-100 transition-all"
              onClick={(e) => {
                e.stopPropagation()
                handleDownload(doc)
              }}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            {canEditDocument && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRename(doc)
                }}
                title="Rename"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all"
              onClick={(e) => {
                e.stopPropagation()
                handleCopyLink(doc)
              }}
              title="Copy link"
            >
              <Link2 className="h-4 w-4" />
            </Button>
            {canDeleteDocument && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-all"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(doc)
                }}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const emptyState = (
    <CrmEmptyState
      title="No documents yet"
      description="Upload a proposal, contract, invoice, or other business document to get started."
      icon={FolderOpen}
      actionLabel={canCreateDocument ? "Upload document" : undefined}
      onAction={canCreateDocument ? () => setIsUploadSheetOpen(true) : undefined}
    />
  )

  return (
    <CrmPageLayout>
      <CrmPageHeader
        title="Documents"
        icon={<FolderOpen className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            {canCreateDocument && (
              <Button
                onClick={() => setIsUploadSheetOpen(true)}
                className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 gap-2 border-0 shadow-sm transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Upload document
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

      <div className="flex flex-col flex-1 min-h-0 border border-border rounded-xl overflow-hidden mx-2 mt-2 shadow-sm">
      <CrmFilterBar
        placeholder="Search documents..."
        searchValue={filters.search}
        onSearchChange={updateSearch}
        activeFilters={activeFilters}
        onClearAll={clearAll}
        activeFilterCount={activeFilterCount}
        onAdvancedFilterClick={() => setSidebarOpen(true)}
        onExportClick={() => setExportOpen(true)}
        tableSettings={tableSettings}
        onTableSettingsChange={saveTableSettings}
      />

      <CrmPageContent>
        <div className="p-2 flex-1 min-h-0 flex flex-col">
          <div className="bg-background rounded-xl border border-border/60 overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
            {loading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <SummaryStatsBar
                  data={filteredData}
                  stats={docStats}
                  activeFilter={summaryFilter}
                  onFilterChange={setSummaryFilter}
                />
                <CrmDataTable
                  columns={columns}
                  data={tabFilteredData}
                  emptyState={emptyState}
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

      <UploadDocumentSheet
        open={isUploadSheetOpen}
        onOpenChange={setIsUploadSheetOpen}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />

      <ExportSlideOver
        open={exportOpen}
        onOpenChange={setExportOpen}
        entityLabel="Documents"
        columns={exportColumns}
        totalCount={docs.length}
        filteredCount={filteredData.length}
        selectedCount={0}
        hasActiveFilter={activeFilterCount > 0}
        onExport={handleExportSlideOver}
      />
    </CrmPageLayout>
  )
}
