"use client"

import React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { DASHBOARD_CARDS } from "@/hooks/use-dashboard-layout"

interface DashboardCustomizerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  visibility: Record<string, boolean>
  onToggle: (cardId: string) => void
  onReset: () => void
}

export function DashboardCustomizer({
  open,
  onOpenChange,
  visibility,
  onToggle,
  onReset,
}: DashboardCustomizerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[480px]">
        <SheetHeader>
          <SheetTitle>Customize Dashboard</SheetTitle>
          <SheetDescription>
            Choose which cards to show on your dashboard.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-1">
          {DASHBOARD_CARDS.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-foreground">{card.label}</p>
                <p className="text-[12px] text-muted-foreground">{card.description}</p>
              </div>
              <Switch
                checked={visibility[card.id] !== false}
                onCheckedChange={() => onToggle(card.id)}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 px-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={onReset}
          >
            Reset to defaults
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
