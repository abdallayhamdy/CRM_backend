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

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

interface PaginationProps {
  pageIndex: number
  pageSize: number
  totalRows: number
  canPreviousPage: boolean
  canNextPage: boolean
  onPreviousPage: () => void
  onNextPage: () => void
  onGoToPage?: (pageIndex: number) => void
  onSetPageSize?: (size: number) => void
  pageSizeOptions?: number[]
  showInfo?: boolean
  className?: string
}

function PaginationInner({
  pageIndex,
  pageSize,
  totalRows,
  canPreviousPage,
  canNextPage,
  onPreviousPage,
  onNextPage,
  onGoToPage,
  onSetPageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  showInfo = true,
  className,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize))
  const startRow = totalRows > 0 ? pageIndex * pageSize + 1 : 0
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div className={cn("flex items-center justify-between px-4 sm:px-6 py-3 border-t border-border z-20 shrink-0", className)}>
      {showInfo && (
        <div className="text-xs text-muted-foreground font-medium">
          Showing{" "}
          <span className="font-bold text-foreground">{startRow}</span>
          –
          <span className="font-bold text-foreground">{endRow}</span>{" "}
          of{" "}
          <span className="font-bold text-foreground">{totalRows}</span>{" "}
          records
        </div>
      )}

      <div className={cn("flex items-center gap-6", !showInfo && "ml-auto")}>
        {onSetPageSize && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">Rows per page:</span>
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
                {pageSizeOptions.map((size) => (
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
        )}

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

          {onGoToPage ? (
            <PageNumbers
              pageIndex={pageIndex}
              pageCount={pageCount}
              onGoToPage={onGoToPage}
            />
          ) : (
            <div className="flex items-center px-3 h-8 text-[13px] font-bold text-primary bg-primary/5 border border-primary/20 rounded-sm">
              {pageIndex + 1}
            </div>
          )}

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

interface PageNumbersProps {
  pageIndex: number
  pageCount: number
  onGoToPage: (pageIndex: number) => void
}

function PageNumbers({ pageIndex, pageCount, onGoToPage }: PageNumbersProps) {
  const pages = React.useMemo(() => {
    if (pageCount <= 5) {
      return Array.from({ length: pageCount }, (_, i) => i + 1)
    }
    const current = pageIndex + 1
    const items: (number | "ellipsis")[] = []
    items.push(1)
    if (current > 3) items.push("ellipsis")
    for (let i = Math.max(2, current - 1); i <= Math.min(pageCount - 1, current + 1); i++) {
      items.push(i)
    }
    if (current < pageCount - 2) items.push("ellipsis")
    items.push(pageCount)
    return items
  }, [pageIndex, pageCount])

  return (
    <div className="flex items-center gap-0.5">
      {pages.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="text-[13px] text-muted-foreground px-1">
            ...
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onGoToPage(item - 1)}
            className={cn(
              "min-w-[32px] h-8 rounded-sm text-[13px] font-medium transition-colors",
              pageIndex + 1 === item
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {item}
          </button>
        )
      )}
    </div>
  )
}

export const Pagination = React.memo(PaginationInner)
Pagination.displayName = "Pagination"
