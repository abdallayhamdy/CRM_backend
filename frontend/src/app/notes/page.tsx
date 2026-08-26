"use client"

import * as React from "react"
import { FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { format } from "date-fns"

import { CrmPageLayout, CrmPageHeader, CrmPageContent } from "@/components/crm/CrmPageLayout"
import { CrmTableSkeleton } from "@/components/crm/Skeletons"
import { CrmDataTable } from "@/components/crm/CrmDataTable"
import { CrmFilterBar, GenericActiveFilter } from "@/components/crm/CrmFilterBar"
import { CrmTabs } from "@/components/crm/CrmTabs"
import { CrmFilterSidebar, SidebarFilterConfig } from "@/components/crm/CrmFilterSidebar"
import { CrmEmptyState } from "@/components/crm/CrmEmptyState"
import { CrmColumnEditor, ColumnItem } from "@/components/crm/CrmColumnEditor"
import { useCrmFilters } from "@/hooks/use-crm-filters"
import { SortField } from "@/components/crm/SortPopover"
import { SummaryStatsBar, type SummaryStat } from "@/components/crm/SummaryStatsBar"
import { ExportSlideOver, ExportColumn, ExportFormat, ExportScope } from "@/components/crm/ExportSlideOver"
import { useTableSettings } from "@/hooks/use-table-settings"
import { useSortState } from "@/hooks/use-sort-state"

import { notesService } from "@/services/notes"
import { Note } from "@/lib/types/crm"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { usePermissions } from "@/hooks/use-permissions"
import { exportToCSV } from "@/lib/utils"
import { logAudit } from "@/lib/audit"

import { CreateNoteSheet } from "./create-note-sheet"
import { NotePreviewSheet } from "./preview-sheet"

const NOTE_SORT_FIELDS: SortField[] = [
  { value: "created_at", label: "Create date" },
  { value: "updated_at", label: "Update date" },
]

export default function NotesPage() {
  const [notes, setNotes] = React.useState<Note[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedNote, setSelectedNote] = React.useState<Note | null>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("all")
  const { sortBy, sortDir, handleSortChange } = useSortState({ storageKey: "crm_notes_sort" })
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)
  const [perPage] = React.useState(25)
  const [summaryFilter, setSummaryFilter] = React.useState<string | null>(null)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [columnEditorOpen, setColumnEditorOpen] = React.useState(false)
  const [visibleColumns, setVisibleColumns] = React.useState<ColumnItem[]>([
    { id: "content", label: "Note", visible: true },
    { id: "author", label: "Author", visible: true },
    { id: "created_at", label: "Created", visible: true },
  ])
  const { workspaceId, user } = useAuth()
  const router = useRouter()
  const { canCreateNote } = usePermissions()
  const { tableSettings, handleTableSettingsChange } = useTableSettings()

  const totalPages = Math.ceil(totalCount / perPage)
  const from = (currentPage - 1) * perPage
  const to = from + perPage - 1

  const noteStats: SummaryStat<Note>[] = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of notes) {
      const key = item.content?.trim() || ""
      if (key) counts.set(key, (counts.get(key) || 0) + 1)
    }
    const duplicateKeys = new Set<string>()
    for (const [key, count] of counts) {
      if (count > 1) duplicateKeys.add(key)
    }

    return [
      { key: "all", label: "notes", filterFn: () => true },
      { key: "linked", label: "linked", filterFn: (n) => !!(n.contact_id || n.company_id || n.deal_id || n.ticket_id) },
      { key: "unlinked", label: "unlinked", color: "text-badge-warning-text", filterFn: (n) => !(n.contact_id || n.company_id || n.deal_id || n.ticket_id) },
      { key: "duplicates", label: "duplicates", color: "text-destructive", filterFn: (n) => {
        const content = n.content?.trim()
        if (!content) return false
        return duplicateKeys.has(content)
      }},
    ]
  }, [notes])

  const tabsConfig = [
    { id: "all", label: "All notes", closable: false },
    { id: "mine", label: "My notes", closable: true },
  ]

  const [tabLabels, setTabLabels] = React.useState<Record<string, string>>({})
  const [tabColors, setTabColors] = React.useState<Record<string, string>>({})

  const tabItems = tabsConfig.map(tab => ({
    ...tab,
    label: tabLabels[tab.id] || tab.label,
    color: tabColors[tab.id],
  }))

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

  const dateRangeParams = React.useMemo(() => {
    const range = filters.dateRanges["createDate"]
    if (!range || range === "all") return {}
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    switch (range) {
      case "today": return { created_from: today, created_to: today }
      case "yesterday": {
        const y = new Date(now)
        y.setDate(now.getDate() - 1)
        const ys = fmt(y)
        return { created_from: ys, created_to: ys }
      }
      case "this_week": return { created_from: fmt(startOfWeek), created_to: today }
      case "last_7_days": {
        const d = new Date(now)
        d.setDate(now.getDate() - 7)
        return { created_from: fmt(d), created_to: today }
      }
      case "last_30_days": {
        const d = new Date(now)
        d.setDate(now.getDate() - 30)
        return { created_from: fmt(d), created_to: today }
      }
      case "last_90_days": {
        const d = new Date(now)
        d.setDate(now.getDate() - 90)
        return { created_from: fmt(d), created_to: today }
      }
      case "this_month": return { created_from: fmt(startOfMonth), created_to: today }
      case "last_month": return { created_from: fmt(startOfLastMonth), created_to: fmt(endOfLastMonth) }
      default: return {}
    }
  }, [filters.dateRanges])

  const fetchNotes = React.useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const { data, error, meta } = await notesService.getAll({
        workspace_id: workspaceId,
        search: filters.search || filters.properties["content"]?.[0] || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        user_id: activeTab === "mine" && user?.id ? user.id : undefined,
        ...dateRangeParams,
        limit: perPage,
        page: currentPage,
      })
      if (error) throw error
      setNotes((data || []) as Note[])
      setTotalCount(meta?.total ?? 0)
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch notes")
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, filters, dateRangeParams, sortBy, sortDir, currentPage, perPage, activeTab, user])

  React.useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const handleSortWithPageReset = React.useCallback((field: string, dir: "asc" | "desc") => {
    handleSortChange(field, dir)
    setCurrentPage(1)
  }, [handleSortChange])

  const handleTabChange = React.useCallback((id: string) => {
    setActiveTab(id)
    setCurrentPage(1)
  }, [])

  const handleColumnSave = React.useCallback((cols: ColumnItem[]) => {
    setVisibleColumns(cols)
  }, [])

  const summaryFilteredData = React.useMemo(() => {
    if (!summaryFilter) return notes
    const stat = noteStats.find(s => s.key === summaryFilter)
    if (!stat) return notes
    return notes.filter(stat.filterFn)
  }, [notes, summaryFilter, noteStats])

  const exportColumns: ExportColumn[] = [
    { id: "content", label: "Note", visible: true },
    { id: "author", label: "Author", visible: true },
    { id: "created_at", label: "Created", visible: true },
  ]

  const handleExportSlideOver = (format: ExportFormat, columnIds: string[], scope: ExportScope) => {
    if (format !== "csv") {
      toast.info("Only CSV export is supported in this client-side build")
    }
    const source = summaryFilteredData
    if (!source || source.length === 0) {
      toast.error("Nothing to export")
      return
    }
    const labelOf = (id: string) => exportColumns.find(c => c.id === id)?.label || id
    const fieldMap: Record<string, (n: Note) => unknown> = {
      content: (n) => n.content,
      author: (n) => n.author ? `${n.author.first_name ?? ""} ${n.author.last_name ?? ""}`.trim() : "",
      created_at: (n) => n.created_at,
    }
    const exportData = source.map((n) => {
      const row: Record<string, unknown> = {}
      for (const id of columnIds) {
        const accessor = fieldMap[id]
        row[labelOf(id)] = accessor ? accessor(n) : ""
      }
      return row
    })
    const date = new Date().toISOString().slice(0, 10)
    exportToCSV(exportData, `notes_${date}.csv`)
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: 'Export',
        category: 'Note',
        subcategory: 'Notes Exported',
        source: 'web',
        modifiedBy: user,
      })
    }
    toast.success(`Exported ${exportData.length} notes`)
  }

  const activeFilters: GenericActiveFilter[] = [
    {
      id: "createDate",
      label: "Create date",
      type: "date",
      value: filters.dateRanges["createDate"] || "all",
      onChange: (val) => updateDateRange("createDate", val as any),
    },
  ]

  const sidebarConfig: SidebarFilterConfig[] = [
    { id: "content", label: "Note content", type: "text" },
    { id: "createDate", label: "Create date", type: "date" },
  ]

  const columns = React.useMemo(() => {
    const allCols = [
      {
        accessorKey: "content",
        header: "Note",
        cell: ({ row }: any) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-status-warning/10 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-status-warning" />
            </div>
            <span className="font-semibold text-foreground truncate max-w-[300px]">
              {row.original.content
                ? (row.original.content.length > 80
                  ? row.original.content.substring(0, 80) + "..."
                  : row.original.content)
                : "Untitled note"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "author",
        header: "Author",
        cell: ({ row }: any) => {
          const author = row.original.author
          return (
            <span className="text-muted-foreground text-sm">
              {author ? `${author.first_name} ${author.last_name}` : "—"}
            </span>
          )
        },
      },
      {
        accessorKey: "created_at",
        header: "Created",
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
    ]
    const visIds = new Set(visibleColumns.filter(c => c.visible).map(c => c.id))
    return allCols.filter(col => visIds.has(col.accessorKey))
  }, [visibleColumns])

  return (
    <CrmPageLayout>
      <CrmPageHeader
        title="Notes"
        icon={<FileText className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2">
            {canCreateNote && (
              <Button
                onClick={() => setCreateOpen(true)}
                className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 gap-2 border-0 shadow-sm transition-all active:scale-95"
              >
                Create note
              </Button>
            )}
          </div>
        }
      >
        <CrmTabs
          items={tabItems}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onRenameTab={(id, newName) => {
            setTabLabels(prev => ({ ...prev, [id]: newName }))
            toast.success(`View renamed to "${newName}"`)
          }}
          onColorChangeTab={(id, color) => {
            setTabColors(prev => ({ ...prev, [id]: color }))
            toast.success("Color updated")
          }}
          className="ml-0"
        />
      </CrmPageHeader>

      <CrmFilterBar
        placeholder="Search notes..."
        searchValue={filters.search}
        onSearchChange={updateSearch}
        activeFilters={activeFilters}
        onClearAll={clearAll}
        activeFilterCount={activeFilterCount}
        onAdvancedFilterClick={() => setSidebarOpen(true)}
        onEditColumnsClick={() => setColumnEditorOpen(true)}
        onExportClick={() => setExportOpen(true)}
        sortFields={NOTE_SORT_FIELDS}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={handleSortWithPageReset}
        tableSettings={tableSettings}
        onTableSettingsChange={handleTableSettingsChange}
      />

      <CrmPageContent>
        <div className="p-2 h-full flex flex-col">
          <div className="bg-background rounded-xl border border-border/60 overflow-hidden shadow-sm flex-1 flex flex-col">
            {isLoading ? (
              <CrmTableSkeleton columnCount={3} rowCount={10} />
            ) : notes.length === 0 ? (
              <div className="p-6">
                  <CrmEmptyState
                    title="No notes yet"
                    description="Create your first note to get started. Notes can be associated with contacts, companies, or deals."
                    icon={FileText}
                    actionLabel={canCreateNote ? "Create note" : undefined}
                    onAction={canCreateNote ? () => setCreateOpen(true) : undefined}
                  />
              </div>
            ) : (
              <>
                <SummaryStatsBar
                  data={notes}
                  stats={noteStats}
                  activeFilter={summaryFilter}
                  onFilterChange={setSummaryFilter}
                />
                <div className="flex-1 overflow-auto">
                  <CrmDataTable
                    columns={columns}
                    data={summaryFilteredData}
                    onRowClick={(note) => {
                      router.push(`/notes/${note.id}`)
                    }}
                    entityName="note"
                    hidePreviewActions
                    tableSettings={tableSettings}
                  />
                </div>

                {totalCount > perPage && (
                  <div className="flex items-center justify-between gap-4 py-4 border-t border-border px-4">
                    <span className="text-[13px] text-muted-foreground">
                      {totalCount === 0 ? 0 : from + 1}–{Math.min(to + 1, totalCount)} of {totalCount} notes
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage <= 1 || isLoading}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Prev
                      </Button>
                      <span className="text-[13px] text-muted-foreground">
                        Page {currentPage} of {totalPages || 1}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages || isLoading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CrmPageContent>

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

      <NotePreviewSheet
        note={selectedNote}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onSuccess={fetchNotes}
      />

      <CreateNoteSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchNotes}
      />

      <CrmColumnEditor
        open={columnEditorOpen}
        onOpenChange={setColumnEditorOpen}
        columns={visibleColumns}
        onSave={handleColumnSave}
        title="Edit columns"
        description="Choose which columns to show in your table and their order."
      />

      <ExportSlideOver
        open={exportOpen}
        onOpenChange={setExportOpen}
        entityLabel="Notes"
        columns={exportColumns}
        totalCount={totalCount}
        filteredCount={notes.length}
        selectedCount={0}
        hasActiveFilter={activeFilterCount > 0}
        onExport={handleExportSlideOver}
      />
    </CrmPageLayout>
  )
}
