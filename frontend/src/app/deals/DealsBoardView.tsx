"use client"

import * as React from "react"
import { CrmBoardView } from "@/components/crm/CrmBoardView"
import { CrmDateCell } from "@/components/crm/CrmDateCell"
import { Deal } from "@/lib/types/crm"
import Link from "next/link"

interface BoardColumn {
  id: string
  label: string
  color: string
}

interface DealsBoardViewProps {
  filteredData: Deal[]
  boardColumns: BoardColumn[]
  setSelectedDeal: (deal: Deal | null) => void
  onDragEnd?: (result: { active: string; over: string | null; overColumn?: string }) => void
}

function DealBoardCard({ deal }: { deal: Deal }) {
  return (
    <>
      <div className="flex justify-between items-start mb-2 mr-6">
        <Link
          href={`/deals/${deal.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[14px] font-bold text-primary hover:underline leading-tight truncate block"
        >
          {deal.title}
        </Link>
      </div>

      <div className="space-y-1.5 text-[12px] text-muted-foreground font-medium">
        <div className="flex items-center gap-1.5">
          Amount: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(deal.amount || 0)}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Close Date:</span>
          <CrmDateCell date={deal.close_date} useRelative={false} className="inline-block" />
        </div>
        <div className="flex items-center gap-1.5">
          Owner: {deal.owner ? `${deal.owner.first_name} ${deal.owner.last_name || ''}`.trim() : "Unassigned"}
        </div>
      </div>
    </>
  )
}

export function DealsBoardView({
  filteredData,
  boardColumns,
  setSelectedDeal,
  onDragEnd,
}: DealsBoardViewProps) {
  return (
    <CrmBoardView
      data={filteredData}
      columns={boardColumns}
      groupField="stage"
      onItemClick={setSelectedDeal}
      onDragEnd={onDragEnd}
      renderCard={(deal) => <DealBoardCard deal={deal} />}
      renderFooter={(items) => (
        <div className="flex items-center justify-between text-[12px] font-bold text-muted-foreground px-1">
          <span>Total</span>
          <span>
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
              items.reduce((sum, item) => sum + (item.amount || 0), 0)
            )}
          </span>
        </div>
      )}
    />
  )
}
