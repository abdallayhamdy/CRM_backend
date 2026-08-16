"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatChangedDate, type PropertyHistoryEntityType } from "@/lib/property-history-format"
import { getPropertyHistory, type PropertyHistoryEntry } from "@/services/property-history"
import { useProperties } from "@/hooks/use-properties"

interface PropertyHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: PropertyHistoryEntityType
  entityId: string
  entityLabel: string
  entityTitle?: string
}

export function PropertyHistoryDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityLabel,
  entityTitle,
}: PropertyHistoryDialogProps) {
  const [entries, setEntries] = React.useState<PropertyHistoryEntry[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  const objectTypeMap: Record<string, string> = {
    contact: "contact", company: "company", deal: "deal",
    product: "product", order: "order", ticket: "ticket",
  }
  const { properties } = useProperties(
    (objectTypeMap[entityType] ?? entityType) as any
  )

  React.useEffect(() => {
    let cancelled = false
    if (open && entityId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag mirrors the accepted repo-wide fetch-in-effect pattern
      setIsLoading(true)
      getPropertyHistory(entityType, entityId, 100, properties).then((data) => {
        if (!cancelled) {
          setEntries(data)
          setIsLoading(false)
        }
      })
    } else {
      setEntries([])
    }
    return () => {
      cancelled = true
    }
  }, [open, entityType, entityId, properties])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Property history</DialogTitle>
          <DialogDescription>
            Field-level changes recorded for this {entityLabel}
            {entityTitle ? ` — ${entityTitle}` : ""}.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[420px] overflow-y-auto">
          {isLoading ? (
            <p className="text-[13px] text-muted-foreground py-6 text-center">Loading changes...</p>
          ) : entries.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-6 text-center">No changes recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {entries.map((entry) => (
                <li key={entry.id} className="text-[13px] border border-border rounded p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{entry.property_label}</span>
                    <span className="text-muted-foreground text-[12px] shrink-0">
                      {formatChangedDate(entry.changed_at)}
                    </span>
                  </div>
                  <div className="text-foreground mt-1">{entry.changed_to_display}</div>
                  <div className="text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={entry.changed_by_avatar || ""} />
                      <AvatarFallback className="text-[8px] bg-muted">
                        {entry.changed_by[0]?.toUpperCase() || "S"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{entry.changed_by}</span>
                    <span className="text-muted-foreground/70">·</span>
                    <span>{entry.source}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
