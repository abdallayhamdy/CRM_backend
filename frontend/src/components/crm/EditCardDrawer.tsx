"use client"

import * as React from "react"
import { Pencil, Info, MoreHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { CardPreview } from "./CardPreview"
import { PropertyRow } from "./PropertyRow"
import { AddPropertiesPopover } from "./AddPropertiesPopover"

type PropertyItem = {
  id: string
  label: string
  value?: string
  isBadge?: boolean
  isTag?: boolean
}

export function EditCardDrawer({ open, onClose, onSave, cardId, initialTitle, initialProperties }: { open: boolean, onClose: () => void, onSave?: (title: string, properties: PropertyItem[]) => void, cardId?: string | null, initialTitle?: string, initialProperties?: PropertyItem[] }) {
  const [title, setTitle] = React.useState("About this contact")
  const [properties, setProperties] = React.useState<PropertyItem[]>([])

  // Drag and drop state
  const [draggingIdx, setDraggingIdx] = React.useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (open) {
      if (initialTitle) {
        setTitle(initialTitle)
      } else if (cardId === "keyinfo") {
        setTitle("Key information")
      } else if (cardId === "new") {
        setTitle("Property list")
      } else {
        setTitle("About this contact")
      }

      if (initialProperties) {
        setProperties(initialProperties)
      } else {
        // Default properties for standard and new cards
        setProperties([
          { id: "email", label: "Email", value: "--" },
          { id: "phone", label: "Phone Number", value: "--" },
          { id: "lifecycle", label: "Lifecycle Stage", value: "Lead", isBadge: true },
          { id: "owner", label: "Contact owner", value: "Vs Realestate" },
          { id: "last_contacted", label: "Last Contacted", value: "--" },
          { id: "lead_status", label: "Lead Status", value: "In progress" },
          { id: "legal_basis", label: "Legal basis for processing contact's data", value: "Legitimate interest - Other", isTag: true }
        ])
      }
    }
  }, [open, cardId, initialTitle, initialProperties])

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.effectAllowed = "move"
    // Set transparent image to hide default browser drag ghost if desired, but default is fine
    setDraggingIdx(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (idx !== draggingIdx) {
      setDragOverIdx(idx)
    }
  }

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault()
    if (draggingIdx === null) return

    const newProps = [...properties]
    const [draggedItem] = newProps.splice(draggingIdx, 1)
    newProps.splice(targetIdx, 0, draggedItem)

    setProperties(newProps)
    setDraggingIdx(null)
    setDragOverIdx(null)
  }

  const handleDragEnd = () => {
    setDraggingIdx(null)
    setDragOverIdx(null)
  }

  const swapItems = <T,>(arr: T[], i: number, j: number): T[] => {
    const result = [...arr]
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
    return result
  }

  const removeProp = (idx: number) => {
    setProperties(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="p-0 data-[side=right]:w-[1000px] data-[side=right]:sm:max-w-[1000px] max-w-[90vw]" showCloseButton={false}>
        <SheetTitle className="sr-only">Edit card</SheetTitle>
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-border shrink-0 bg-background z-10">
          <h2 className="text-lg font-bold text-foreground">Edit card</h2>
        </div>

        {/* 2-Column Content */}
        <div className="flex-1 overflow-hidden flex">

          {/* Left: Editor */}
          <div className="w-[500px] flex-1 overflow-y-auto bg-background border-r border-border flex flex-col">
            <div className="p-6 flex flex-col gap-6">

              <div className="text-right">
                <span className="text-[13px] text-muted-foreground">Added to: </span>
                <a href="#" className="text-[13px] font-bold text-primary hover:underline">1 view</a>
              </div>

              {/* Title Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-bold text-foreground flex items-center gap-1">
                  Card title * <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    aria-label="Card title"
                    className="flex-1 border border-border rounded px-3 py-1.5 text-[14px] text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <button aria-label="More options" className="px-3 border border-border rounded flex items-center justify-center hover:bg-accent">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  </button>
                </div>
                <div className="text-[12px] text-muted-foreground/60 flex items-center gap-1 mt-1">
                  Internal name <Info className="w-3 h-3" />: {title} updated at 1775071... <Pencil className="w-3 h-3 ml-1 cursor-pointer hover:text-foreground" />
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* User permissions */}
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-foreground">User permissions</h3>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[13px] text-muted-foreground">Let users add more properties to this card in their view.</p>
                  <div className="w-12 h-6 bg-foreground rounded-full p-1 border border-foreground cursor-pointer flex justify-end shrink-0">
                    <div className="w-4 h-4 bg-background rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-foreground" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2 6l3 3 5-5" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Properties */}
              <div className="flex flex-col gap-3">
                <h3 className="text-lg font-bold text-foreground">Properties</h3>
                <p className="text-[13px] text-muted-foreground">Decide which properties should appear on this card.</p>

                <AddPropertiesPopover properties={properties} onPropertiesChange={setProperties} />

                <div className="flex flex-col gap-2 mt-2">
                  {properties.map((prop, idx) => (
                    <PropertyRow
                      key={prop.id}
                      prop={prop}
                      idx={idx}
                      draggingIdx={draggingIdx}
                      dragOverIdx={dragOverIdx}
                      propertiesLength={properties.length}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onDragEnd={handleDragEnd}
                      onMoveUp={(i: number) => { if (i > 0) setProperties(swapItems(properties, i, i - 1)) }}
                      onMoveDown={(i: number) => { if (i < properties.length - 1) setProperties(swapItems(properties, i, i + 1)) }}
                      onRemove={removeProp}
                    />
                  ))}
                </div>
              </div>

              <div className="h-20" /> {/* Bottom padding to scroll past */}
            </div>
          </div>

          {/* Right: Preview */}
          <CardPreview title={title} properties={properties} />

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-background shrink-0 z-10 flex justify-between">
          <button onClick={onClose} className="px-6 py-2 border border-border text-foreground text-[14px] font-bold rounded hover:bg-accent transition-colors">
            Cancel
          </button>
          <button onClick={() => { if (onSave) onSave(title, properties); onClose(); }} className="px-6 py-2 bg-foreground text-primary-foreground text-[14px] font-bold rounded hover:bg-foreground transition-colors">
            Save
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
