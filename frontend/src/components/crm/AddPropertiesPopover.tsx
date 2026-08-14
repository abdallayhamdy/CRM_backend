import * as React from "react"
import { ChevronDown, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AVAILABLE_PROPERTIES } from "./edit-card-drawer-constants"

type PropertyItem = {
  id: string
  label: string
  value?: string
  isBadge?: boolean
  isTag?: boolean
}

export function AddPropertiesPopover({
  properties,
  onPropertiesChange,
}: {
  properties: PropertyItem[]
  onPropertiesChange: React.Dispatch<React.SetStateAction<PropertyItem[]>>
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="w-full py-1.5 text-[14px] font-bold text-foreground border border-border rounded hover:bg-accent transition-colors flex items-center justify-center gap-1">
          Add properties ({properties.length}/50) <ChevronDown className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="z-[10000] w-[350px] p-0 border border-border rounded-md shadow-lg overflow-hidden" align="start" sideOffset={4}>
        <div className="p-2 border-b border-border bg-muted/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search properties"
              aria-label="Search properties"
              className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-background border border-primary rounded-full focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-foreground"
            />
          </div>
        </div>
        <div className="max-h-[320px] overflow-y-auto py-2 bg-background">
          {AVAILABLE_PROPERTIES.map(group => (
            <div key={group.group}>
              <div className="px-3 py-2 mt-1 text-[13px] font-bold text-foreground">
                {group.group}
              </div>
              <div className="flex flex-col">
                {group.items.map(item => {
                  const isChecked = properties.some(p => p.id === item.id)
                  return (
                    <label key={item.id} className="flex items-start gap-3 px-3 py-1.5 hover:bg-accent cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-[3px] rounded-sm border-border text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer w-3.5 h-3.5"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            onPropertiesChange(prev => prev.filter(p => p.id !== item.id))
                          } else {
                            onPropertiesChange(prev => [...prev, { id: item.id, label: item.label, value: "--" }])
                          }
                        }}
                      />
                      <span className="text-[13px] text-muted-foreground">{item.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
