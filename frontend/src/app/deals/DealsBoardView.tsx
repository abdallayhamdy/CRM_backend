"use client"

import * as React from "react"
import { CrmBoardView, BoardColumn, type CardAction } from "@/components/crm/CrmBoardView"
import { CrmDateCell } from "@/components/crm/CrmDateCell"
import { Deal } from "@/lib/types/crm"
import { DollarSign, CalendarDays, User2 } from "lucide-react"
import Link from "next/link"

interface DealsBoardViewProps {
  filteredData: Deal[]
  boardColumns: BoardColumn[]
  setSelectedDeal: (deal: Deal | null) => void
  onCardAction?: (deal: Deal, action: CardAction) => void
  onDragEnd?: (result: { active: string; over: string | null; overColumn?: string }) => void
}

function OwnerAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-semibold text-muted-foreground shrink-0">
      {initials || "?"}
    </div>
  )
}

function DealBoardCard({ deal }: { deal: Deal }) {
  const ownerName = deal.owner
    ? `${deal.owner.first_name || ""} ${deal.owner.last_name || ""}`.trim()
    : ""

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(deal.amount || 0)

  return (
    <>
      <Link
        href={`/deals/${deal.id}`}
        onClick={(e) => e.stopPropagation()}
        className="text-[13px] font-semibold text-foreground hover:text-primary leading-snug line-clamp-2 block mb-2.5 transition-colors"
      >
        {deal.title}
      </Link>

      <div className="flex items-center gap-1.5 mb-2">
        <DollarSign className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        <span className="text-[14px] font-bold text-foreground tabular-nums">
          {formattedAmount}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 text-[11.5px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3 w-3 shrink-0 opacity-60" />
          <CrmDateCell date={deal.close_date} useRelative={false} className="inline-block" />
        </div>

        <div className="flex items-center gap-1.5">
          <User2 className="h-3 w-3 shrink-0 opacity-60" />
          {ownerName ? (
            <>
              <OwnerAvatar name={ownerName} />
              <span className="truncate">{ownerName}</span>
            </>
          ) : (
            <span className="italic opacity-60">Unassigned</span>
          )}
        </div>
      </div>
    </>
  )
}

export function DealsBoardView({
  filteredData,
  boardColumns,
  setSelectedDeal,
  onCardAction,
  onDragEnd,
}: DealsBoardViewProps) {
  return (
    <CrmBoardView
      data={filteredData}
      columns={boardColumns}
      groupField="stage"
      onItemClick={setSelectedDeal}
      onCardAction={onCardAction}
      onDragEnd={onDragEnd}
      renderCard={(deal) => <DealBoardCard deal={deal} />}
      renderFooter={(items) => {
        const total = items.reduce((sum, item) => sum + (item.amount || 0), 0)
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(total)

        return (
          <div className="flex items-center justify-between text-[12px] px-1 py-1">
            <span className="text-muted-foreground font-medium">Total</span>
            <span className="font-bold text-foreground tabular-nums">{formatted}</span>
          </div>
        )
      }}
    />
  )
}
