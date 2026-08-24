"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown, ChevronUp, ChevronsUpDown, History, Loader2, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableSettings, getRowHeightClass } from "@/components/crm/TableSettingsDialog"
import { DataTableRow } from "@/components/crm/DataTableRow"
import { PaginationBar } from "@/components/crm/PaginationBar"
import { SidebarPreviewButton } from "@/components/crm/SidebarPreviewButton"
import { useMediaQuery } from "@/hooks/use-media-query"

const ENTITY_ROUTE_MAP: Record<string, string> = {
  company: "/companies",
  contact: "/contacts",
  deal: "/deals",
  task: "/tasks",
  ticket: "/tickets",
  note: "/notes",
  call: "/calls",
  order: "/orders",
  product: "/products",
}

interface CrmDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onRowClick?: (item: TData) => void
  onUpdateCell?: (row: TData, columnId: string, value: string | number | boolean | null) => Promise<void>
  onEditRow?: (item: TData) => void
  onHistoryClick?: (item: TData) => void
  isLoading?: boolean
  emptyState?: React.ReactNode
  entityName?: string
  selectedIds?: Set<string>
  onToggleOne?: (id: string) => void
  tableSettings?: TableSettings
}

function CrmDataTableInner<TData, TValue>({
  columns,
  data,
  onRowClick,
  onUpdateCell,
  onEditRow,
  onHistoryClick,
  isLoading,
  emptyState,
  entityName = "record",
  selectedIds,
  onToggleOne,
  tableSettings,
}: CrmDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [editingCell, setEditingCell] = React.useState<{ rowIndex: number, columnId: string, value: string } | null>(null)

  const isMobile = useMediaQuery("(max-width: 767px)")

  // Columns flagged meta.hideBelow === 'md' are hidden below md breakpoint
  const mobileHiddenColumns = React.useMemo(() => {
    const vis: VisibilityState = {}
    columns.forEach((col) => {
      const meta = (col as { meta?: { hideBelow?: string } }).meta
      if (meta?.hideBelow === "md" && col.id) vis[col.id] = false
    })
    return vis
  }, [columns])

  const effectiveColumnVisibility: VisibilityState = isMobile
    ? { ...columnVisibility, ...mobileHiddenColumns }
    : columnVisibility

  const onRowClickRef = React.useRef(onRowClick)
  const onUpdateCellRef = React.useRef(onUpdateCell)
  const onEditRowRef = React.useRef(onEditRow)
  const onHistoryClickRef = React.useRef(onHistoryClick)
  const onToggleOneRef = React.useRef(onToggleOne)
  const editingCellRef = React.useRef(editingCell)
  const setEditingCellRef = React.useRef(setEditingCell)

  React.useEffect(() => {
    onRowClickRef.current = onRowClick
    onUpdateCellRef.current = onUpdateCell
    onEditRowRef.current = onEditRow
    onHistoryClickRef.current = onHistoryClick
    onToggleOneRef.current = onToggleOne
    editingCellRef.current = editingCell
    setEditingCellRef.current = setEditingCell
  }, [onRowClick, onUpdateCell, onEditRow, onHistoryClick, onToggleOne, editingCell, setEditingCell])

  // Sync external selectedIds → internal rowSelection
  const syncingFromExternalRef = React.useRef(false)
  React.useEffect(() => {
    if (!selectedIds || !data) return
    const newSelection: Record<number, boolean> = {}
    data.forEach((item: any, idx: number) => {
      if (selectedIds.has(item.id)) {
        newSelection[idx] = true
      }
    })
    syncingFromExternalRef.current = true
    setRowSelection(newSelection)
  }, [selectedIds, data])

  // Sync internal rowSelection changes → external onToggleOne
  const prevRowSelectionRef = React.useRef(rowSelection)
  React.useEffect(() => {
    if (syncingFromExternalRef.current) {
      syncingFromExternalRef.current = false
      prevRowSelectionRef.current = rowSelection
      return
    }

    const old = prevRowSelectionRef.current
    const curr = rowSelection
    prevRowSelectionRef.current = curr

    if (!data || !onToggleOneRef.current) return

    const oldIds = new Set<string>()
    const newIds = new Set<string>()
    Object.keys(old).forEach(k => {
      if (old[Number(k)]) oldIds.add((data[Number(k)] as any)?.id)
    })
    Object.keys(curr).forEach(k => {
      if (curr[Number(k)]) newIds.add((data[Number(k)] as any)?.id)
    })

    // Find toggled items
    for (const id of newIds) {
      if (!oldIds.has(id)) onToggleOneRef.current(id)
    }
    for (const id of oldIds) {
      if (!newIds.has(id)) onToggleOneRef.current(id)
    }
  }, [rowSelection, data])

  // Inject SidebarPreviewButton inside the first data column (after select)
  const columnsWithActions = React.useMemo(() => {
    const routeBase = ENTITY_ROUTE_MAP[entityName] || `/${entityName}`
    return columns.map((col, idx) => {
      if (idx !== 1) return col
      const originalCell = col.cell
      const isEditable = (col as any).meta?.editable
      return {
        ...col,
        cell: (ctx: any) => (
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              {typeof originalCell === 'function' ? originalCell(ctx) : originalCell}
            </div>
            {isEditable && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const meta = ctx.table.options.meta
                  meta?.setEditingCell?.({
                    rowIndex: ctx.row.index,
                    columnId: ctx.column.id,
                    value: String(ctx.getValue() || "")
                  })
                }}
                className="opacity-0 group-hover/cell:opacity-100 transition-opacity cursor-pointer hover:bg-primary/10 rounded p-0.5 shrink-0"
              >
                <svg className="h-3 w-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            <SidebarPreviewButton
              onPreview={(e: React.MouseEvent) => {
                e.stopPropagation()
                ctx.table.options.meta?.onRowClick?.(ctx.row.original)
              }}
              href={`${routeBase}/${(ctx.row.original as any).id}`}
            />
            {onHistoryClickRef.current && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onHistoryClickRef.current?.(ctx.row.original)
                }}
                title="Property history"
                className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground/70 hover:text-primary hover:bg-primary/10 transition-all shrink-0"
              >
                <History className="h-3.5 w-3.5" />
              </button>
            )}
            {onEditRowRef.current && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEditRowRef.current?.(ctx.row.original)
                }}
                title="Edit"
                className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground/70 hover:text-primary hover:bg-primary/10 transition-all shrink-0"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ),
      }
    })
  }, [columns, entityName])

  // Memoize table options to prevent re-renders during column resizing
  const tableOptions = React.useMemo(() => ({
    data,
    columns: columnsWithActions,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    meta: {
      onRowClick: (item: TData) => onRowClickRef.current?.(item),
      onUpdateCell: async (row: TData, columnId: string, value: string | number | boolean | null) => {
        await onUpdateCellRef.current?.(row, columnId, value)
      },
      onEditRow: (item: TData) => onEditRowRef.current?.(item),
      editingCell,
      setEditingCell,
    },
    enableColumnResizing: true,
    columnResizeMode: 'onChange' as const,
    initialState: {
      pagination: {
        pageSize: typeof tableSettings?.pagination === 'number' ? tableSettings.pagination : 25,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility: effectiveColumnVisibility,
      rowSelection,
    },
  }), [data, columns, sorting, columnFilters, effectiveColumnVisibility, rowSelection, tableSettings?.pagination])



  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable(tableOptions)



  const currentPageRows = table.getRowModel().rows
  const totalFilteredRows = table.getFilteredRowModel().rows
  const isInfinite = tableSettings?.pagination === "infinite"
  const rowHeightClass = getRowHeightClass(tableSettings?.rowHeight || "default")

  // When infinite, show all filtered rows
  const displayRows = isInfinite ? totalFilteredRows : currentPageRows

  // Calculate table body content directly to avoid state sync issues
  const tableBodyContent = displayRows?.length ? (
    displayRows.map((row, idx) => (
      <DataTableRow
        key={row.id}
        row={row}
        isSelected={row.getIsSelected()}
        onRowClick={onRowClickRef.current}
        editingCell={editingCell}
        setEditingCell={setEditingCell}
        onUpdateCellRef={onUpdateCellRef}
        className={cn(
          rowHeightClass
        )}
      />
    ))
  ) : (
    <TableRow>
      <TableCell colSpan={columnsWithActions.length} className="p-0 border-0">
        {emptyState ? (
          emptyState
        ) : (
          <div className="h-24 flex items-center justify-center text-muted-foreground font-medium">
            No records found.
          </div>
        )}
      </TableCell>
    </TableRow>
  )

  return (
    <div className="flex flex-col flex-1 min-h-0 relative min-w-0">
      <style jsx global>{`
        .crm-table-resizing {
          will-change: width;
        }
        .crm-table-resizing td,
        .crm-table-resizing th {
          will-change: width;
        }
        .crm-table-striped tbody tr:nth-child(even) {
          background-color: hsl(var(--muted) / 0.7) !important;
        }
        html.dark .crm-table-striped tbody tr:nth-child(even) {
          background-color: hsl(var(--muted) / 0.5) !important;
        }
        .crm-table-striped tbody tr:nth-child(even):hover {
          background-color: hsl(var(--primary) / 0.15) !important;
        }
        html.dark .crm-table-striped tbody tr:nth-child(even):hover {
          background-color: hsl(var(--primary) / 0.2) !important;
        }
        .crm-table-striped tbody tr:nth-child(even)[data-state="selected"] {
          background-color: hsl(var(--primary) / 0.05) !important;
        }
        .crm-table tbody tr:not(:last-child) td {
          border-bottom: 1px solid hsl(var(--border));
        }
      `}</style>

      <div
        className="flex-1 overflow-auto relative border-t border-border min-w-0"
      >
        <div>
        <table
          className={cn(
            "caption-bottom text-sm border-separate border-spacing-0 crm-table",
            table.getState().columnSizingInfo.isResizingColumn && "crm-table-resizing",
            tableSettings?.zebraStriping && "crm-table-striped"
          )}
          style={{ width: '100%', tableLayout: 'fixed' }}
        >
          <colgroup>
            {table.getVisibleLeafColumns().map((col) => (
              <col
                key={col.id}
                style={col.id === "select" ? { width: "40px" } : undefined}
              />
            ))}
          </colgroup>
          <TableHeader className="sticky top-0 z-20 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-background hover:bg-background h-10 border-b-border">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "text-[12px] font-bold text-muted-foreground tracking-wider uppercase h-10 border-b border-border relative group/th",
                        header.column.id === "select" ? "px-0" : "px-4"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : header.column.getCanSort() ? (
                          <div
                            className="flex items-center gap-1.5 cursor-pointer select-none"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span className={cn(
                              "transition-colors",
                              header.column.getIsSorted() ? "text-foreground" : "group-hover/th:text-foreground"
                            )}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            <span className={cn(
                              "transition-opacity",
                              header.column.getIsSorted() ? "opacity-100" : "opacity-0 group-hover/th:opacity-40"
                            )}>
                              {header.column.getIsSorted() === 'asc'
                                ? <ChevronUp className="w-3 h-3" />
                                : header.column.getIsSorted() === 'desc'
                                  ? <ChevronDown className="w-3 h-3" />
                                  : <ChevronsUpDown className="w-3 h-3" />
                              }
                            </span>
                          </div>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )
                      }
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className={cn(
                            "absolute right-0 top-0 h-full w-[4px] cursor-col-resize touch-none select-none z-10",
                            "opacity-0 hover:opacity-100 group-hover/th:opacity-50 transition-opacity bg-border hover:bg-muted",
                            header.column.getIsResizing() && "bg-primary opacity-100 w-[4px]"
                          )}
                        />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columnsWithActions.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="animate-spin h-5 w-5 text-primary" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tableBodyContent
            )}
          </TableBody>
        </table>
        </div>
      </div>

      {/* Standardized CRM Pagination */}
      {!isInfinite && (
        <PaginationBar
          pageIndex={table.getState().pagination.pageIndex}
          pageSize={table.getState().pagination.pageSize}
          totalFilteredRows={totalFilteredRows.length}
          currentPageRows={currentPageRows.length}
          canPreviousPage={table.getCanPreviousPage()}
          canNextPage={table.getCanNextPage()}
          onPreviousPage={() => table.previousPage()}
          onNextPage={() => table.nextPage()}
          onSetPageSize={(size) => table.setPageSize(size)}
          onGoToPage={(page) => table.setPageIndex(page)}
        />
      )}
      {isInfinite && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-border z-20 shrink-0">
          <div className="text-xs text-muted-foreground font-medium">
            Showing{" "}
            <span className="font-bold text-foreground">{totalFilteredRows.length}</span>{" "}
            records
          </div>
        </div>
      )}
    </div>
  )
}

export const CrmDataTable = React.memo(CrmDataTableInner) as typeof CrmDataTableInner
