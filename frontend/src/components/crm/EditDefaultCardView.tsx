"use client"

import * as React from "react"
import { Info, ChevronDown, Layout, Settings, GripVertical, Search, SlidersHorizontal, X, Trash2, ChevronUp, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"

interface EditDefaultCardViewProps {
  card: { id: string, label: string }
  onClose: () => void
  onSave: (card: { id: string, label: string; properties?: { id: string; name: string }[] }) => void
}

export function EditDefaultCardView({ card, onClose, onSave }: EditDefaultCardViewProps) {
  const [title, setTitle] = React.useState(card.label)
  const [internalName, setInternalName] = React.useState(`${card.label} Association card (default)`)
  const [isEditingInternal, setIsEditingInternal] = React.useState(false)
  const [properties, setProperties] = React.useState([
    { id: 'ca1', name: 'Name' },
    { id: 'ca2', name: 'Total Price' },
    { id: 'ca3', name: 'Created Date' },
    { id: 'ca4', name: 'Status' }
  ])
  const [objectType, setObjectType] = React.useState(card.label || "")
  const [objectTypeOpen, setObjectTypeOpen] = React.useState(false)
  const [addPropertiesOpen, setAddPropertiesOpen] = React.useState(false)
  const OBJECT_TYPES = ['Company', 'Contact', 'Deal', 'Order', 'Product', 'Ticket']
  const isPropertiesDisabled = !OBJECT_TYPES.includes(objectType) || !objectType

  const handleObjectTypeSelect = (type: string) => {
    setObjectType(type)
    setObjectTypeOpen(false)
    setProperties(prev => prev.filter(p => p.id.startsWith('1') || p.id.startsWith('2') || p.id.startsWith('3')))
    setAddPropertiesOpen(false)
  }

  const AVAILABLE_PROPERTIES: Record<string, {id: string, name: string}[]> = {
    'Cart': [
      {id: 'ca1', name: 'Name'},
      {id: 'ca2', name: 'Total Price'},
      {id: 'ca3', name: 'Created Date'},
      {id: 'ca4', name: 'Status'},
      {id: 'ca5', name: 'Item Count'},
      {id: 'ca6', name: 'Customer Email'},
    ],
    'Company': [
      {id: 'co1', name: 'Company name'},
      {id: 'co2', name: 'Company Domain Name'},
      {id: 'co3', name: 'Phone Number'},
      {id: 'co4', name: 'Industry'},
      {id: 'co5', name: 'Annual Revenue'},
      {id: 'co6', name: 'Number of Employees'},
    ],
    'Contact': [
      {id: 'c1', name: 'Email'},
      {id: 'c2', name: 'Phone Number'},
      {id: 'c3', name: 'First Name'},
      {id: 'c4', name: 'Last Name'},
      {id: 'c5', name: 'Job Title'},
      {id: 'c6', name: 'Company'},
    ],
    'Deal': [
      {id: 'd1', name: 'Deal name'},
      {id: 'd2', name: 'Amount'},
      {id: 'd3', name: 'Deal stage'},
      {id: 'd4', name: 'Close date'},
      {id: 'd5', name: 'Probability'},
      {id: 'd6', name: 'Owner'},
    ],
    'Order': [
      {id: 'o1', name: 'Order ID'},
      {id: 'o2', name: 'Order Total'},
      {id: 'o3', name: 'Order Date'},
      {id: 'o4', name: 'Status'},
      {id: 'o5', name: 'Payment Method'},
      {id: 'o6', name: 'Shipping Address'},
    ],
    'Payment': [
      {id: 'pa1', name: 'Payment ID'},
      {id: 'pa2', name: 'Amount'},
      {id: 'pa3', name: 'Payment Date'},
      {id: 'pa4', name: 'Payment Method'},
      {id: 'pa5', name: 'Status'},
      {id: 'pa6', name: 'Transaction ID'},
    ],
    'Payment Link': [
      {id: 'pl1', name: 'Link ID'},
      {id: 'pl2', name: 'Amount'},
      {id: 'pl3', name: 'Created Date'},
      {id: 'pl4', name: 'Expiry Date'},
      {id: 'pl5', name: 'Status'},
      {id: 'pl6', name: 'Clicks'},
    ],
    'Subscription': [
      {id: 's1', name: 'Subscription ID'},
      {id: 's2', name: 'Plan Name'},
      {id: 's3', name: 'Billing Cycle'},
      {id: 's4', name: 'Next Billing Date'},
      {id: 's5', name: 'Status'},
      {id: 's6', name: 'Amount'},
    ],
    'Ticket': [
      {id: 't1', name: 'Ticket ID'},
      {id: 't2', name: 'Subject'},
      {id: 't3', name: 'Priority'},
      {id: 't4', name: 'Status'},
      {id: 't5', name: 'Assigned To'},
      {id: 't6', name: 'Created Date'},
    ],
  }

  const [draggingId, setDraggingId] = React.useState<string | null>(null)
  const [dragOverId, setDragOverId] = React.useState<string | null>(null)

  const handleDragStart = (id: string) => {
    setDraggingId(id)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (id !== draggingId) {
      setDragOverId(id)
    }
  }

  const handleDrop = (id: string) => {
    if (!draggingId || draggingId === id) return

    const oldIndex = properties.findIndex(p => p.id === draggingId)
    const newIndex = properties.findIndex(p => p.id === id)

    const newProperties = [...properties]
    const [removed] = newProperties.splice(oldIndex, 1)
    newProperties.splice(newIndex, 0, removed)

    setProperties(newProperties)
    setDraggingId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverId(null)
  }

  return (
    <Sheet open={true} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="w-[800px] p-0 max-w-[90vw]" showCloseButton={false}>
        <SheetTitle className="sr-only">Edit default card</SheetTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 bg-background border-b border-border shadow-sm">
          <h2 className="text-xl font-bold text-foreground">Edit default card</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-accent rounded-full transition-colors">
            <X className="w-5 h-5 text-foreground" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 flex overflow-y-auto lg:overflow-hidden flex-col lg:flex-row">
          {/* Left Column - Configuration */}
          <div className="w-full lg:w-[400px] shrink-0 lg:border-r border-border bg-background lg:overflow-y-auto p-6 crm-scrollbar">
            <div className="space-y-6 max-w-[420px]">
              <div className="flex justify-end">
                <button className="text-[12px] text-primary hover:underline flex items-center gap-1 font-bold">
                  Added to: <span className="underline">1 view</span>
                </button>
              </div>

              {/* Card Title */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
                  Card title * <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded text-[14px] focus:outline-none focus:border-primary"
                  />
                  <button aria-label="Column settings" className="px-3 border border-border rounded hover:bg-accent text-foreground">
                    <Settings className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="text-[11px] text-muted-foreground/60 flex items-center gap-1 flex-wrap min-h-[16px]">
                  <span>Internal name</span>
                  <Info className="w-3 h-3" />
                  <span>:</span>
                  {isEditingInternal ? (
                    <input
                      autoFocus
                      type="text"
                      value={internalName}
                      onChange={(e) => setInternalName(e.target.value)}
                      onBlur={() => setIsEditingInternal(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingInternal(false)}
                      aria-label="Internal name"
                      className="flex-1 min-w-[150px] border-b border-primary outline-none text-primary bg-transparent"
                    />
                  ) : (
                    <span
                      className="text-primary cursor-pointer hover:underline"
                      onClick={() => setIsEditingInternal(true)}
                    >
                      {internalName} <span className="ml-1">✎</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Properties */}
              <div className="space-y-4">
                <h3 className="text-[16px] font-bold text-foreground">Properties</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Decide which properties should appear on this card.
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-muted-foreground">Object Type:</span>
                  <Popover open={objectTypeOpen} onOpenChange={setObjectTypeOpen}>
                    <PopoverTrigger asChild>
                      <button className="text-[13px] font-bold text-foreground flex items-center gap-1 hover:bg-accent px-2 py-1 rounded transition-colors">
                        {objectType || "Choose an object type"} <ChevronDown className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-0 z-[10000] rounded-md border border-border shadow-md">
                      <div className="py-1">
                        {OBJECT_TYPES.map((type) => (
                          <button
                            key={type}
                            onClick={() => handleObjectTypeSelect(type)}
                            className={cn(
                              "w-full text-left px-3 py-2 text-[14px] hover:bg-accent transition-colors",
                              objectType === type ? "text-primary font-bold" : "text-foreground"
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <Popover open={!isPropertiesDisabled && addPropertiesOpen} onOpenChange={(open) => !isPropertiesDisabled && setAddPropertiesOpen(open)}>
                  <PopoverTrigger asChild>
                    <button
                      disabled={isPropertiesDisabled}
                      title={isPropertiesDisabled ? "Please select an Object Type first" : undefined}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 border rounded text-[14px] font-bold transition-colors",
                        isPropertiesDisabled
                          ? "border-border bg-muted/50 text-muted-foreground/60 cursor-not-allowed"
                          : "border-border bg-background text-foreground hover:bg-accent"
                      )}
                    >
                      Add properties ({properties.length}/6) <ChevronDown className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 z-[10000] rounded-md border border-border shadow-md max-h-[300px] overflow-y-auto">
                    <div className="py-1 max-h-[300px] overflow-y-auto">
                      {(AVAILABLE_PROPERTIES[objectType] || []).filter(prop => !properties.some(p => p.name === prop.name)).map((prop) => {
                        const isDisabled = properties.length >= 6
                        return (
                          <button
                            key={prop.id}
                            onClick={() => {
                              if (!isDisabled) {
                                setProperties(prev => [...prev, prop])
                                if (properties.length + 1 >= 6) {
                                  setAddPropertiesOpen(false)
                                }
                              }
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-[14px] hover:bg-accent transition-colors",
                              isDisabled ? "opacity-50 cursor-not-allowed" : "text-foreground"
                            )}
                            disabled={isDisabled}
                          >
                            {prop.name}
                          </button>
                        )
                      })}
                      {(AVAILABLE_PROPERTIES[objectType] || []).filter(prop => !properties.some(p => p.name === prop.name)).length === 0 && (
                        <div className="px-3 py-2 text-[14px] text-muted-foreground/60">No more properties available</div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Draggable Property Rows */}
                <div className="space-y-3 pt-2">
                  {properties.map((prop) => {
                    const isRequired = prop.name === 'Company name'
                    return (
                    <div
                      key={prop.id}
                      draggable
                      onDragStart={() => handleDragStart(prop.id)}
                      onDragOver={(e) => handleDragOver(e, prop.id)}
                      onDrop={() => handleDrop(prop.id)}
                      onDragEnd={handleDragEnd}
                      className="flex items-center gap-2"
                    >
                      <div className={cn(
                        "flex-1 flex items-center border rounded px-3 py-2 group transition-all",
                        dragOverId === prop.id ? "border-primary bg-accent" : "border-border",
                        draggingId === prop.id ? "opacity-30 scale-[0.98]" : "opacity-100",
                        isRequired
                          ? "bg-muted border-border cursor-grab active:cursor-grabbing"
                          : "bg-muted/50 cursor-grab active:cursor-grabbing hover:border-border"
                      )}>
                        <GripVertical className={cn(
                          "w-4 h-4 mr-2",
                          isRequired ? "text-muted-foreground/70" : "text-border"
                        )} />
                        <div className="flex-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[14px]",
                              isRequired ? "text-foreground font-bold" : "text-foreground"
                            )}>
                              {prop.name}
                            </span>
                            {isRequired && (
                              <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded uppercase tracking-wider">Required</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <ChevronDown className="w-4 h-4 text-muted-foreground/60 hover:text-foreground cursor-pointer" />
                            <ChevronUp className="w-4 h-4 text-muted-foreground/60 hover:text-foreground cursor-pointer" />
                            {!isRequired && (
                              <>
                                <div className="w-px h-4 bg-border mx-1" />
                                <Trash2
                                  className="w-4 h-4 text-muted-foreground/60 hover:text-destructive cursor-pointer"
                                  onClick={(e) => { e.stopPropagation(); setProperties(prev => prev.filter(p => p.id !== prop.id)) }}
                                />
                              </>
                            )}
                            {isRequired && (
                              <div className="w-4 h-4 ml-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Table Details */}
              <div className="space-y-6">
                <h3 className="text-[16px] font-bold text-foreground">Table details</h3>

                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
                    Filter <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </label>
                  <button className="text-[12px] font-bold text-foreground flex items-center gap-1.5 hover:text-primary">
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Manage filters
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
                    Quick filters <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </label>
                  <div className="flex items-center gap-2">
                    <button className="text-[12px] font-bold text-foreground flex items-center gap-0.5 hover:text-primary">
                      1 quick filter <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="flex-1 bg-muted/50 p-6 lg:p-12 flex flex-col items-center lg:overflow-y-auto">
            <div className="w-full max-w-[500px] flex flex-col gap-4">
              <h3 className="text-[13px] font-bold text-muted-foreground self-start uppercase tracking-wider">PREVIEW</h3>

              <div className="w-full bg-background border border-border rounded-md shadow-sm">
                <div className="p-3 border-b border-border">
                  <button className="w-full flex items-center justify-between px-3 py-1.5 border border-border rounded text-[14px] text-foreground hover:bg-accent">
                    Brian Halligan (Sample Contact) <ChevronDown className="w-4 h-4 text-muted-foreground/60" />
                  </button>
                </div>

                <div className="p-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[14px] font-bold text-foreground">{title} (0)</h4>
                    <button className="text-[12px] font-bold text-primary hover:underline">+ Add</button>
                  </div>

                  {/* Empty State */}
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Layout className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-[13px] text-muted-foreground text-center">See the {title} associated with this record.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-background border-t border-border flex justify-start">
          <button
            onClick={() => onSave({ id: card.id, label: title, properties: properties })}
            className="px-6 py-2 bg-foreground rounded text-[14px] font-bold text-primary-foreground hover:bg-foreground transition-colors"
          >
            Save
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
