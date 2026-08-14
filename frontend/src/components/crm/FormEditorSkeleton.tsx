"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function FormEditorSkeleton() {
  return (
    <div className="flex flex-col h-[125vh] w-full max-w-screen-xl bg-muted/50 font-sans" style={{ zoom: 0.8 } as React.CSSProperties}>
      {/* Dark header bar */}
      <div className="h-[52px] bg-foreground flex items-center justify-between px-4 shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-20 rounded-md bg-white/10" />
          <Skeleton className="h-5 w-[1px] bg-white/20" />
          <Skeleton className="h-4 w-40 bg-white/10" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-20 rounded-md bg-white/10" />
          <Skeleton className="h-9 w-16 rounded-md bg-white/10" />
          <Skeleton className="h-9 w-16 rounded-md bg-white/10" />
          <Skeleton className="h-9 w-28 rounded-md bg-white/10" />
        </div>
      </div>

      {/* 3-panel content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <div className="w-full sm:w-[340px] bg-background border-r border-border flex flex-col shrink-0">
          <div className="p-8 pb-5 space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
          <div className="flex-1 px-4 pb-12 space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2 p-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>

        {/* Center canvas */}
        <div className="flex-1 flex flex-col bg-muted/50 overflow-hidden">
          <div className="w-full max-w-[640px] mx-auto py-12 px-6">
            <div className="bg-background border border-border rounded-sm shadow-sm flex flex-col min-h-[850px] mb-20">
              <div className="px-10 py-7 border-b border-border">
                <Skeleton className="h-5 w-48" />
              </div>
              <div className="px-10 pt-8 pb-4 space-y-7">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right toolbar */}
        <div className="w-[56px] bg-background border-l border-border flex flex-col items-center pt-4 gap-4 shrink-0">
          <Skeleton className="w-8 h-8 rounded-md" />
          <Skeleton className="w-8 h-8 rounded-md" />
          <Skeleton className="w-8 h-8 rounded-md" />
        </div>
      </div>
    </div>
  )
}
