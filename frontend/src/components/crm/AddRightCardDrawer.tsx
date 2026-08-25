"use client"

import * as React from "react"
import { X, Search, Info, ChevronRight, Layout, Briefcase, Workflow, Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface AddRightCardDrawerProps {
  open: boolean
  onClose: () => void
  onSave: (card: { id: string, label: string, type: 'association' | 'workflow' }) => void
  onRemove?: (cardId: string) => void
  onCreateRequest?: (type: 'association' | 'workflow') => void
  existingCardIds?: string[]
}

const LIBRARY_CARDS = [
  { id: 'contacts_lib', label: 'Contacts', type: 'association' as const, objectType: 'Contact' },
  { id: 'companies_lib', label: 'Companies', type: 'association' as const, objectType: 'Company' },
  { id: 'deals_lib', label: 'Deals', type: 'association' as const, objectType: 'Deal' },
  { id: 'tickets_lib', label: 'Tickets', type: 'association' as const, objectType: 'Ticket' },
  { id: 'orders', label: 'Orders', type: 'association' as const, objectType: 'Order' },
  { id: 'notes_lib', label: 'Notes', type: 'association' as const, objectType: 'Note' },
  { id: 'tasks_lib', label: 'Tasks', type: 'association' as const, objectType: 'Task' },
  { id: 'products_lib', label: 'Products', type: 'association' as const, objectType: 'Product' },
]

const SAMPLE_RECORDS: Record<string, { id: string, name: string }[]> = {
  'Contact': [
    { id: '1', name: 'Brian Halligan (Sample Contact)' },
    { id: '2', name: 'Dharmesh Shah (Sample Contact)' },
  ],
  'Company': [
    { id: '1', name: 'Rootline (Sample Company)' },
    { id: '2', name: 'Google (Sample Company)' },
  ],
  'Deal': [
    { id: '1', name: 'Enterprise License (Sample Deal)' },
  ],
  'Ticket': [
    { id: '1', name: 'Login Issue (Sample Ticket)' },
  ],
  'Campaign': [
    { id: '1', name: 'Spring Sale 2026 (Sample Campaign)' },
  ],
  'Subscription': [
    { id: '1', name: 'Premium Plan (Sample Subscription)' },
  ],
  'Payment': [
    { id: '1', name: 'Payment #1234 (Sample Payment)' },
  ],
  'Payment Link': [
    { id: '1', name: 'Checkout Link (Sample Payment Link)' },
  ],
  'Order': [
    { id: '1', name: 'Order #1001 (Sample Order)' },
  ],
  'Cart': [
    { id: '1', name: 'Abandoned Cart (Sample Cart)' },
  ],
  'Credit Memo': [
    { id: '1', name: 'CM-2026-001 (Sample Credit Memo)' },
  ],
  'Attachment': [
    { id: '1', name: 'Contract.pdf (Sample Attachment)' },
  ],
  'Segment': [
    { id: '1', name: 'VIP Customers (Sample Segment)' },
  ],
  'Marketing Event': [
    { id: '1', name: 'Webinar 2026 (Sample Event)' },
  ],
  'Invoice': [
    { id: '1', name: 'INV-2026-001 (Sample Invoice)' },
  ],
  'Playbook': [
    { id: '1', name: 'Sales Script (Sample Playbook)' },
  ],
  'Workflow': [
    { id: '1', name: 'Welcome Series (Sample Workflow)' },
  ],
  'Note': [
    { id: '1', name: 'Call follow-up notes (Sample Note)' },
  ],
  'Task': [
    { id: '1', name: 'Send proposal (Sample Task)' },
  ],
  'Product': [
    { id: '1', name: 'Enterprise Plan (Sample Product)' },
  ],
}

export function AddRightCardDrawer({ open, onClose, onSave, onRemove, onCreateRequest, existingCardIds = [] }: AddRightCardDrawerProps) {
  const [activeTab, setActiveTab] = React.useState<"create" | "library">("create")
  const [search, setSearch] = React.useState("")
  const [previewCard, setPreviewCard] = React.useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = React.useState<Record<string, string>>({})
  const [recDropdownOpen, setRecDropdownOpen] = React.useState<string | null>(null)
  const [hoveredCardId, setHoveredCardId] = React.useState<string | null>(null)

  const isAlreadyAdded = (id: string) => {
    return existingCardIds.some(eid => eid.startsWith(id))
  }

  const handlePreview = (cardId: string) => {
    setPreviewCard(prev => prev === cardId ? null : cardId)
    setRecDropdownOpen(null)
    if (!selectedRecord[cardId]) {
      const card = LIBRARY_CARDS.find(c => c.id === cardId)
      if (card) {
        const records = SAMPLE_RECORDS[card.objectType] || []
        if (records.length > 0) {
          setSelectedRecord(prev => ({ ...prev, [cardId]: records[0].id }))
        }
      }
    }
  }

  const closePreview = () => {
    setPreviewCard(null)
    setRecDropdownOpen(null)
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="p-0 max-w-[90vw] data-[side=right]:w-[600px] data-[side=right]:sm:max-w-[600px]" showCloseButton={false}>
        <SheetTitle className="sr-only">Add right sidebar cards</SheetTitle>

        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Add right sidebar cards</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("create")}
            className={cn(
              "flex-1 py-3 text-[14px] font-bold transition-all relative",
              activeTab === "create" ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-foreground" : "text-muted-foreground/60 hover:text-foreground"
            )}
          >
            Create card
          </button>
          <button
            onClick={() => { setActiveTab("library"); closePreview() }}
            className={cn(
              "flex-1 py-3 text-[14px] font-bold transition-all relative",
              activeTab === "library" ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-foreground" : "text-muted-foreground/60 hover:text-foreground"
            )}
          >
            Card library
          </button>
        </div>

        {/* Search and Filter */}
        <div className="p-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search cards"
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded text-[14px] focus:outline-none focus:border-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded text-[14px] font-bold text-foreground hover:bg-accent">
            <Layout className="w-4 h-4" />
            Discover app cards
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/50">
          {activeTab === "create" ? (
            <div className="grid grid-cols-2 gap-6">
              {/* Association card */}
              <div className="bg-background border border-border rounded-lg overflow-hidden flex flex-col hover:border-border transition-colors shadow-sm">
                <div className="h-[180px] bg-muted/50 p-6 flex items-center justify-center border-b border-border">
                  <div className="bg-background border border-border rounded p-4 shadow-sm w-full">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                        <Briefcase className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <span className="text-[12px] font-bold">Maria J</span>
                      <div className="ml-auto flex gap-1">
                        <div className="w-4 h-2 rounded-full bg-muted" />
                        <div className="w-4 h-2 rounded-full bg-muted" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground/70">Property label:</span>
                        <span className="text-muted-foreground">Property value</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground/70">Property label:</span>
                        <span className="text-muted-foreground">Property value</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground/70">Property label:</span>
                        <span className="text-muted-foreground">Property value</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-1">
                  <h3 className="text-[14px] font-bold text-foreground mb-1">Association card</h3>
                  <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">Show up to 5 properties of associated records.</p>
                </div>
                <div className="p-4 pt-0 mt-auto">
                  <button
                    onClick={() => onCreateRequest ? onCreateRequest('association') : onSave({ id: `assoc_${Date.now()}`, label: 'New Association', type: 'association' })}
                    className="w-full py-1.5 border border-border rounded text-[13px] font-bold text-foreground hover:bg-accent"
                  >
                    Create card
                  </button>
                </div>
              </div>

              {/* Enroll in Workflow card */}
              <div className="bg-background border border-border rounded-lg overflow-hidden flex flex-col hover:border-border transition-colors shadow-sm">
                <div className="h-[180px] bg-muted/50 p-6 flex items-center justify-center border-b border-border">
                  <div className="bg-background border border-border rounded p-4 shadow-sm w-full space-y-3">
                    <div className="p-2 border border-border rounded text-[10px] text-muted-foreground font-medium">
                      Summarize record
                      <div className="text-[8px] text-muted-foreground/70">Last enrolled April 28, 2025 3:14PM</div>
                    </div>
                    <div className="p-2 border border-border rounded text-[10px] text-muted-foreground font-medium">
                      Sync record to 3rd party
                    </div>
                    <div className="p-2 border border-border rounded text-[10px] text-muted-foreground font-medium">
                      Create deal and associate to contact
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-1">
                  <h3 className="text-[14px] font-bold text-foreground mb-1">Enroll in Workflow</h3>
                  <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">Enrolls the current object into a workflow.</p>
                </div>
                <div className="p-4 pt-0 mt-auto">
                  <button
                    onClick={() => onCreateRequest ? onCreateRequest('workflow') : onSave({ id: `wf_${Date.now()}`, label: 'Enroll in Workflow', type: 'workflow' })}
                    className="w-full py-1.5 border border-border rounded text-[13px] font-bold text-foreground hover:bg-accent"
                  >
                    Create card
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Filter and Sort bar */}
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 font-bold text-foreground hover:text-primary">
                    All card types <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground/60">Sort by:</span>
                  <button className="flex items-center gap-1 font-bold text-foreground hover:text-primary">
                    Newest <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </button>
                </div>
              </div>

              {/* Library Grid */}
              <div className="grid grid-cols-2 gap-4">
                {LIBRARY_CARDS.filter(card =>
                  card.label.toLowerCase().includes(search.toLowerCase())
                ).map((item) => {
                  const added = isAlreadyAdded(item.id)
                  const isPreview = previewCard === item.id
                  const records = SAMPLE_RECORDS[item.objectType] || []
                  const selectedRecId = selectedRecord[item.id]
                  const selectedRec = records.find(r => r.id === selectedRecId) || records[0]
                  const isRecDropdown = recDropdownOpen === item.id

                  return (
                    <div key={item.id} className="bg-background border border-border rounded-md p-4 flex flex-col gap-3 shadow-sm hover:border-border transition-colors group relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[13px] font-bold",
                            added ? "text-muted-foreground/60" : "text-primary hover:underline cursor-pointer"
                          )}>
                            {item.label}
                          </span>
                        </div>
                        <Workflow className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (added) {
                              const cardId = existingCardIds.find(eid => eid.startsWith(item.id))
                              if (cardId && onRemove) {
                                onRemove(cardId)
                              }
                            } else {
                              onSave({ id: `${item.id}_${Date.now()}`, label: item.label, type: item.type as 'association' | 'workflow' })
                            }
                          }}
                          onMouseEnter={() => setHoveredCardId(item.id)}
                          onMouseLeave={() => setHoveredCardId(null)}
                          className={cn(
                            "flex-1 py-1.5 rounded text-[12px] font-bold border transition-all",
                            !added && "bg-background border-border text-foreground hover:bg-accent",
                            added && hoveredCardId !== item.id && "bg-background border-border text-muted-foreground/60 flex items-center justify-center gap-1.5",
                            added && hoveredCardId === item.id && "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/15 flex items-center justify-center gap-1.5"
                          )}
                        >
                          {added ? (
                            hoveredCardId === item.id ? (
                              <>
                                <X className="w-3.5 h-3.5" />
                                Remove
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5 text-hs-success" />
                                Added
                              </>
                            )
                          ) : (
                            <>+ Add card</>
                          )}
                        </button>
                        <Popover open={isPreview} onOpenChange={(open) => !open && closePreview()}>
                          <PopoverTrigger asChild>
                            <button
                              onClick={() => handlePreview(item.id)}
                              className="flex-1 py-1.5 bg-background border border-border rounded text-[12px] font-bold text-foreground hover:bg-accent"
                            >
                              Preview
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0 z-[10000] rounded-md border border-border shadow-lg animate-in fade-in zoom-in-95" sideOffset={5}>
                            {/* Close button */}
                            <div className="flex justify-end p-2 border-b border-border">
                              <button onClick={closePreview} className="text-muted-foreground/60 hover:text-foreground transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Sample record dropdown */}
                            {records.length > 0 && (
                              <div className="px-4 py-3 border-b border-border relative">
                                <label className="text-[11px] font-bold text-foreground mb-1.5 block">Sample record</label>
                                <button
                                  onClick={() => setRecDropdownOpen(prev => prev === item.id ? null : item.id)}
                                  className="w-full flex items-center justify-between px-3 py-2 border border-border rounded text-[13px] text-foreground bg-background hover:bg-accent"
                                >
                                  {selectedRec?.name || 'Select a record'}
                                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground/60 transition-transform", isRecDropdown && "rotate-180")} />
                                </button>
                                {isRecDropdown && (
                                  <div className="absolute top-full left-4 right-4 mt-1 bg-background border border-border rounded-md shadow-lg z-[10002] max-h-[200px] overflow-y-auto">
                                    {records.map((rec) => (
                                      <button
                                        key={rec.id}
                                        onClick={() => {
                                          setSelectedRecord(prev => ({ ...prev, [item.id]: rec.id }))
                                          setRecDropdownOpen(null)
                                        }}
                                        className={cn(
                                          "w-full text-left px-3 py-2 text-[13px] hover:bg-accent transition-colors",
                                          selectedRec?.id === rec.id ? "text-primary font-bold" : "text-foreground"
                                        )}
                                      >
                                        {rec.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Card preview */}
                            <div className="p-4">
                              <div className="bg-background border border-border rounded-md shadow-sm">
                                {/* Card header */}
                                <div className="p-3 border-b border-border">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[13px] font-bold text-foreground">{item.label} (0)</span>
                                    <button className="px-2 py-1 text-[11px] font-bold border border-border rounded text-foreground hover:bg-accent">
                                      + Add
                                    </button>
                                  </div>
                                </div>
                                {/* Empty state */}
                                <div className="p-6 flex flex-col items-center justify-center text-center">
                                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                    <svg className="w-6 h-6 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
                                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                      <circle cx="9" cy="7" r="4"/>
                                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                  </div>
                                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                                    See the {item.objectType.toLowerCase()}s associated with this record.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="px-4 py-3 bg-muted/50 border-t border-border rounded-b-md">
                              <p className="text-[11px] text-muted-foreground/60">
                                Show up to 5 properties of associated records.
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
