"use client"

import * as React from "react"
import { X, ChevronDown, Search, Trash2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

// Property types and their icons
const PROPERTY_ICONS: Record<string, string> = {
  text: "Abc",
  date: "📅",
  number: "#",
  boolean: "✓",
  dropdown: "▼",
  default: "📄",
}

// Get property type based on property id/name
function getPropertyType(propertyId: string): string {
  if (propertyId.includes("date") || propertyId.includes("time")) return "date"
  if (propertyId.includes("count") || propertyId.includes("number") || propertyId.includes("amount") || propertyId.includes("revenue")) return "number"
  if (propertyId.includes("is_") || propertyId.includes("has_")) return "boolean"
  return "text"
}

// Operators by property type
const OPERATORS_BY_TYPE: Record<string, { id: string; label: string; isNew?: boolean }[]> = {
  text: [
    { id: "is_equal_to_any_of", label: "is equal to any of" },
    { id: "is_equal_to_property", label: "is equal to property", isNew: true },
    { id: "is_not_equal_to_any_of", label: "is not equal to any of" },
    { id: "contains_exactly", label: "contains exactly" },
    { id: "doesnt_contain_exactly", label: "doesn't contain exactly" },
    { id: "contains_any_of", label: "contains any of" },
  ],
  date: [
    { id: "is_equal_to_any_of", label: "is equal to any of" },
    { id: "is_before", label: "is before" },
    { id: "is_after", label: "is after" },
    { id: "is_within_last", label: "is within last" },
    { id: "is_not_within_last", label: "is not within last" },
  ],
  number: [
    { id: "is_equal_to_any_of", label: "is equal to any of" },
    { id: "is_greater_than", label: "is greater than" },
    { id: "is_less_than", label: "is less than" },
    { id: "is_equal_to_property", label: "is equal to property", isNew: true },
  ],
  boolean: [
    { id: "is_true", label: "is true" },
    { id: "is_false", label: "is false" },
  ],
}

interface PropertyGroup {
  group: string
  items: { id: string; label: string }[]
}

interface ConditionalLogicModalProps {
  open: boolean
  onClose: () => void
  onSave: (condition: {
    property: string
    operator: string
    compareProperty?: string
    values?: any[]
    display: "show" | "hide"
  }) => void
  initialCondition?: {
    property: string
    operator: string
    compareProperty?: string
    values?: any[]
    display: "show" | "hide"
  }
  properties: PropertyGroup[]
}

export function ConditionalLogicModal({
  open,
  onClose,
  onSave,
  initialCondition,
  properties,
}: ConditionalLogicModalProps) {
  const [selectedProperty, setSelectedProperty] = React.useState<string | null>(
    initialCondition?.property || null
  )
  const [selectedOperator, setSelectedOperator] = React.useState<string | null>(
    initialCondition?.operator || null
  )
  const [compareProperty, setCompareProperty] = React.useState<string | null>(
    initialCondition?.compareProperty || null
  )
  const [values, setValues] = React.useState<string[]>(
    initialCondition?.values || []
  )
  const [valueInput, setValueInput] = React.useState(
    initialCondition?.values?.join(", ") || ""
  )
  const [display, setDisplay] = React.useState<"show" | "hide">(
    initialCondition?.display || "show"
  )
  const [propDropdownOpen, setPropDropdownOpen] = React.useState(false)
  const [operatorDropdownOpen, setOperatorDropdownOpen] = React.useState(false)
  const [comparePropDropdownOpen, setComparePropDropdownOpen] = React.useState(false)
  const [propSearch, setPropSearch] = React.useState("")
  const [comparePropSearch, setComparePropSearch] = React.useState("")

  const selectedPropType = selectedProperty ? getPropertyType(selectedProperty) : null
  const operators = selectedPropType ? OPERATORS_BY_TYPE[selectedPropType] || OPERATORS_BY_TYPE.text : []
  const showCompareProperty = selectedOperator === "is_equal_to_property"

  const isApplyDisabled = !selectedProperty || !selectedOperator || (showCompareProperty ? !compareProperty : !values.length)

  const handleSave = () => {
    if (!selectedProperty || !selectedOperator) return
    onSave({
      property: selectedProperty,
      operator: selectedOperator,
      ...(showCompareProperty && compareProperty ? { compareProperty } : {}),
      ...(!showCompareProperty && values.length ? { values } : {}),
      display,
    })
  }

  const handleClear = () => {
    setSelectedProperty(null)
    setSelectedOperator(null)
    setCompareProperty(null)
    setDisplay("show")
  }

  const handleClose = () => {
    setPropDropdownOpen(false)
    setOperatorDropdownOpen(false)
    setComparePropDropdownOpen(false)
    setPropSearch("")
    setComparePropSearch("")
    onClose()
  }

  const selectedPropLabel = properties
    .flatMap(cat => cat.items)
    .find(p => p.id === selectedProperty)?.label || ""

  const selectedOpLabel = operators.find(o => o.id === selectedOperator)?.label || ""

  const selectedCompareLabel = properties
    .flatMap(cat => cat.items)
    .find(p => p.id === compareProperty)?.label || ""

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[600px] max-h-[90vh] flex flex-col p-0" showCloseButton={true}>
        <DialogTitle className="sr-only">Conditional Logic</DialogTitle>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Conditional Logic</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: If */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-foreground">If</span>
              {initialCondition && (
                <button
                  onClick={handleClear}
                  className="text-muted-foreground/60 hover:text-destructive transition-colors"
                  aria-label="Clear condition"
                  title="Clear condition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Property Selector */}
            <Popover open={propDropdownOpen} onOpenChange={setPropDropdownOpen}>
              <PopoverTrigger asChild>
                <button className="w-full flex items-center justify-between px-3 py-2 border border-border rounded text-[14px] bg-background hover:bg-accent">
                  {selectedPropLabel || "Select a property"}
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground/60 transition-transform", propDropdownOpen && "rotate-180")} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[560px] max-w-[90vw] p-0 z-[10001] rounded-md border border-border shadow-lg">
                {/* Search */}
                <div className="p-3 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search properties..."
                        value={propSearch}
                        onChange={(e) => setPropSearch(e.target.value)}
                        aria-label="Search properties"
                        className="w-full pl-10 pr-3 py-2 text-[14px] border border-border rounded focus:outline-none focus:border-primary"
                      />
                  </div>
                </div>
                {/* Categories */}
                <div className="max-h-[300px] overflow-y-auto">
                  {properties
                    .filter(cat =>
                      cat.items.some(p =>
                        p.label.toLowerCase().includes(propSearch.toLowerCase()) ||
                        p.id.toLowerCase().includes(propSearch.toLowerCase())
                      )
                    )
                    .map(cat => (
                      <div key={cat.group}>
                        <div className="px-3 py-2 text-[11px] font-bold text-muted-foreground/60 bg-muted/50">
                          {cat.group}
                        </div>
                        {cat.items
                          .filter(p =>
                            p.label.toLowerCase().includes(propSearch.toLowerCase()) ||
                            p.id.toLowerCase().includes(propSearch.toLowerCase())
                          )
                          .map(p => {
                            const type = getPropertyType(p.id)
                            const icon = PROPERTY_ICONS[type] || PROPERTY_ICONS.default
                            return (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setSelectedProperty(p.id)
                                  setSelectedOperator(null)
                                  setCompareProperty(null)
                                  setPropDropdownOpen(false)
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-2.5 hover:bg-accent transition-colors flex items-center gap-2",
                                  selectedProperty === p.id && "bg-accent text-primary font-bold"
                                )}
                              >
                                <span className="w-6 text-center text-[12px] text-muted-foreground/60">
                                  {icon}
                                </span>
                                <span className="text-[14px] truncate">{p.label}</span>
                                {selectedProperty === p.id && <Check className="w-4 h-4 ml-auto" />}
                              </button>
                            )
                          })}
                      </div>
                    ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Section 2: Operator */}
          {selectedProperty && (
            <div className="space-y-3">
              <span className="text-[14px] font-bold text-foreground">Operator</span>

              <Popover open={operatorDropdownOpen} onOpenChange={setOperatorDropdownOpen}>
                <PopoverTrigger asChild>
                  <button className="w-full flex items-center justify-between px-3 py-2 border border-border rounded text-[14px] bg-background hover:bg-accent">
                    {selectedOpLabel || "Select an operator"}
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground/60 transition-transform", operatorDropdownOpen && "rotate-180")} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[560px] max-w-[90vw] p-0 z-[10001] rounded-md border border-border shadow-lg">
                  {/* Search */}
                  <div className="p-3 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search operators..."
                        aria-label="Search operators"
                        className="w-full pl-10 pr-3 py-2 text-[14px] border border-border rounded focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  {/* Operators */}
                  <div className="max-h-[300px] overflow-y-auto">
                    {operators.map(op => (
                      <button
                        key={op.id}
                        onClick={() => {
                          setSelectedOperator(op.id)
                          setOperatorDropdownOpen(false)
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2.5 hover:bg-accent transition-colors flex items-center gap-2",
                          selectedOperator === op.id && "bg-accent text-primary font-bold"
                        )}
                      >
                        <span className="text-[14px]">{op.label}</span>
                        {op.isNew && (
                          <span className="text-[10px] bg-status-info-light text-primary px-2 py-0.5 rounded font-bold">
                            New
                          </span>
                        )}
                        {selectedOperator === op.id && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Third dropdown for "is equal to property" */}
              {showCompareProperty && (
                <div className="space-y-2">
                  <span className="text-[12px] text-muted-foreground">Compare with property:</span>
                  <Popover open={comparePropDropdownOpen} onOpenChange={setComparePropDropdownOpen}>
                    <PopoverTrigger asChild>
                      <button className="w-full flex items-center justify-between px-3 py-2 border border-border rounded text-[14px] bg-background hover:bg-accent">
                        {selectedCompareLabel || "Select a comparison property"}
                        <ChevronDown className={cn("w-4 h-4 text-muted-foreground/60 transition-transform", comparePropDropdownOpen && "rotate-180")} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[560px] max-w-[90vw] p-0 z-[10001] rounded-md border border-border shadow-lg">
                      {/* Search */}
                      <div className="p-3 border-b border-border">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search properties..."
                            value={comparePropSearch}
                            onChange={(e) => setComparePropSearch(e.target.value)}
                            aria-label="Search comparison properties"
                            className="w-full pl-10 pr-3 py-2 text-[14px] border border-border rounded focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      {/* Categories - only show same type */}
                      <div className="max-h-[300px] overflow-y-auto">
                        {properties
                          .filter(cat =>
                            cat.items.some(p =>
                              getPropertyType(p.id) === selectedPropType &&
                              (p.label.toLowerCase().includes(comparePropSearch.toLowerCase()) ||
                                p.id.toLowerCase().includes(comparePropSearch.toLowerCase()))
                            )
                          )
                          .map(cat => (
                            <div key={cat.group}>
                              <div className="px-3 py-2 text-[11px] font-bold text-muted-foreground/60 bg-muted/50">
                                {cat.group}
                              </div>
                              {cat.items
                                .filter(p =>
                                  getPropertyType(p.id) === selectedPropType &&
                                  (p.label.toLowerCase().includes(comparePropSearch.toLowerCase()) ||
                                    p.id.toLowerCase().includes(comparePropSearch.toLowerCase()))
                                )
                                .map(p => {
                                  const type = getPropertyType(p.id)
                                  const icon = PROPERTY_ICONS[type] || PROPERTY_ICONS.default
                                  return (
                                    <button
                                      key={p.id}
                                      onClick={() => {
                                        setCompareProperty(p.id)
                                        setComparePropDropdownOpen(false)
                                      }}
                                      className={cn(
                                        "w-full text-left px-3 py-2.5 hover:bg-accent transition-colors flex items-center gap-2",
                                        compareProperty === p.id && "bg-accent text-primary font-bold"
                                      )}
                                    >
                                      <span className="w-6 text-center text-[12px] text-muted-foreground/60">
                                        {icon}
                                      </span>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-[14px] truncate">{p.label}</div>
                                        <div className="text-[11px] text-muted-foreground/60 truncate">
                                          {p.id.replace(/_/g, " ")}
                                        </div>
                                      </div>
                                      {compareProperty === p.id && <Check className="w-4 h-4 ml-auto" />}
                                    </button>
                                  )
                                })}
                            </div>
                          ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
             </div>
           )}

             {/* Section 2.5: Value input for non-is equal to property operators */}
             {selectedOperator && !showCompareProperty && (
               <div className="space-y-3">
                 <span className="text-[14px] font-bold text-foreground">Value(s)</span>
                 <input
                   type="text"
                   placeholder="Enter values (comma-separated)"
                   value={valueInput}
                   onChange={(e) => {
                     setValueInput(e.target.value)
                     setValues(e.target.value.split(",").map(v => v.trim()).filter(Boolean))
                   }}
                   aria-label="Enter values"
                   className="w-full px-3 py-2 text-[14px] border border-border rounded focus:outline-none focus:border-primary"
                 />
                 {values.length > 0 && (
                   <div className="flex flex-wrap gap-1.5">
                     {values.map((val, i) => (
                       <span key={i} className="inline-flex items-center gap-1 bg-accent text-foreground text-[12px] px-2 py-1 rounded">
                         {val}
                         <button
                           onClick={() => {
                             const newValues = values.filter((_, idx) => idx !== i)
                             setValues(newValues)
                             setValueInput(newValues.join(", "))
                           }}
                           className="text-muted-foreground/60 hover:text-destructive"
                         >
                           <X className="w-3 h-3" />
                         </button>
                       </span>
                     ))}
                   </div>
                 )}
               </div>
             )}

           {/* Section 3: Then */}
          {selectedProperty && selectedOperator && (
            <div className="space-y-3">
              <span className="text-[14px] font-bold text-foreground">Then</span>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full flex items-center justify-between px-3 py-2 border border-border rounded text-[14px] bg-background hover:bg-accent">
                    {display === "show" ? "Show this card" : "Hide this card"}
                    <ChevronDown className="w-4 h-4 text-muted-foreground/60" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 z-[10001] rounded-md border border-border shadow-lg">
                  <div className="py-1">
                    <button
                      onClick={() => setDisplay("show")}
                      className={cn(
                        "w-full text-left px-3 py-2.5 hover:bg-accent transition-colors",
                        display === "show" && "text-primary font-bold"
                      )}
                    >
                      Show this card
                      {display === "show" && <Check className="w-4 h-4 ml-auto inline-block" />}
                    </button>
                    <button
                      onClick={() => setDisplay("hide")}
                      className={cn(
                        "w-full text-left px-3 py-2.5 hover:bg-accent transition-colors",
                        display === "hide" && "text-primary font-bold"
                      )}
                    >
                      Hide this card
                      {display === "hide" && <Check className="w-4 h-4 ml-auto inline-block" />}
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-start gap-3 px-6 py-4 border-t border-border bg-muted/50">
          <button
            onClick={handleSave}
            disabled={isApplyDisabled}
            className={cn(
              "px-6 py-2 rounded text-[14px] font-bold transition-colors",
              isApplyDisabled
                ? "bg-border text-muted-foreground/60 cursor-not-allowed"
                : "bg-foreground text-primary-foreground hover:bg-foreground"
            )}
          >
            Apply
          </button>
          <button
            onClick={handleClose}
            className="px-6 py-2 border border-border rounded text-[14px] font-bold text-foreground bg-background hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
