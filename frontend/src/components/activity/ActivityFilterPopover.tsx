"use client"

import * as React from "react"
import { Search, ChevronDown, Check, Maximize2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export const ACTIVITY_CATEGORIES = [
  {
    name: "Communication",
    items: ["Calls"]
  },
  {
    name: "Team activity",
    items: ["Notes", "Tasks"]
  },
  {
    name: "Updates",
    items: ["Lifecycle changes", "Tickets"]
  }
]

export const ALL_ACTIVITY_TYPES = ACTIVITY_CATEGORIES.flatMap(c => c.items)

interface ActivityFilterPopoverProps {
  selectedItems: string[]
  onSelectionChange: (items: string[]) => void
}

export function ActivityFilterPopover({ selectedItems, onSelectionChange }: ActivityFilterPopoverProps) {
  const [searchTerm, setSearchTerm] = React.useState("")

  const toggleItem = (item: string) => {
    const newSelection = selectedItems.includes(item) 
      ? selectedItems.filter(i => i !== item) 
      : [...selectedItems, item]
    onSelectionChange(newSelection)
  }

  const toggleCategory = (category: string) => {
    const catItems = ACTIVITY_CATEGORIES.find(c => c.name === category)?.items || []
    const allSelected = catItems.every(i => selectedItems.includes(i))
    let newSelection: string[]
    if (allSelected) {
      newSelection = selectedItems.filter(i => !catItems.includes(i))
    } else {
      newSelection = Array.from(new Set([...selectedItems, ...catItems]))
    }
    onSelectionChange(newSelection)
  }

  const filteredCategories = ACTIVITY_CATEGORIES.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0)

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionChange([])
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 bg-muted border border-border rounded px-3 py-1.5 cursor-pointer group outline-none focus:ring-2 focus:ring-primary/20">
          <span className="text-[14px] font-bold text-foreground">
            Activity ({selectedItems.length}/{ALL_ACTIVITY_TYPES.length})
          </span>
          <span 
            className="text-muted-foreground group-hover:text-foreground/70 transition-colors"
            onClick={handleClear}
          >
            ×
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[820px] max-w-[calc(100vw-2rem)] p-0 shadow-xl border-border rounded-md overflow-hidden z-50">
        {/* Popover Header with Search */}
        <div className="p-3 border-b border-border bg-background">
           <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search" 
                  aria-label="Search activities"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-[14px] border border-input rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-muted-foreground text-foreground" 
                />
              </div>
              <button className="p-1.5 hover:bg-muted rounded">
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
              </button>
           </div>
        </div>

        {/* Categories List */}
        <div className="p-6 max-h-[500px] overflow-y-auto crm-scrollbar bg-background">
           <div className="grid grid-cols-3 gap-x-12 gap-y-8 items-start">
              {filteredCategories.map((cat) => {
                const catAllSelected = cat.items.every(i => selectedItems.includes(i))
                const catSomeSelected = cat.items.some(i => selectedItems.includes(i))
                
                return (
                  <div key={cat.name} className="flex flex-col gap-3">
                    {/* Category Header */}
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => toggleCategory(cat.name)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCategory(cat.name) } }}>
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                          catAllSelected 
                            ? "bg-primary border-primary" 
                            : catSomeSelected
                              ? "bg-background border-primary text-primary"
                              : "bg-background border-input"
                        )}>
                          {catAllSelected ? (
                            <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                          ) : catSomeSelected ? (
                            <div className="w-2 h-[2px] bg-primary" />
                          ) : null}
                        </div>
                        <span className="text-[14px] font-bold text-foreground">{cat.name}</span>
                    </div>

                    {/* Category Items */}
                    <div className="flex flex-col gap-2.5 ml-6">
                        {cat.items.map((item) => (
                          <div key={item} className="flex items-center gap-2.5 group cursor-pointer" onClick={() => toggleItem(item)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleItem(item) } }}>
                            <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                                selectedItems.includes(item) ? "bg-primary border-primary" : "bg-background border-input group-hover:border-primary"
                            )}>
                                {selectedItems.includes(item) && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                            </div>
                            <span className="text-[14px] text-foreground group-hover:text-primary whitespace-nowrap">{item}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )
              })}
           </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
