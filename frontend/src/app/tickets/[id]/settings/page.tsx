"use client"

import * as React from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { usePanelCards, PanelCard, CustomRightCard } from "@/hooks/use-panel-cards"
import { AddRightCardDrawer } from "@/components/crm/AddRightCardDrawer"
import { CreateRightCardView } from "@/components/crm/CreateRightCardView"
import { EditDefaultCardView } from "@/components/crm/EditDefaultCardView"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  Pencil, MoreHorizontal, Plus, Info,
  Check, RotateCcw, X, Search
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { EditCardDrawer } from "@/components/crm/EditCardDrawer"
import { ConditionalLogicModal } from "@/components/crm/ConditionalLogicModal"
import { ConditionalLogic } from "@/hooks/use-panel-cards"

interface DragCtx { draggingId: string | null; dragOverId: string | null }
const DragContext = React.createContext<DragCtx>({ draggingId: null, dragOverId: null })

function CardRow({
  card, onDragStart, onDragOver, onDrop, onDragEnd, onEdit, onToggle, setConditionalLogicInitial, setConditionalLogicCardId
}: {
  card: PanelCard
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  onDragEnd: () => void
  onEdit: () => void
  onToggle?: () => void
  setConditionalLogicInitial?: (value: any) => void
  setConditionalLogicCardId?: (id: string | null) => void
}) {
  const { draggingId, dragOverId } = React.useContext(DragContext)
  const hasConditionalLogic = card.properties?.some(p => p.conditionalLogic)
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 bg-background border rounded-md transition-all cursor-grab active:cursor-grabbing group select-none",
        dragOverId === card.id
          ? "border-primary shadow-[0_0_0_1px_hsl(var(--primary))]"
          : "border-border hover:border-border hover:shadow-sm",
        draggingId === card.id && "opacity-30 scale-[0.98]",
        !card.enabled && "opacity-50"
      )}
    >
      <div className="shrink-0 cursor-grab text-border group-hover:text-muted-foreground transition-colors">
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
          <circle cx="2" cy="3"  r="1.5"/><circle cx="8" cy="3"  r="1.5"/>
          <circle cx="2" cy="8"  r="1.5"/><circle cx="8" cy="8" r="1.5"/>
          <circle cx="2" cy="13" r="1.5"/><circle cx="8" cy="13" r="1.5"/>
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[13px] font-bold text-foreground">{card.label}</span>
          {hasConditionalLogic && (
            <span className="text-[10px] bg-status-info-light text-primary px-1.5 py-0.5 rounded font-bold" title="Has conditional logic">C</span>
          )}
          <Info className="w-3 h-3 text-muted-foreground" />
        </div>
        <p className="text-[11px] text-muted-foreground/60 truncate">{card.label} Association card (default)</p>
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onEdit() }} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <Popover>
          <PopoverTrigger asChild>
            <button onClick={(e) => e.stopPropagation()} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors data-[state=open]:bg-muted/50">
              <MoreHorizontal className="w-3.5 h-3.5 pointer-events-none" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="z-[10000] w-[200px] p-0 rounded-md border border-border shadow-md animate-in fade-in zoom-in-95" align="end" sideOffset={8}>
            <div className="py-1 flex flex-col">
              {setConditionalLogicInitial && setConditionalLogicCardId && (
                <button onClick={(e) => { e.stopPropagation(); setConditionalLogicInitial(card.conditionalLogic || null); setConditionalLogicCardId(card.id) }} className="w-full text-left px-4 py-2 text-[13px] text-foreground hover:bg-accent transition-colors flex items-center justify-between">
                  Set conditional logic <span className="text-[10px]">›</span>
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); onEdit(); document.dispatchEvent(new MouseEvent('mousedown')); }} className="w-full text-left px-4 py-2 text-[13px] text-foreground hover:bg-accent transition-colors">Edit card</button>
              {onToggle && (
                <button onClick={(e) => { e.stopPropagation(); onToggle(); document.dispatchEvent(new MouseEvent('mousedown')); }} className={cn("w-full text-left px-4 py-2 text-[13px] transition-colors", card.enabled ? "text-destructive hover:bg-destructive/10" : "text-status-success hover:bg-status-success/10")}>
                  {card.enabled ? 'Remove card' : 'Add card'}
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

function FixedLeftCard({ label, desc, isProfile, onEdit, onRemove, id, conditionalLogic, onConditionalLogic }: {
  label: string; desc?: string; isProfile?: boolean; onEdit?: () => void; onRemove?: () => void; id?: string; conditionalLogic?: ConditionalLogic; onConditionalLogic?: () => void;
}) {
  return (
    <div onClick={onEdit} className={cn("flex items-center gap-2 px-3 py-2.5 bg-background border border-border rounded-md group select-none", onEdit && "cursor-pointer")}>
      <div className="shrink-0 text-border">
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
          <circle cx="2" cy="3"  r="1.5"/><circle cx="8" cy="3"  r="1.5"/>
          <circle cx="2" cy="8"  r="1.5"/><circle cx="8" cy="8" r="1.5"/>
          <circle cx="2" cy="13" r="1.5"/><circle cx="8" cy="13" r="1.5"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className={cn("text-[13px] font-bold text-foreground", onEdit && "hover:text-primary hover:underline cursor-pointer")}>{label}</span>
          <Info className="w-3 h-3 text-muted-foreground" />
        </div>
        {desc && <p className="text-[11px] text-muted-foreground/60 truncate">{desc}</p>}
      </div>
      {!isProfile && (
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button onClick={(e) => e.stopPropagation()} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded data-[state=open]:bg-muted/50">
                <MoreHorizontal className="w-3.5 h-3.5 pointer-events-none" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="z-[10000] w-[160px] p-0 rounded-md border border-border shadow-md animate-in fade-in zoom-in-95" align="end" sideOffset={8}>
              <div className="py-1 flex flex-col">
                {onConditionalLogic && (
                  <button onClick={(e) => { e.stopPropagation(); onConditionalLogic() }} className="w-full text-left px-4 py-2 text-[13px] text-foreground hover:bg-accent transition-colors flex items-center justify-between">
                    Set conditional logic <span className="text-[10px]">›</span>
                  </button>
                )}
                {onEdit && (
                  <button onClick={(e) => { e.stopPropagation(); onEdit(); document.dispatchEvent(new MouseEvent('mousedown')); }} className="w-full text-left px-4 py-2 text-[13px] text-foreground hover:bg-accent transition-colors">Edit card</button>
                )}
                {onRemove && (
                  <button onClick={(e) => { e.stopPropagation(); onRemove(); document.dispatchEvent(new MouseEvent('mousedown')); }} className="w-full text-left px-4 py-2 text-[13px] text-destructive hover:bg-destructive/10 transition-colors">Remove card</button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )
}

function AddCardDivider({ onAdd }: { onAdd: () => void }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <div className="relative flex items-center justify-center h-7 cursor-pointer select-none z-10" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onAdd}>
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

const LIBRARY_CARDS = [
  { id: "about",   label: "About this ticket",        added: true  },
  { id: "keyinfo", label: "Key information",            added: true  },
]

function LibraryTab({ searchQuery, addedIds, onToggle }: { searchQuery: string; addedIds: string[]; onToggle: (id: string) => void }) {
  const [cardType, setCardType] = React.useState("All card types")
  const [sortBy, setSortBy] = React.useState("Newest")
  const [hoveredCardId, setHoveredCardId] = React.useState<string | null>(null)
  const filtered = LIBRARY_CARDS.filter(c => c.label.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 text-[13px] font-bold text-foreground hover:text-primary transition-colors group">
              {cardType}
              <svg className="w-3 h-3 ml-0.5 fill-current" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 8L1 3h10z"/></svg>
            </button>
          </PopoverTrigger>
          <PopoverContent className="z-[10000] w-[240px] p-0 rounded-md border border-border shadow-md animate-in fade-in zoom-in-95" align="start" sideOffset={8}>
            <div className="p-3 bg-muted/50 border-b border-border rounded-t-md">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Search" className="w-full pl-3 pr-9 py-1.5 text-[14px] border border-primary rounded-full focus:outline-none focus:ring-1 focus:ring-primary text-foreground" />
              </div>
            </div>
            <div className="p-2 space-y-0.5">
              <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-accent rounded cursor-pointer group"><div className="w-4 h-4 border border-border rounded-xs bg-background group-hover:border-muted-foreground" /><span className="text-[14px] font-bold text-foreground">Select all</span></label>
              <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-accent rounded cursor-pointer group bg-muted/50"><div className="w-4 h-4 border border-border rounded-xs bg-background group-hover:border-muted-foreground" /><span className="text-[14px] text-foreground">Property list</span></label>
              <label className="flex items-center gap-3 px-2 py-1.5 hover:bg-accent rounded cursor-pointer group"><div className="w-4 h-4 border border-border rounded-xs bg-background group-hover:border-muted-foreground" /><span className="text-[14px] text-foreground">Standard</span></label>
            </div>
          </PopoverContent>
        </Popover>
        <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
          <span>Sort by:</span>
          <Popover>
            <PopoverTrigger asChild>
              <button className="font-bold text-foreground flex items-center gap-0.5 hover:underline">{sortBy}<svg className="w-3 h-3 fill-current" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 8L1 3h10z"/></svg></button>
            </PopoverTrigger>
            <PopoverContent className="z-[10000] w-[180px] p-0 rounded-md border border-border shadow-md animate-in fade-in zoom-in-95" align="end" sideOffset={8}>
              <div className="py-1">
                {["Newest", "Card name (A to Z)", "Card name (Z to A)"].map((opt) => (
                  <button key={opt} onClick={() => setSortBy(opt)} className={cn("w-full text-left px-4 py-2 text-[14px] transition-colors hover:bg-accent", opt === "Card name (Z to A)" ? "bg-muted/50 text-foreground" : "text-primary")}>{opt}</button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(card => {
          const isAdded = addedIds.includes(card.id)
          return (
            <div key={card.id} className="border border-border rounded-lg p-3 flex flex-col gap-3 hover:shadow-sm transition-shadow bg-background">
              <div className="flex items-start justify-between gap-1">
                <p className={cn("text-[13px] font-bold leading-tight", isAdded ? "text-primary" : "text-muted-foreground")}>{card.label}</p>
                <svg className="w-4 h-4 shrink-0 text-primary" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => onToggle(card.id)} onMouseEnter={() => setHoveredCardId(card.id)} onMouseLeave={() => setHoveredCardId(null)} className={cn("flex items-center gap-1 text-[11px] font-bold border rounded px-2 py-1 transition-colors flex-1 justify-center", !isAdded && "border-border text-foreground hover:bg-accent", isAdded && hoveredCardId !== card.id && "border-primary text-primary", isAdded && hoveredCardId === card.id && "border-destructive/30 text-destructive bg-destructive/10 hover:bg-destructive/15")}>
                  {isAdded ? (hoveredCardId === card.id ? <><X className="w-3 h-3" /> Remove</> : <><svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 6l3 3 5-5"/></svg> Added</>) : (<><span className="text-[13px] leading-none">+</span> Add card</>)}
                </button>
                <button className="text-[11px] font-bold border border-border rounded px-2 py-1 text-foreground hover:bg-accent transition-colors">Preview</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type DrawerTarget = "left" | "right" | "center"
const DRAWER_TITLES: Record<DrawerTarget, string> = { left: "Add left sidebar cards", right: "Add right sidebar cards", center: "Add center panel cards" }
const UNEDITABLE_CARD_PREFIXES = ['social', 'credit_memos', 'attribution', 'sales_nav', 'segments', 'marketing', 'invoices', 'playbooks', 'wf_mems']
const isUneditableCard = (cardId: string) => UNEDITABLE_CARD_PREFIXES.some(prefix => cardId.startsWith(prefix))

function AddCardsDrawer({ open, target, onClose, addedIds, onToggle, onEditProperties }: {
  open: boolean; target: DrawerTarget; onClose: () => void; addedIds: string[]; onToggle: (id: string) => void; onEditProperties?: () => void;
}) {
  const [drawerTab, setDrawerTab] = React.useState<"create" | "library">("create")
  const [searchQuery, setSearchQuery] = React.useState("")
  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) { setDrawerTab("create"); setSearchQuery(""); onClose() } }}>
      <SheetContent side="right" className="p-0 max-w-[90vw] data-[side=right]:w-[600px] data-[side=right]:sm:max-w-[600px]" showCloseButton={false}>
        <SheetTitle className="sr-only">{DRAWER_TITLES[target]}</SheetTitle>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-[15px] font-bold text-foreground">{DRAWER_TITLES[target]}</h2>
        </div>
        <div className="flex border-b border-border shrink-0">
          {(["create", "library"] as const).map(t => (
            <button key={t} onClick={() => setDrawerTab(t)} className={cn("flex-1 py-2.5 text-[13px] font-bold transition-all relative", drawerTab === t ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-foreground" : "text-muted-foreground/60 hover:text-foreground")}>
              {t === "create" ? "Create card" : "Card library"}
            </button>
          ))}
        </div>
        <div className="px-4 py-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search cards" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-[13px] border border-border rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-foreground" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {drawerTab === "create" && (
            <div>
              <div className="border border-border rounded-lg overflow-hidden hover:border-primary hover:shadow-md transition-all cursor-pointer group">
                <div className="bg-muted p-4 border-b border-border">
                  <div className="bg-background shadow-sm rounded-sm p-4 h-[120px] flex flex-col justify-center gap-4">
                    {[1, 2].map((row) => (
                      <div key={row} className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((col) => (
                          <div key={col} className="flex flex-col gap-1">
                            <span className="text-[8px] text-muted-foreground/60">Property label</span>
                            <span className="text-[9px] text-foreground">Property value</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div>
                    <p className="text-[14px] font-bold text-foreground mb-1">Property list</p>
                    <p className="text-[13px] text-foreground leading-relaxed">Show a list of up to 50 <span onClick={onEditProperties} className="cursor-pointer hover:underline">editable properties</span>.</p>
                  </div>
                  <button onClick={onEditProperties} className="w-full py-1 text-[13px] text-foreground bg-background border border-border rounded-xs hover:bg-accent transition-colors">Create card</button>
                </div>
              </div>
            </div>
          )}
          {drawerTab === "library" && <LibraryTab searchQuery={searchQuery} addedIds={addedIds} onToggle={onToggle} />}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function LayoutEditorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const { cards, customLeftCards, customRightCards: persistedRightCards, leftAddedIds: persistedLeftIds, save, ready } = usePanelCards('tickets')
  const [draft, setDraft] = React.useState<PanelCard[]>([])
  const [saved, setSaved] = React.useState(false)
  const [draggingId, setDraggingId] = React.useState<string | null>(null)
  const [dragOverId, setDragOverId] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<"layout" | "settings">("layout")
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [drawerTarget, setDrawerTarget] = React.useState<DrawerTarget>("left")
  const [editCardId, setEditCardId] = React.useState<string | null>(null)
  const [customCards, setCustomCards] = React.useState<{id: string, label: string, properties?: any[]}[]>([])
  const [customRightCards, setCustomRightCards] = React.useState<CustomRightCard[]>([])
  const [rightDrawerOpen, setRightDrawerOpen] = React.useState(false)
  const [createCardViewOpen, setCreateCardViewOpen] = React.useState(false)
  const [createCardType, setCreateCardType] = React.useState<'association' | 'workflow'>('association')
  const [editingDefaultCard, setEditingDefaultCard] = React.useState<PanelCard | null>(null)
  const [leftAddedIds, setLeftAddedIds] = React.useState<string[]>([])
  const [conditionalLogicCardId, setConditionalLogicCardId] = React.useState<string | null>(null)
  const [conditionalLogicInitial, setConditionalLogicInitial] = React.useState<ConditionalLogic | null>(null)

  const conditionalLogicCard = React.useMemo(() => {
    if (!conditionalLogicCardId) return null
    return draft.find(c => c.id === conditionalLogicCardId) || customRightCards.find(c => c.id === conditionalLogicCardId)
  }, [conditionalLogicCardId, draft, customRightCards])

  const conditionalLogicProperties = React.useMemo(() => {
    if (!conditionalLogicCard?.properties) return []
    return [{ group: "Card Properties", items: conditionalLogicCard.properties.map(p => ({ id: String(p.id ?? ''), label: String(p.label ?? '') })) }]
  }, [conditionalLogicCard])

  const openDrawer = (t: DrawerTarget) => { setDrawerTarget(t); setDrawerOpen(true) }
  const handleLibraryToggle = (cardId: string) => { setLeftAddedIds(prev => prev.includes(cardId) ? prev.filter(x => x !== cardId) : [...prev, cardId]) }

  const hasHydrated = React.useRef(false)
  React.useEffect(() => {
    if (ready && !hasHydrated.current) {
      hasHydrated.current = true
      setDraft(cards)
      setCustomCards(customLeftCards)
      setCustomRightCards(persistedRightCards)
      setLeftAddedIds(persistedLeftIds)
    }
  }, [ready, cards, customLeftCards, persistedRightCards, persistedLeftIds])

  const searchParams = useSearchParams()
  const editParam = searchParams.get("edit")

  React.useEffect(() => {
    if (ready && editParam) {
      const isDefaultCard = draft.some(c => c.id === editParam)
      if (!isDefaultCard) setTimeout(() => setEditCardId(editParam), 100)
    }
  }, [ready, editParam, draft])

  const toggleDraft = (cardId: string) => { setDraft(p => p.map(c => c.id === cardId ? { ...c, enabled: !c.enabled } : c)); setSaved(false) }
  const handleDragStart = (cardId: string) => setDraggingId(cardId)
  const handleDragOver = (e: React.DragEvent, cardId: string) => { e.preventDefault(); setDragOverId(cardId) }
  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setDragOverId(null); return }
    const next = [...draft]; const from = next.findIndex(c => c.id === draggingId); const to = next.findIndex(c => c.id === targetId)
    const [item] = next.splice(from, 1); next.splice(to, 0, item)
    setDraft(next); setDraggingId(null); setDragOverId(null); setSaved(false)
  }
  const handleDragEnd = () => { setDraggingId(null); setDragOverId(null) }

  const handleSave = async (exit = false) => {
    const prevDraft = [...draft]; const prevCustomCards = [...customCards]; const prevLeftAddedIds = [...leftAddedIds]; const prevCustomRightCards = [...customRightCards]
    try {
      await save(draft, customCards, leftAddedIds, customRightCards); setSaved(true)
      if (exit) setTimeout(() => router.push(`/tickets/${id}`), 400); else setTimeout(() => setSaved(false), 2000)
    } catch (error) { setDraft(prevDraft); setCustomCards(prevCustomCards); setLeftAddedIds(prevLeftAddedIds); setCustomRightCards(prevCustomRightCards); setSaved(false); console.error("Failed to save layout:", error) }
  }

  const handleSaveConditionalLogic = (condition: any) => {
    if (!conditionalLogicCardId) return
    setDraft(prev => prev.map(c => c.id === conditionalLogicCardId ? { ...c, conditionalLogic: condition as ConditionalLogic } : c))
    setCustomRightCards(prev => prev.map(c => c.id === conditionalLogicCardId ? { ...c, conditionalLogic: condition as ConditionalLogic } : c))
    setConditionalLogicCardId(null); setConditionalLogicInitial(null); setSaved(false)
  }

  return (
    <DragContext.Provider value={{ draggingId, dragOverId }}>
      <AddCardsDrawer open={drawerOpen} target={drawerTarget} onClose={() => setDrawerOpen(false)} addedIds={leftAddedIds} onToggle={handleLibraryToggle} onEditProperties={() => { setDrawerOpen(false); setEditCardId("new") }} />
      <EditCardDrawer
        open={!!editCardId}
        onClose={() => { setEditCardId(null); router.push(`/tickets/${id}/settings`) }}
        onSave={(title, properties) => {
          if (editCardId === "new") {
            const newId = `custom_${Date.now()}`; const updatedCards = [...customCards, { id: newId, label: title, properties }]; setCustomCards(updatedCards)
            const updatedLeftIds = [...leftAddedIds, newId]; setLeftAddedIds(updatedLeftIds); save(draft, updatedCards, updatedLeftIds, customRightCards); setSaved(true); setTimeout(() => setSaved(false), 2000)
          } else if (editCardId && customRightCards.some(c => c.id === editCardId)) {
            const updated = customRightCards.map(c => c.id === editCardId ? { ...c, label: title, properties: properties?.map(p => ({ id: p.id, label: p.label })) } : c); setCustomRightCards(updated); save(draft, customCards, leftAddedIds, updated); setSaved(true); setTimeout(() => setSaved(false), 2000)
          } else if (editCardId && editCardId.startsWith("custom_")) {
            const updated = customCards.map(c => c.id === editCardId ? { ...c, label: title, properties } : c); setCustomCards(updated); save(draft, updated, leftAddedIds, customRightCards); setSaved(true); setTimeout(() => setSaved(false), 2000)
          }
        }}
        cardId={editCardId}
        initialTitle={editCardId === "new" ? "Property list" : customRightCards.find(c => c.id === editCardId)?.label || customCards.find(c => c.id === editCardId)?.label}
        initialProperties={editCardId === "new" ? undefined : customRightCards.find(c => c.id === editCardId)?.properties || customCards.find(c => c.id === editCardId)?.properties}
      />
      <div className="h-screen bg-muted/50 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
        <header className="bg-background border-b border-border h-[52px] flex items-center px-5 relative shrink-0 z-10 shadow-sm">
          <button onClick={() => router.push(`/tickets/${id}`)} className="px-4 py-1.5 text-[13px] font-bold text-foreground border border-border rounded hover:bg-accent transition-colors absolute left-5">Exit</button>
          <div className="mx-auto flex items-center gap-2">
            <span className="text-[14px] font-bold text-foreground">Ticket record page</span>
            <span className="text-border">|</span>
            <span className="text-[14px] text-muted-foreground">Default view</span>
          </div>
          <div className="flex items-center gap-2 absolute right-5">
            <button onClick={() => handleSave(false)} className={cn("px-4 py-1.5 text-[13px] font-bold rounded border transition-all flex items-center gap-1.5", saved ? "bg-status-success-light border-status-success/30 text-status-success" : "bg-background border-border text-foreground hover:bg-accent")}>
              {saved && <Check className="w-3.5 h-3.5" />} Save
            </button>
            <button onClick={() => handleSave(true)} className="px-4 py-1.5 text-[13px] font-bold rounded border border-border bg-background text-foreground hover:bg-accent transition-colors">Save and exit</button>
          </div>
        </header>

        <div className="bg-background border-b border-border flex items-center justify-center gap-8 shrink-0">
          {(["layout", "settings"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn("py-3 text-[13px] font-bold capitalize transition-all relative", activeTab === tab ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary" : "text-muted-foreground/60 hover:text-foreground")}>
              {tab === "layout" ? "Edit layout" : "Settings"}
            </button>
          ))}
        </div>

        {activeTab === "layout" && (
          <div className="flex flex-1 overflow-hidden gap-px bg-border">
            <div className="w-[260px] shrink-0 bg-muted/50 flex flex-col">
              <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 flex flex-col">
                <AddCardDivider onAdd={() => openDrawer("left")} />
                <FixedLeftCard label="About this ticket" desc="About this ticket updated at …" onEdit={() => { const card = draft.find(c => c.id === "about"); if (card) { setEditCardId(null); setEditingDefaultCard(card); router.push(`/tickets/${id}/settings?edit=about`) } }} />
                <AddCardDivider onAdd={() => openDrawer("left")} />
                <FixedLeftCard label="Key information" desc="Key information · 0-1 · template" onEdit={() => { const card = draft.find(c => c.id === "keyinfo"); if (card) { setEditCardId(null); setEditingDefaultCard(card); router.push(`/tickets/${id}/settings?edit=keyinfo`) } }} />
                {leftAddedIds.filter(leftId => !["about", "keyinfo"].includes(leftId)).map(leftId => {
                  const card = LIBRARY_CARDS.find(c => c.id === leftId) || customCards.find(c => c.id === leftId)
                  if (!card) return null
                  const customCard = customCards.find(c => c.id === leftId)
                  const hasConditionalLogic = customCard?.properties?.some((p: any) => p.conditionalLogic)
                  return (
                    <React.Fragment key={leftId}>
                      <AddCardDivider onAdd={() => openDrawer("left")} />
                      <div onClick={(e) => { if ((e.target as HTMLElement).closest('button')) return; router.push(`/tickets/${id}/settings?edit=${leftId}`) }} className="flex items-center gap-2 px-3 py-2.5 bg-background border border-border rounded-md group select-none animate-in fade-in slide-in-from-top-1 duration-200 cursor-pointer">
                        <div className="shrink-0 text-border"><svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true"><circle cx="2" cy="3" r="1.5"/><circle cx="8" cy="3" r="1.5"/><circle cx="2" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="2" cy="13" r="1.5"/><circle cx="8" cy="13" r="1.5"/></svg></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[13px] font-bold text-foreground">{card.label}</span>
                            {hasConditionalLogic && <span className="text-[10px] bg-status-info-light text-primary px-1.5 py-0.5 rounded font-bold" title="Has conditional logic">C</span>}
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <p className="text-[11px] text-muted-foreground/60 truncate">{card.label} · 0-1 · template</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleLibraryToggle(leftId)} className="w-8 h-8 flex items-center justify-center text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded transition-colors" title="Remove card"><X className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditCardId(leftId)} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded"><Pencil className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </React.Fragment>
                  )
                })}
                <AddCardDivider onAdd={() => openDrawer("left")} />
              </div>
            </div>

            <div className="flex-1 bg-muted/50 overflow-y-auto p-4 flex flex-col gap-3">
              <div className="bg-background border border-border rounded-md flex items-center justify-between px-4 py-2.5 shadow-sm">
                <span className="text-[13px] font-bold text-foreground">History</span>
                <div className="flex items-center gap-2 text-muted-foreground/60">
                  <button aria-label="Add activity" className="w-8 h-8 flex items-center justify-center hover:text-foreground transition-colors rounded hover:bg-accent"><Plus className="w-4 h-4" aria-hidden="true" /></button>
                  <button aria-label="Refresh activities" className="w-8 h-8 flex items-center justify-center hover:text-foreground transition-colors rounded hover:bg-accent"><RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /></button>
                </div>
              </div>
              <div className="bg-background border border-border rounded-md p-6 shadow-sm flex flex-col items-center text-center flex-1">
                <p className="text-[15px] font-bold text-foreground mb-1">Your customer activity timeline.</p>
                <p className="text-[13px] text-muted-foreground mb-4 max-w-[380px] leading-relaxed">See important interactions here, from emails to calls. This tab isn&apos;t customizable, but you can <span className="text-primary underline cursor-pointer">reorder it</span>.</p>
                <button className="px-3 py-1.5 text-[12px] font-bold border border-border rounded text-foreground hover:bg-accent transition-colors flex items-center gap-1.5 mb-8">Learn more <span className="text-[10px]">↗</span></button>
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
                <AddCardDivider onAdd={() => setRightDrawerOpen(true)} />
                {draft.map(card => (
                  <React.Fragment key={card.id}>
                    <CardRow card={card} onDragStart={() => handleDragStart(card.id)} onDragOver={e => handleDragOver(e, card.id)} onDrop={() => handleDrop(card.id)} onDragEnd={handleDragEnd} onEdit={() => { setEditCardId(null); setEditingDefaultCard(card); router.push(`/tickets/${id}/settings?edit=${card.id}`) }} onToggle={() => toggleDraft(card.id)} setConditionalLogicInitial={setConditionalLogicInitial} setConditionalLogicCardId={setConditionalLogicCardId} />
                    <AddCardDivider onAdd={() => setRightDrawerOpen(true)} />
                  </React.Fragment>
                ))}
                {customRightCards.map(card => {
                  const hasConditionalLogic = card.properties?.some(p => p.conditionalLogic)
                  return (
                    <React.Fragment key={card.id}>
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-background border border-border rounded-md group select-none animate-in fade-in slide-in-from-right-1 duration-200 cursor-pointer">
                        <div className="shrink-0 text-border"><svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true"><circle cx="2" cy="3" r="1.5"/><circle cx="8" cy="3" r="1.5"/><circle cx="2" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="2" cy="13" r="1.5"/><circle cx="8" cy="13" r="1.5"/></svg></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1"><span className="text-[13px] font-bold text-foreground">{card.label}</span>{hasConditionalLogic && <span className="text-[10px] bg-status-info-light text-primary px-1.5 py-0.5 rounded font-bold" title="Has conditional logic">C</span>}</div>
                          <p className="text-[11px] text-muted-foreground/60 truncate">{card.type === 'association' ? 'Association card' : 'Workflow'}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isUneditableCard(card.id) && <button onClick={() => router.push(`/tickets/${id}/settings?edit=${card.id}`)} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors" title="Edit card"><Pencil className="w-3.5 h-3.5" /></button>}
                          <button onClick={() => setCustomRightCards(prev => prev.filter(c => c.id !== card.id))} className="w-8 h-8 flex items-center justify-center text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded transition-colors" title="Remove card"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <AddCardDivider onAdd={() => setRightDrawerOpen(true)} />
                    </React.Fragment>
                  )
                })}
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
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" defaultChecked aria-label="Show left sidebar" className="w-4 h-4 rounded border-input accent-primary" /><span className="text-[14px] text-foreground">Left sidebar</span></label>
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" defaultChecked aria-label="Show right sidebar" className="w-4 h-4 rounded border-input accent-primary" /><span className="text-[14px] text-foreground">Right sidebar</span></label>
              </div>
              <div className="bg-muted/50 border border-border rounded-md p-4"><p className="text-[14px] text-muted-foreground">Any new cards added to this view will display, even if users have customized and reordered their cards.</p></div>
            </div>
          </div>
        )}

        <AddRightCardDrawer open={rightDrawerOpen} onClose={() => setRightDrawerOpen(false)} existingCardIds={[...draft.filter(c => c.enabled !== false).map(c => c.id), ...customRightCards.map(c => c.id)]}
          onSave={(newCard) => { const disabledDraft = draft.find(c => c.enabled === false && newCard.id.startsWith(c.id + '_')); if (disabledDraft) { const updatedDraft = draft.map(c => c.id === disabledDraft.id ? { ...c, enabled: true } : c); setDraft(updatedDraft); save(updatedDraft, customCards, leftAddedIds, customRightCards) } else { const updated = [...customRightCards, newCard]; setCustomRightCards(updated); save(draft, customCards, leftAddedIds, updated) }; setSaved(true); setTimeout(() => setSaved(false), 2000) }}
          onRemove={(cardId) => { if (draft.some(c => c.id === cardId)) { const updated = draft.map(c => c.id === cardId ? { ...c, enabled: false } : c); setDraft(updated); save(updated, customCards, leftAddedIds, customRightCards) } else { const updated = customRightCards.filter(c => c.id !== cardId); setCustomRightCards(updated); save(draft, customCards, leftAddedIds, updated) }; setSaved(true); setTimeout(() => setSaved(false), 2000) }}
          onCreateRequest={(type) => { setCreateCardType(type); setRightDrawerOpen(false); setCreateCardViewOpen(true) }}
        />
        {createCardViewOpen && <CreateRightCardView type={createCardType} onClose={() => setCreateCardViewOpen(false)} onSave={(newCard) => { const updated = [...customRightCards, newCard]; setCustomRightCards(updated); save(draft, customCards, leftAddedIds, updated); setCreateCardViewOpen(false); setSaved(true); setTimeout(() => setSaved(false), 2000) }} />}
        {editingDefaultCard && <EditDefaultCardView card={editingDefaultCard} onClose={() => { setEditingDefaultCard(null); router.push(`/tickets/${id}/settings`) }} onSave={(updatedCard) => { setDraft(prev => prev.map(c => c.id === updatedCard.id ? { ...c, label: updatedCard.label, properties: updatedCard.properties?.map(p => ({ id: p.id, label: p.name })) } : c)); setEditingDefaultCard(null); setSaved(false) }} />}
        {conditionalLogicCardId && <ConditionalLogicModal open={!!conditionalLogicCardId} onClose={() => { setConditionalLogicCardId(null); setConditionalLogicInitial(null) }} onSave={handleSaveConditionalLogic} initialCondition={conditionalLogicInitial || undefined} properties={conditionalLogicProperties} />}
      </div>
    </DragContext.Provider>
  )
}
