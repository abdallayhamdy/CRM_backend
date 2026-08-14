"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Settings } from "lucide-react"

interface CustomCard {
  id: string
  label: string
  type?: string
  properties?: Array<Record<string, unknown>>
}

interface CustomCardsRendererProps {
  cards: CustomCard[]
  addedIds: string[]
  basePath: string
  ready: boolean
  side?: "left" | "right"
}

export function CustomCardsRenderer({
  cards,
  addedIds,
  basePath,
  ready,
  side = "left",
}: CustomCardsRendererProps) {
  const router = useRouter()

  if (!ready || !Array.isArray(cards)) return null

  const filtered = side === "left" ? cards.filter((card) => addedIds.includes(card.id)) : cards

  return (
    <>
      {filtered.map((card) => (
        <div key={card.id} className="bg-background border border-border rounded-md shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <ChevronDown className="w-4 h-4 text-foreground/80" strokeWidth={2.5} />
              <h3 className="font-bold text-[16px] text-foreground">{card.label}</h3>
            </div>
            <div className="flex items-center gap-4">
              {side === "left" && (
                <button className="text-[14px] font-bold text-foreground flex items-center gap-1 opacity-100">
                  Actions <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                </button>
              )}
              <button
                onClick={() => router.push(`${basePath}?edit=${card.id}`)}
                className="w-7 h-7 rounded border border-input flex items-center justify-center hover:bg-[color:var(--color-slate-50)] text-muted-foreground"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-5 space-y-5">
            {card.properties && card.properties.length > 0 ? (
              card.properties.map((prop: any) => (
                <div key={prop.id} className="group relative">
                  <label className="text-[13px] text-muted-foreground block mb-1">{prop.label}</label>
                  <div className="text-[14px] text-foreground">{prop.value || "--"}</div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground text-[13px] text-center italic bg-muted py-4 rounded">
                No properties selected for {card.label}.
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  )
}
