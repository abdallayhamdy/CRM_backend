"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { GripVertical, Maximize2, Minimize2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface FloatingPanelProps {
  open: boolean
  onClose: () => void
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  typeLabel?: string
  forSection?: React.ReactNode
  associatedSection?: React.ReactNode
  width?: number
  className?: string
}

export function FloatingPanel({
  open,
  onClose,
  icon,
  title,
  children,
  footer,
  forSection,
  associatedSection,
  width = 720,
  className,
}: FloatingPanelProps) {
  const [expanded, setExpanded] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const dragOffset = React.useRef({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)

  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  // Manual drag handlers
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (expanded) return
    const panel = panelRef.current
    if (!panel) return
    e.preventDefault()
    setIsDragging(true)
    const rect = panel.getBoundingClientRect()
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }

    const handleMouseMove = (ev: MouseEvent) => {
      const panel = panelRef.current
      if (!panel) return
      const x = ev.clientX - dragOffset.current.x
      const y = ev.clientY - dragOffset.current.y
      const maxX = window.innerWidth - panel.offsetWidth
      const maxY = window.innerHeight - panel.offsetHeight
      panel.style.left = `${Math.max(0, Math.min(x, maxX))}px`
      panel.style.top = `${Math.max(0, Math.min(y, maxY))}px`
      panel.style.right = "auto"
      panel.style.bottom = "auto"
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
    }

    document.body.style.userSelect = "none"
    document.body.style.cursor = "grabbing"
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }, [expanded])

  if (!open) return null

  const panel = createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Panel */}
          <motion.div
            ref={panelRef}
            key="fp-panel"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{
              width,
              boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
              ...(expanded
                ? { left: 24, right: 24, bottom: 24, top: 64 }
                : { right: 24, bottom: 24 }),
            }}
            className={cn(
              "fixed z-[201] flex flex-col rounded-xl border border-border bg-background max-h-[85vh]",
              expanded && "max-h-none",
              className,
            )}
          >
            {/* Header */}
            <div
              onMouseDown={handleMouseDown}
              className={cn(
                "flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30 select-none shrink-0",
                expanded ? "cursor-default" : "cursor-grab active:cursor-grabbing",
                isDragging && "cursor-grabbing",
              )}
            >
              <div className="flex items-center gap-1 text-muted-foreground">
                <GripVertical className="w-4 h-4" />
              </div>

              <div className="text-muted-foreground">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-muted-foreground shrink-0">{icon}</span>
                <span className="text-sm font-semibold text-foreground truncate">{title}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setExpanded((v) => !v)}
                  title={expanded ? "Collapse" : "Expand"}
                >
                  {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={onClose}
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
              {forSection && (
                <div className="mb-3">
                  {forSection}
                </div>
              )}
              {children}
            </div>

            {associatedSection && (
              <div className="px-4 py-3 border-t border-border shrink-0">
                {associatedSection}
              </div>
            )}

            {footer && (
              <div className="px-4 py-3 border-t border-border bg-muted/30 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )

  return panel
}
