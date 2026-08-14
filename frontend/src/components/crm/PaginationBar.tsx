"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaginationBarProps {
  pageIndex: number
  pageSize: number
  totalFilteredRows: number
  currentPageRows: number
  canPreviousPage: boolean
  canNextPage: boolean
  onPreviousPage: () => void
  onNextPage: () => void
  onSetPageSize: (size: number) => void
}

function PaginationBarInner({
  pageIndex,
  pageSize,
  totalFilteredRows,
  currentPageRows,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
  onSetPageSize,
}: PaginationBarProps) {
  return (
    <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 border-t border-border z-20 shrink-0 flex-wrap">
      <div className="text-xs text-muted-foreground font-medium">
        Showing{" "}
        <span className="font-bold text-foreground">
          {currentPageRows > 0 ? (pageIndex * pageSize) + 1 : 0}
        </span>
        –
        <span className="font-bold text-foreground">
          {pageIndex * pageSize + currentPageRows}
        </span>{" "}
        of{" "}
        <span className="font-bold text-foreground">
          {totalFilteredRows}
        </span>{" "}
        records
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium hidden sm:inline">Rows per page:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors group border-0 bg-transparent focus:outline-none">
                <span className="text-sm font-bold text-foreground leading-none">
                  {pageSize}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[80px] bg-background border border-border shadow-lg rounded-md p-1">
              {[10, 25, 50, 100].map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => onSetPageSize(size)}
                  className={cn(
                    "flex items-center px-2 py-1.5 text-[13px] font-medium cursor-pointer rounded transition-colors",
                    pageSize === size
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {size}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={!canPreviousPage}
            className="h-8 gap-1 rounded-sm border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <div className="flex items-center px-3 h-8 text-[13px] font-bold text-primary bg-primary/5 border border-primary/20 rounded-sm">
            {pageIndex + 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={!canNextPage}
            className="h-8 gap-1 rounded-sm border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-30"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export const PaginationBar = React.memo(PaginationBarInner)
PaginationBar.displayName = "PaginationBar"
