"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Pencil, MoreHorizontal, Plus, Info, GripVertical,
  Check, RotateCcw, X, Search, ChevronLeft
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface LayoutCard {
  id: string
  label: string
  enabled: boolean
  type?: "association" | "property" | "activity" | "custom"
}

interface RecordPageLayoutEditorProps {
  moduleName: string
  moduleSlug: string
  backHref: string
  defaultLeftCards: LayoutCard[]
  defaultRightCards: LayoutCard[]
  libraryCards?: LayoutCard[]
}

function CardRow({
  card, onToggle, onEdit
}: {
  card: LayoutCard
  onToggle?: () => void
  onEdit?: () => void
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 bg-background border border-border rounded-md group select-none">
      <div className="shrink-0 cursor-grab text-border group-hover:text-muted-foreground transition-colors">
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
          <circle cx="2" cy="3" r="1.5"/><circle cx="8" cy="3" r="1.5"/>
          <circle cx="2" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/>
          <circle cx="2" cy="13" r="1.5"/><circle cx="8" cy="13" r="1.5"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[13px] font-bold text-foreground">{card.label}</span>
          <Info className="w-3 h-3 text-muted-foreground" />
        </div>
        <p className="text-[11px] text-muted-foreground/60 truncate">{card.label} · template</p>
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button onClick={onEdit} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        {onToggle && (
          <button onClick={onToggle} className="w-8 h-8 flex items-center justify-center text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded transition-colors" title="Remove card">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function AddCardDivider({ onAdd }: { onAdd: () => void }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <div
      className="relative flex items-center justify-center h-7 cursor-pointer select-none z-10"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onAdd}
    >
      <div className={cn("absolute inset-x-0 top-1/2 -translate-y-1/2 h-px transition-colors duration-150", hovered ? "bg-primary" : "bg-transparent")} />
      <div className={cn("relative z-10 w-5 h-5 rounded border flex items-center justify-center bg-background transition-all duration-150", hovered ? "border-primary text-primary shadow-sm scale-110" : "border-border text-border")}>
        <Plus className="w-3 h-3" />
      </div>
      {hovered && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 bg-foreground text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded z-20 whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-100">
          Add card
        </div>
      )}
    </div>
  )
}

export function RecordPageLayoutEditor({
  moduleName,
  moduleSlug,
  backHref,
  defaultLeftCards,
  defaultRightCards,
  libraryCards = []
}: RecordPageLayoutEditorProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState<"layout" | "settings">("layout")
  const [saved, setSaved] = React.useState(false)
  const [leftCards, setLeftCards] = React.useState<LayoutCard[]>(defaultLeftCards)
  const [rightCards, setRightCards] = React.useState<LayoutCard[]>(defaultRightCards)
  const [librarySearch, setLibrarySearch] = React.useState("")

  const handleSave = (exit = false) => {
    const config = { left: leftCards, right: rightCards }
    localStorage.setItem(`crm_record_page_${moduleSlug}`, JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    if (exit) router.push(backHref)
  }

  const handleLibraryToggle = (cardId: string) => {
    setLeftCards(prev => {
      const exists = prev.some(c => c.id === cardId)
      if (exists) return prev.filter(c => c.id !== cardId)
      const card = libraryCards.find(c => c.id === cardId)
      if (card) return [...prev, { ...card, enabled: true }]
      return prev
    })
  }

  const filteredLibrary = libraryCards.filter(c =>
    c.label.toLowerCase().includes(librarySearch.toLowerCase())
  )

  return (
    <div className="h-screen bg-muted/50 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="bg-background border-b border-border h-[52px] flex items-center px-5 relative shrink-0 z-10 shadow-sm">
        <button
          onClick={() => router.push(backHref)}
          className="px-4 py-1.5 text-[13px] font-bold text-foreground border border-border rounded hover:bg-accent transition-colors absolute left-5 flex items-center gap-1.5"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="mx-auto flex items-center gap-2">
          <span className="text-[14px] font-bold text-foreground">{moduleName} record page</span>
          <span className="text-border">|</span>
          <span className="text-[14px] text-muted-foreground">Default view</span>
        </div>

        <div className="flex items-center gap-2 absolute right-5">
          <button
            onClick={() => handleSave(false)}
            className={cn(
              "px-4 py-1.5 text-[13px] font-bold rounded border transition-all flex items-center gap-1.5",
              saved
                ? "bg-status-success-light border-status-success/30 text-status-success"
                : "bg-background border-border text-foreground hover:bg-accent"
            )}
          >
            {saved && <Check className="w-3.5 h-3.5" />} Save
          </button>
          <button
            onClick={() => handleSave(true)}
            className="px-4 py-1.5 text-[13px] font-bold rounded border border-border bg-background text-foreground hover:bg-accent transition-colors"
          >
            Save and exit
          </button>
        </div>
      </header>

      <div className="bg-background border-b border-border flex items-center justify-center gap-8 shrink-0">
        {(["layout", "settings"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "py-3 text-[13px] font-bold capitalize transition-all relative",
              activeTab === tab
                ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary"
                : "text-muted-foreground/60 hover:text-foreground"
            )}
          >
            {tab === "layout" ? "Edit layout" : "Settings"}
          </button>
        ))}
      </div>

      {activeTab === "layout" && (
        <div className="flex flex-1 overflow-hidden gap-px bg-border">
          <div className="w-[260px] shrink-0 bg-muted/50 flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 flex flex-col">
              <AddCardDivider onAdd={() => {}} />
              {leftCards.map(card => (
                <React.Fragment key={card.id}>
                  <CardRow card={card} onToggle={() => handleLibraryToggle(card.id)} />
                  <AddCardDivider onAdd={() => {}} />
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-muted/50 overflow-y-auto p-4 flex flex-col gap-3">
            <div className="bg-background border border-border rounded-md flex items-center justify-between px-4 py-2.5 shadow-sm">
              <span className="text-[13px] font-bold text-foreground">History</span>
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <button className="w-8 h-8 flex items-center justify-center hover:text-foreground transition-colors rounded hover:bg-accent">
                  <Plus className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center hover:text-foreground transition-colors rounded hover:bg-accent">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-background border border-border rounded-md p-6 shadow-sm flex flex-col items-center text-center flex-1">
              <p className="text-[15px] font-bold text-foreground mb-1">Your customer activity timeline.</p>
              <p className="text-[13px] text-muted-foreground mb-4 max-w-[380px] leading-relaxed">
                See important interactions here, from emails to calls. This tab isn&apos;t customizable, but you can{" "}
                <span className="text-primary underline cursor-pointer">reorder it</span>.
              </p>
              <button className="px-3 py-1.5 text-[12px] font-bold border border-border rounded text-foreground hover:bg-accent transition-colors flex items-center gap-1.5 mb-8">
                Learn more <span className="text-[10px]">↗</span>
              </button>
              <div className="mt-2 opacity-80">
                <svg width="200" height="140" viewBox="0 0 200 140" fill="none" aria-hidden="true">
                  <rect x="30" y="10" width="140" height="90" rx="6" fill="hsl(var(--muted))" />
                  <rect x="36" y="16" width="128" height="78" rx="4" fill="hsl(var(--muted))" />
                  <rect x="44" y="24" width="80" height="6" rx="3" fill="hsl(var(--border))" />
                  <rect x="44" y="34" width="112" height="4" rx="2" fill="hsl(var(--muted))" />
                  <rect x="44" y="42" width="96" height="4" rx="2" fill="hsl(var(--muted))" />
                  <rect x="44" y="50" width="104" height="4" rx="2" fill="hsl(var(--muted))" />
                  <rect x="44" y="58" width="88" height="4" rx="2" fill="hsl(var(--muted))" />
                  <rect x="90" y="100" width="20" height="14" rx="2" fill="hsl(var(--border))" />
                  <rect x="72" y="112" width="56" height="6" rx="3" fill="hsl(var(--border))" />
                </svg>
              </div>
            </div>
          </div>

          <div className="w-[260px] shrink-0 bg-muted/50 flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 flex flex-col">
              <AddCardDivider onAdd={() => {}} />
              {rightCards.map(card => (
                <React.Fragment key={card.id}>
                  <CardRow card={card} onToggle={() => {
                    setRightCards(prev => prev.map(c => c.id === card.id ? { ...c, enabled: !c.enabled } : c))
                  }} />
                  <AddCardDivider onAdd={() => {}} />
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="flex-1 p-8">
          <div className="max-w-2xl">
            <h2 className="text-[16px] font-bold text-foreground mb-1">User customization</h2>
            <p className="text-[14px] text-muted-foreground mb-6">Specify where users are allowed to reorder cards within this view.</p>

            <div className="flex flex-col gap-4 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-input accent-primary" />
                <span className="text-[14px] text-foreground">Left sidebar</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-input accent-primary" />
                <span className="text-[14px] text-foreground">Right sidebar</span>
              </label>
            </div>

            <div className="bg-muted/50 border border-border rounded-md p-4">
              <p className="text-[14px] text-muted-foreground">Any new cards added to this view will display, even if users have customized and reordered their cards.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
