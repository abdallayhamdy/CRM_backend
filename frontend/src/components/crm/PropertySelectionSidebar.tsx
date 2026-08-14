import * as React from "react"
import { Search, ExternalLink, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

interface Property {
  id: string
  label: string
  required?: boolean
  selected: boolean
  type?: string
}

interface PropertyGroup {
  id: string
  label: string
  properties: Property[]
}

export function PropertySelectionSidebar({
  groups,
  searchQuery,
  onSearchChange,
  expandedGroups,
  onToggleGroup,
  onToggleProperty,
  docsNote,
  docsNoteSuffix,
  entityLabel = "contact",
}: {
  groups: PropertyGroup[]
  searchQuery: string
  onSearchChange: (query: string) => void
  expandedGroups: string[]
  onToggleGroup: (groupId: string) => void
  onToggleProperty: (propertyId: string) => void
  docsNote?: string
  docsNoteSuffix?: string
  entityLabel?: string
}) {
  const filteredGroups = groups.map(group => ({
    ...group,
    properties: group.properties.filter(prop =>
      prop.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.properties.length > 0)

  return (
    <div className="w-[340px] bg-background border-r border-border flex flex-col shrink-0 shadow-[var(--shadow-panel-right)] z-10">
      <div className="p-8 pb-5">
        <h2 className="text-[22px] font-bold text-foreground mb-3 tracking-tight">Add properties</h2>
        <p className="text-[14px] text-muted-foreground mb-6 leading-relaxed">
          Select the fields your team will see when adding a new {entityLabel} record. <a href="#" className="text-primary font-bold hover:underline inline-flex items-center gap-1">Docs <ExternalLink className="h-3 w-3" /></a>
        </p>

        <div className="p-3.5 bg-muted/50 border border-border rounded-[4px] mb-6 shadow-sm">
          <p className="text-[13px] text-muted-foreground font-medium leading-snug">
            {docsNote && docsNoteSuffix ? (
              <>Note: <span className="text-foreground font-bold">{docsNote}</span> {docsNoteSuffix}</>
            ) : (
              <>Note: <span className="text-foreground font-bold">Email</span>, <span className="text-foreground font-bold">First name</span> or <span className="text-foreground font-bold">Last name</span> must be required.</>
            )}
          </p>
        </div>

        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto crm-scrollbar px-4 pb-12">
        {filteredGroups.map(group => (
          <div key={group.id} className="mb-1">
            <Button
              variant="ghost"
              onClick={() => onToggleGroup(group.id)}
              className="w-full flex items-center justify-between p-3 hover:bg-accent rounded-sm text-left group h-auto"
            >
              <div className="flex items-center gap-2">
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground/60 transition-transform duration-200",
                  !expandedGroups.includes(group.id) && "-rotate-90"
                )} />
                <span className="text-[14px] font-bold text-foreground uppercase tracking-wider text-[11px]">{group.label}</span>
              </div>
              <span className="text-[12px] text-muted-foreground/60 font-medium bg-muted/50 px-1.5 py-0.5 rounded border border-border/50">
                {group.properties.length}
              </span>
            </Button>

            {expandedGroups.includes(group.id) && (
              <div className="mt-1 space-y-0.5 ml-1">
                {group.properties.map(prop => (
                  <div
                    key={prop.id}
                    className={cn(
                      "flex items-center gap-3 p-2 pl-8 rounded-sm transition-colors cursor-pointer group/item",
                      prop.selected ? "bg-muted" : "hover:bg-accent"
                    )}
                    onClick={() => onToggleProperty(prop.id)}
                  >
                    <Checkbox
                      checked={prop.selected}
                      className={cn(
                        "border-border pointer-events-none data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                        prop.required && "opacity-50"
                      )}
                      disabled={prop.required}
                    />
                    <label className="text-[14px] text-foreground cursor-pointer flex-1 py-1 font-medium select-none">
                      {prop.label}{prop.required && <span className="text-primary ml-0.5">*</span>}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {filteredGroups.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-[14px] text-muted-foreground">No properties found matching &quot;{searchQuery}&quot;</p>
          </div>
        )}
      </div>
    </div>
  )
}
