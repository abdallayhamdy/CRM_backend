"use client"

import * as React from "react"
import { Info, ChevronDown, Layout, Settings, GripVertical, SlidersHorizontal, X, Trash2, ChevronUp, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { CRM_PROPERTIES, type CRMProperty } from "@/data/crm-properties"

const SAMPLE_RECORDS: Record<string, { id: string, name: string }[]> = {
  'Contact': [{ id: '1', name: 'Brian Halligan (Sample Contact)' }],
  'Company': [{ id: '1', name: 'Rootline (Sample Company)' }],
  'Deal': [{ id: '1', name: 'Enterprise License (Sample Deal)' }],
  'Ticket': [{ id: '1', name: 'Login Issue (Sample Ticket)' }],
  'Order': [{ id: '1', name: 'Order #1001 (Sample Order)' }],
  'Cart': [{ id: '1', name: 'Abandoned Cart (Sample Cart)' }],
  'Payment': [{ id: '1', name: 'Payment #1234 (Sample Payment)' }],
  'Payment Link': [{ id: '1', name: 'Checkout Link (Sample Payment Link)' }],
  'Subscription': [{ id: '1', name: 'Premium Plan (Sample Subscription)' }],
}

interface CreateRightCardViewProps {
  type?: 'association' | 'workflow'
  onClose: () => void
  onSave: (card: {
    id: string
    label: string
    type: 'association' | 'workflow'
    objectType?: string
    properties?: CRMProperty[]
    quickFilters?: string[]
    sortBy?: string
    sortDirection?: 'asc' | 'desc'
  }) => void
}

export function CreateRightCardView({ type = 'association', onClose, onSave }: CreateRightCardViewProps) {
  const [title, setTitle] = React.useState(type === 'workflow' ? "Enroll in Workflow" : "Associations")
  const [internalName, setInternalName] = React.useState(
    type === 'workflow'
      ? `New workflow card - ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`
      : `New associations card - ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`
  )
  const [isEditingInternal, setIsEditingInternal] = React.useState(false)
  const [objectType, setObjectType] = React.useState("")
  const [objectTypeOpen, setObjectTypeOpen] = React.useState(false)
  const [objectTypeSearch, setObjectTypeSearch] = React.useState("")
  const [addPropertiesOpen, setAddPropertiesOpen] = React.useState(false)
  const [selectedProperties, setSelectedProperties] = React.useState<CRMProperty[]>([])
  const [quickFilters, setQuickFilters] = React.useState<string[]>([])
  const [sortBy, setSortBy] = React.useState("")
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')
  const [sortByOpen, setSortByOpen] = React.useState(false)
  const [quickFiltersOpen, setQuickFiltersOpen] = React.useState(false)

  const OBJECT_TYPES = Object.keys(CRM_PROPERTIES).sort()
  const isObjectTypeSelected = objectType !== ""
  const isPropertiesDisabled = !isObjectTypeSelected
  const isSaveDisabled = !title.trim() || !isObjectTypeSelected

  const filteredObjectTypes = OBJECT_TYPES.filter(t =>
    t.toLowerCase().includes(objectTypeSearch.toLowerCase())
  )

  const handleObjectTypeSelect = (type: string) => {
    setObjectType(type)
    setObjectTypeOpen(false)
    setObjectTypeSearch("")
    setSelectedProperties([])
    setQuickFilters([])
    setSortBy("")
    setAddPropertiesOpen(false)
  }

  const handlePropertyToggle = (prop: CRMProperty) => {
    setSelectedProperties(prev => {
      const isSelected = prev.some(p => p.id === prop.id)
      if (isSelected) {
        setQuickFilters(f => f.filter(id => id !== prop.id))
        if (sortBy === prop.id) setSortBy("")
        return prev.filter(p => p.id !== prop.id)
      }
      if (prev.length >= 6) return prev
      return [...prev, prop]
    })
  }

  const handleQuickFilterToggle = (propId: string) => {
    setQuickFilters(prev =>
      prev.includes(propId)
        ? prev.filter(id => id !== propId)
        : [...prev, propId]
    )
  }

  const handleSortSelect = (propId: string) => {
    setSortBy(propId)
    setSortByOpen(false)
  }

  const handleSave = () => {
    if (isSaveDisabled) return
    onSave({
      id: `assoc_${Date.now()}`,
      label: title,
      type: 'association',
      objectType,
      properties: selectedProperties,
      quickFilters,
      sortBy,
      sortDirection,
    })
  }

  return (
    <Sheet open={true} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="w-[800px] p-0 max-w-[90vw]" showCloseButton={false}>
        <SheetTitle className="sr-only">Create card</SheetTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 bg-background border-b border-border shadow-sm">
          <h2 className="text-xl font-bold text-foreground">Create card</h2>
          <button onClick={onClose} aria-label="Close" className="p-2 hover:bg-accent rounded-full transition-colors">
            <X className="w-5 h-5 text-foreground" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 flex overflow-y-auto lg:overflow-hidden flex-col lg:flex-row">
          {/* Left Column - Configuration */}
          <div className="w-full lg:w-[400px] shrink-0 lg:border-r border-border bg-background lg:overflow-y-auto p-6 crm-scrollbar">
            <div className="space-y-6 max-w-[420px]">
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
                  <button aria-label="Card settings" className="px-3 border border-border rounded hover:bg-accent text-foreground">
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

                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-foreground">Object Type:</label>
                  <Popover open={objectTypeOpen} onOpenChange={setObjectTypeOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 border rounded text-[14px] font-bold transition-colors",
                          isObjectTypeSelected
                            ? "border-border bg-background text-foreground hover:bg-accent"
                            : "border-border bg-muted/50 text-muted-foreground/60"
                        )}
                      >
                        {objectType || "Choose an object type"} <ChevronDown className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0 z-[10000] rounded-md border border-border shadow-md" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search object types..."
                          value={objectTypeSearch}
                          onValueChange={setObjectTypeSearch}
                        />
                        <CommandList className="max-h-[240px]">
                          <CommandEmpty>No object type found.</CommandEmpty>
                          <CommandGroup>
                            {filteredObjectTypes.map((type) => (
                              <CommandItem
                                key={type}
                                value={type}
                                onSelect={() => handleObjectTypeSelect(type)}
                                className="flex items-center justify-between cursor-pointer"
                              >
                                <span>{type}</span>
                                {objectType === type && <Check className="w-4 h-4 text-primary" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
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
                      Add properties ({selectedProperties.length}/6) <ChevronDown className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 z-[10000] rounded-md border border-border shadow-md max-h-[300px] overflow-y-auto">
                    <div className="py-1 max-h-[300px] overflow-y-auto">
                      {(CRM_PROPERTIES[objectType] || []).filter(prop => !selectedProperties.some(p => p.id === prop.id)).map((prop) => {
                        const isDisabled = selectedProperties.length >= 6
                        return (
                          <button
                            key={prop.id}
                            onClick={() => !isDisabled && handlePropertyToggle(prop)}
                            className={cn(
                              "w-full text-left px-3 py-2 text-[14px] hover:bg-accent transition-colors",
                              isDisabled ? "opacity-50 cursor-not-allowed" : "text-foreground"
                            )}
                            disabled={isDisabled}
                          >
                            {prop.label}
                          </button>
                        )
                      })}
                      {(CRM_PROPERTIES[objectType] || []).filter(prop => !selectedProperties.some(p => p.id === prop.id)).length === 0 && (
                        <div className="px-3 py-2 text-[14px] text-muted-foreground/60">No more properties available</div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Draggable Property Rows */}
                <div className="space-y-3 pt-2">
                  {selectedProperties.map((prop, index) => (
                    <div
                      key={prop.id}
                      className="flex items-center gap-2"
                    >
                      <div className="flex-1 flex items-center border border-border rounded px-3 py-2 bg-muted/50 cursor-grab active:cursor-grabbing hover:border-border">
                        <GripVertical className="w-4 h-4 mr-2 text-border" />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-[14px] text-foreground">{prop.label}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (index > 0) {
                                  setSelectedProperties(prev => {
                                    const newArr = [...prev]
                                    ;[newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]]
                                    return newArr
                                  })
                                }
                              }}
                              disabled={index === 0}
                              className={cn("p-1", index === 0 ? "text-muted-foreground/30" : "text-muted-foreground/60 hover:text-foreground")}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (index < selectedProperties.length - 1) {
                                  setSelectedProperties(prev => {
                                    const newArr = [...prev]
                                    ;[newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]]
                                    return newArr
                                  })
                                }
                              }}
                              disabled={index === selectedProperties.length - 1}
                              className={cn("p-1", index === selectedProperties.length - 1 ? "text-muted-foreground/30" : "text-muted-foreground/60 hover:text-foreground")}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <div className="w-px h-4 bg-border mx-1" />
                            <Trash2
                              className="w-4 h-4 text-muted-foreground/60 hover:text-destructive cursor-pointer"
                              onClick={() => handlePropertyToggle(prop)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                  <Popover open={quickFiltersOpen} onOpenChange={setQuickFiltersOpen}>
                    <PopoverTrigger asChild>
                      <button
                        disabled={selectedProperties.length === 0}
                        className={cn(
                          "text-[12px] font-bold flex items-center gap-1.5",
                          selectedProperties.length === 0
                            ? "text-muted-foreground/60 cursor-not-allowed"
                            : "text-primary hover:underline"
                        )}
                      >
                        Add quick filters <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-0 z-[10000] rounded-md border border-border shadow-md" align="end">
                      <div className="py-1 max-h-[200px] overflow-y-auto">
                        {selectedProperties.map((prop) => (
                          <button
                            key={prop.id}
                            onClick={() => handleQuickFilterToggle(prop.id)}
                            className={cn(
                              "w-full text-left px-3 py-2 text-[13px] hover:bg-accent transition-colors flex items-center justify-between",
                              quickFilters.includes(prop.id) ? "text-primary font-bold" : "text-foreground"
                            )}
                          >
                            {prop.label}
                            {quickFilters.includes(prop.id) && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {quickFilters.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {quickFilters.map((propId) => {
                      const prop = selectedProperties.find(p => p.id === propId)
                      if (!prop) return null
                      return (
                        <button
                          key={propId}
                          onClick={() => handleQuickFilterToggle(propId)}
                          className="px-3 py-1 bg-background border border-border rounded-full text-[12px] font-bold text-foreground hover:bg-accent flex items-center gap-1"
                        >
                          {prop.label}
                          <X className="w-3 h-3" />
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-foreground flex items-center gap-1.5">
                    Sort by <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
                  </label>
                  <div className="flex items-center gap-2">
                    <Popover open={sortByOpen} onOpenChange={setSortByOpen}>
                      <PopoverTrigger asChild>
                        <button
                          disabled={selectedProperties.length === 0}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 border border-border rounded text-[12px] font-bold transition-colors",
                            selectedProperties.length === 0
                              ? "text-muted-foreground/60 cursor-not-allowed"
                              : "text-foreground hover:bg-accent"
                          )}
                        >
                          {sortBy ? selectedProperties.find(p => p.id === sortBy)?.label : "Choose a property"}
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0 z-[10000] rounded-md border border-border shadow-md" align="end">
                        <div className="py-1 max-h-[200px] overflow-y-auto">
                          {selectedProperties.map((prop) => (
                            <button
                              key={prop.id}
                              onClick={() => handleSortSelect(prop.id)}
                              className={cn(
                                "w-full text-left px-3 py-2 text-[13px] hover:bg-accent transition-colors",
                                sortBy === prop.id ? "text-primary font-bold" : "text-foreground"
                              )}
                            >
                              {prop.label}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <div className="flex border border-border rounded overflow-hidden">
                      <button
                        onClick={() => setSortDirection('asc')}
                        className={cn(
                          "p-1.5 border-r border-border",
                          sortDirection === 'asc' ? "bg-foreground text-primary-foreground" : "hover:bg-accent bg-muted/50"
                        )}
                        aria-label="Ascending"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSortDirection('desc')}
                        className={cn(
                          "p-1.5",
                          sortDirection === 'desc' ? "bg-foreground text-primary-foreground" : "hover:bg-accent"
                        )}
                        aria-label="Descending"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                    {(SAMPLE_RECORDS[objectType] || [{ name: 'Select a record' }])[0].name}
                    <ChevronDown className="w-4 h-4 text-muted-foreground/60" />
                  </button>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[14px] font-bold text-foreground">{title} ({selectedProperties.length > 0 ? '1' : '0'})</h4>
                    {selectedProperties.length > 0 && (
                      <button className="text-[12px] font-bold text-primary hover:underline">+ Add</button>
                    )}
                  </div>

                  {!isObjectTypeSelected ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-20 h-20 mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Layout className="w-10 h-10 text-muted-foreground/40" />
                      </div>
                      <p className="text-[13px] text-muted-foreground text-center max-w-[280px] leading-relaxed">
                        Use the section on the left to choose what appears on this card.
                      </p>
                    </div>
                  ) : selectedProperties.length === 0 ? (
                    /* Object Type Selected, No Properties */
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Layout className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-[13px] text-muted-foreground text-center">
                        Add properties to see them on this card.
                      </p>
                    </div>
                  ) : (
                    /* Property Preview Card */
                    <div className="bg-background border border-border rounded p-4 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center border border-border">
                          <Layout className="w-4 h-4 text-muted-foreground/70" />
                        </div>
                        <span className="text-[13px] font-bold text-primary hover:underline cursor-pointer">
                          {objectType} Record
                        </span>
                      </div>

                      <div className="space-y-2">
                        {selectedProperties.map((prop) => (
                          <div key={prop.id} className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground/60">{prop.label}:</span>
                            <span className="text-foreground">Sample value</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-background border-t border-border flex justify-start">
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className={cn(
              "px-6 py-2 rounded text-[14px] font-bold transition-colors",
              isSaveDisabled
                ? "bg-muted text-muted-foreground/60 cursor-not-allowed"
                : "bg-foreground text-primary-foreground hover:bg-foreground/90"
            )}
          >
            Save
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
