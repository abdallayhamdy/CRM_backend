"use client"

import * as React from "react"
import { Phone, PhoneOff, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export function CallOutcomeCardsSkeleton() {
  return (
    <div className="mb-8">
      <div className="h-28 rounded-xl bg-background border border-border animate-pulse" />
    </div>
  )
}

export function CallOutcomeCards() {
  return (
    <div className="mb-8">
      <Link href="/calls">
        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br from-background to-muted/30 cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="h-4 w-4 text-status-warning" />
              <span className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider">Call Outcomes</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-muted-foreground font-medium">Answer</span>
                <span className="text-[13px] font-bold text-foreground">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-muted-foreground font-medium">No Answer</span>
                <span className="text-[13px] font-bold text-foreground">0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
