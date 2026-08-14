"use client"

import * as React from "react"
import {
  flexRender,
  Row,
} from "@tanstack/react-table"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown, Search } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export type TableOption = string | { value: string; label: string; badgeColor?: string; color?: string };

interface DataTableRowProps<TData> {
  row: Row<TData>
  isSelected: boolean
  onRowClick?: (item: TData) => void
  editingCell: { rowIndex: number; columnId: string; value: string } | null
  setEditingCell: (cell: { rowIndex: number; columnId: string; value: string } | null) => void
  onUpdateCellRef: React.MutableRefObject<
    ((row: TData, columnId: string, value: string | number | boolean | null) => Promise<void>) | undefined
  >
  className?: string
}

function DataTableRowInner<TData>({
  row,
  isSelected,
  onRowClick,
  editingCell,
  setEditingCell,
  onUpdateCellRef,
  className,
}: DataTableRowProps<TData>) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const prevEditingCellIdRef = React.useRef<string | null>(null)

  const editingCellId = editingCell ? `${editingCell.rowIndex}-${editingCell.columnId}` : null
  if (editingCellId !== prevEditingCellIdRef.current) {
    prevEditingCellIdRef.current = editingCellId
    if (searchTerm) setSearchTerm("")
  }

  return (
    <TableRow
      data-state={isSelected && "selected"}
      className={cn(
        "group hover:bg-primary/10 border-b border-border [&:last-child]:border-0 cursor-pointer",
        isSelected && "bg-primary/5 hover:bg-primary/15"
      )}
    >
      {row.getVisibleCells().map((cell, cellIdx) => {
        const isEditing = editingCell?.rowIndex === row.index && editingCell?.columnId === cell.column.id
        const meta = cell.column.columnDef.meta
        const isEditable = meta?.editable
        const isFirstDataColumn = cellIdx === 1

        return (
          <TableCell
            key={cell.id}
            className={cn(
              "text-[13px] text-foreground truncate relative",
              cell.column.id === "select" ? "px-0" : "px-4",
              className,
              isEditable && !isEditing && "group/cell cursor-default hover:ring-2 hover:ring-inset hover:ring-primary/40 hover:bg-primary/5"
            )}
          >
            {isEditing ? (
              meta?.options ? (
                <div className="absolute inset-0 z-30 bg-background">
                  <DropdownMenu open={true} onOpenChange={(open) => !open && setEditingCell(null)}>
                    <DropdownMenuTrigger asChild>
                      <button className="w-full h-full text-left px-4 outline-none border-2 border-primary bg-background flex items-center justify-between">
                        <span className="truncate">{editingCell.value}</span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-[200px] z-[100] p-1 shadow-lg border-border">
                       <div className="flex items-center px-2 py-1.5 border-b border-border gap-2 mb-1">
                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          className="flex-1 bg-transparent border-none outline-none text-[13px] placeholder:text-muted-foreground h-6"
                          placeholder="Search options..."
                          autoFocus
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-[250px] overflow-y-auto">
                        {(meta.options as TableOption[])
                          .filter(opt => {
                            const label = typeof opt === 'string' ? opt : opt.label
                            return label.toLowerCase().includes(searchTerm.toLowerCase())
                          })
                          .map((opt) => {
                            const val = typeof opt === 'string' ? opt : opt.value
                            const label = typeof opt === 'string'
                              ? opt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                              : opt.label
                            const badgeColor = typeof opt === 'string' ? undefined : opt.badgeColor
                            const optColor = typeof opt === 'string' ? undefined : opt.color

                            return (
                              <DropdownMenuItem
                                key={val}
                                className="py-2 px-2 cursor-pointer font-medium hover:bg-muted transition-colors"
                                onClick={async () => {
                                  if (val !== String(cell.getValue() || "")) {
                                    await onUpdateCellRef.current?.(row.original, cell.column.id, val)
                                  }
                                  setEditingCell(null)
                                }}
                              >
                                <div className="flex items-center gap-2 w-full">
                                  {optColor ? (
                                    <Badge className="font-bold rounded-full px-3 py-0.5 border-0 shadow-sm whitespace-nowrap" style={{ backgroundColor: optColor, color: "#fff" }}>
                                      {label}
                                    </Badge>
                                  ) : badgeColor ? (
                                    <Badge className={cn("font-bold rounded-full px-3 py-0.5 border-0 shadow-sm whitespace-nowrap", badgeColor)}>
                                      {label}
                                    </Badge>
                                  ) : (
                                    <span className="truncate">{label}</span>
                                  )}
                                  {val === String(cell.getValue() || "") && (
                                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                                  )}
                                </div>
                              </DropdownMenuItem>
                            )
                          })}
                        {(meta.options as TableOption[]).filter(opt => {
                          const label = typeof opt === 'string' ? opt : opt.label
                          return label.toLowerCase().includes(searchTerm.toLowerCase())
                        }).length === 0 && (
                            <div className="py-4 text-center text-[12px] text-muted-foreground">
                              No options found
                            </div>
                          )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <input
                  autoFocus
                  className="absolute inset-0 w-full h-full px-4 text-[13px] border-2 border-primary outline-none z-30 bg-background"
                  value={editingCell.value}
                  onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                  onBlur={async () => {
                    if (editingCell.value !== String(cell.getValue() || "")) {
                      await onUpdateCellRef.current?.(row.original, cell.column.id, editingCell.value)
                    }
                    setEditingCell(null)
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      if (editingCell.value !== String(cell.getValue() || "")) {
                        await onUpdateCellRef.current?.(row.original, cell.column.id, editingCell.value)
                      }
                      setEditingCell(null)
                    }
                    if (e.key === 'Escape') {
                      setEditingCell(null)
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              )
            ) : (
              <>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                {isEditable && !isFirstDataColumn && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingCell({
                        rowIndex: row.index,
                        columnId: cell.column.id,
                        value: String(cell.getValue() || "")
                      })
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 transition-opacity cursor-pointer hover:bg-primary/10 rounded p-0.5"
                  >
                    <svg className="h-3 w-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
              </>
            )}
          </TableCell>
        )
      })}
    </TableRow>
  )
}

export const DataTableRow = React.memo(DataTableRowInner) as typeof DataTableRowInner & { displayName: string }
DataTableRow.displayName = "DataTableRow"
