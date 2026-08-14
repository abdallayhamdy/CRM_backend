"use client"

import * as React from "react"
import { PanelRight, Maximize2 } from "lucide-react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface SidebarPreviewButtonProps {
  onPreview: (e: React.MouseEvent) => void
  href: string
  tooltipPreview?: string
  tooltipExpand?: string
}

export function SidebarPreviewButton({
  onPreview,
  href,
  tooltipPreview = "Sidebar Preview",
  tooltipExpand = "Open full page",
}: SidebarPreviewButtonProps) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground/70 hover:text-primary hover:bg-primary/10"
              onClick={onPreview}
            >
              <PanelRight className="h-4.5 w-4.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{tooltipPreview}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={href}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-8 w-8 text-muted-foreground/70 hover:text-primary hover:bg-primary/10"
              )}
            >
              <Maximize2 className="h-4.5 w-4.5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>{tooltipExpand}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
