"use client"

import * as React from "react"
import {
  Search, MoreHorizontal,
  Repeat, Lock, ChevronRight, MessageSquare, MessageCircle,
  PhoneOutgoing, CalendarPlus, Mailbox, Mail
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { LucideIcon } from "lucide-react"

export interface ActivityAction {
  icon: LucideIcon
  label: string
  onClick?: () => void
  rightIcon?: React.ReactNode
}

export interface ActivityButtonsProps {
  primaryActions?: ActivityAction[]
  moreActions?: ActivityAction[]
  showMoreFooter?: boolean
}

const DEFAULT_MORE_ACTIONS: ActivityAction[] = [
  { icon: Repeat, label: "Enroll in a sequence", rightIcon: <Lock className="w-3.5 h-3.5" /> },
  { icon: ChevronRight, label: "Engage on LinkedIn", rightIcon: <ChevronRight className="w-4 h-4" /> },
  { icon: MessageSquare, label: "Log SMS" },
  { icon: MessageCircle, label: "Log a LinkedIn message" },
  { icon: MessageCircle, label: "Log a WhatsApp message" },
  { icon: PhoneOutgoing, label: "Log a call" },
  { icon: CalendarPlus, label: "Log a meeting" },
  { icon: Mail, label: "Log an email" },
  { icon: Mailbox, label: "Log postal mail" },
  { icon: MessageCircle, label: "Create a WhatsApp message" },
]

export function ActivityButtons({
  primaryActions = [],
  moreActions = DEFAULT_MORE_ACTIONS,
  showMoreFooter = true,
}: ActivityButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-6 mt-6">
      {primaryActions.map((btn, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-2 group cursor-pointer"
          onClick={btn.onClick}
        >
          <div className="w-[48px] h-[48px] rounded-full border border-border flex items-center justify-center transition-colors bg-background text-foreground/70 group-hover:bg-muted group-hover:text-foreground">
            <btn.icon className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <span className="text-[13px] text-foreground font-medium whitespace-nowrap">{btn.label}</span>
        </div>
      ))}

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex flex-col items-center gap-1.5 group cursor-pointer w-[42px] border-none bg-transparent p-0 outline-none">
            <div className="w-[38px] h-[38px] rounded-full border border-muted-foreground/50 flex items-center justify-center text-foreground/80 bg-background group-hover:bg-muted transition-colors">
              <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <span className="text-[12px] text-foreground font-medium tracking-tight whitespace-nowrap">More</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-[280px] p-0 rounded-md shadow-lg border-border">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-9 pr-3 py-1.5 text-[14px] border border-input rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto py-2 flex flex-col crm-scrollbar">
            {moreActions.map((item, idx) => (
              <button
                key={idx}
                onClick={item.onClick}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-accent text-left group"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-foreground/70" strokeWidth={1.5} />
                  <span className="text-[14px] text-foreground">{item.label}</span>
                </div>
                {item.rightIcon && <span className="text-muted-foreground">{item.rightIcon}</span>}
              </button>
            ))}
          </div>
          {showMoreFooter && (
            <div className="border-t border-border bg-background p-3 hover:bg-accent cursor-pointer rounded-b-md">
              <span className="text-[14px] font-bold text-foreground block w-full text-left">Reorder activity buttons</span>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
