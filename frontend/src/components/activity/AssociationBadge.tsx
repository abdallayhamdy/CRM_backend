"use client"

import * as React from "react"
import { ChevronDown, Building2, User, Handshake, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface AssociationBadgeProps {
  associations: { name: string; type: string }[]
  className?: string
}

const typeIcons: Record<string, React.ReactNode> = {
  Company: <Building2 className="w-3.5 h-3.5" />,
  Contact: <User className="w-3.5 h-3.5" />,
  Deal: <Handshake className="w-3.5 h-3.5" />,
  Ticket: <Ticket className="w-3.5 h-3.5" />,
}

export function AssociationBadge({ associations, className }: AssociationBadgeProps) {
  const [open, setOpen] = React.useState(false)

  if (!associations || associations.length === 0) return null

  const count = associations.length
  const label = count === 1 ? "1 association" : `${count} associations`

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
            className
          )}
        >
          {label}
          <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <div className="space-y-1">
          {associations.map((assoc, i) => (
            <div
              key={`${assoc.type}-${assoc.name}-${i}`}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors"
            >
              <span className="text-muted-foreground shrink-0">
                {typeIcons[assoc.type] || <Building2 className="w-3.5 h-3.5" />}
              </span>
              <span className="text-[13px] font-medium text-foreground truncate">{assoc.name}</span>
              <span className="text-[11px] text-muted-foreground ml-auto shrink-0">{assoc.type}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
