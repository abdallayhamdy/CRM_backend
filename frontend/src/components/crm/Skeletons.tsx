"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CrmDetailLayout, CrmDetailLeftPanel, CrmDetailCenterPanel, CrmDetailRightPanel } from "@/components/crm/CrmDetailLayout"

export function CrmTableSkeleton({ columnCount = 5, rowCount = 10 }) {
  return (
    <div className="w-full bg-background overflow-hidden">
      <Table>
        <TableHeader className="bg-background">
          <TableRow>
            <TableHead><Skeleton className="h-4 w-4" /></TableHead>
            {Array.from({ length: columnCount }).map((_, i) => (
              <TableHead key={i}><Skeleton className="h-4 w-24" /></TableHead>
            ))}
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, i) => (
            <TableRow key={i} className="h-12 hover:bg-transparent">
              <TableCell><Skeleton className="h-4 w-4" /></TableCell>
              {Array.from({ length: columnCount }).map((_, j) => (
                <TableCell key={j}><Skeleton className="h-4 w-full max-w-[120px]" /></TableCell>
              ))}
              <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function CrmHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between px-8 py-3 bg-background border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] h-16">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </div>
  )
}

export function CrmTabsSkeleton() {
  return (
    <div className="flex items-center justify-between border-b border-border px-6 h-12 bg-background">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  )
}

export function DetailPageSkeleton() {
  return (
    <CrmDetailLayout backLine="" backHref="">
      {/* Left Panel: Profile card + About card */}
      <CrmDetailLeftPanel>
        <div className="bg-background border border-border rounded-lg p-4 flex flex-col items-center gap-3">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
        <div className="bg-background border border-border rounded-lg p-4 flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <div className="flex flex-col gap-2">
            <div className="flex justify-between"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-28" /></div>
            <div className="flex justify-between"><Skeleton className="h-3 w-12" /><Skeleton className="h-3 w-20" /></div>
            <div className="flex justify-between"><Skeleton className="h-3 w-14" /><Skeleton className="h-3 w-24" /></div>
            <div className="flex justify-between"><Skeleton className="h-3 w-10" /><Skeleton className="h-3 w-16" /></div>
          </div>
        </div>
      </CrmDetailLeftPanel>

      {/* Center Panel: Activity feed */}
      <CrmDetailCenterPanel>
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-4 border-b border-border pb-3">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-lg">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </CrmDetailCenterPanel>

      {/* Right Panel: Associated cards */}
      <CrmDetailRightPanel>
        <div className="bg-background border border-border rounded-lg p-4 flex flex-col gap-3">
          <Skeleton className="h-4 w-20" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex flex-col gap-1"><Skeleton className="h-3 w-28" /><Skeleton className="h-3 w-20" /></div>
          </div>
        </div>
        <div className="bg-background border border-border rounded-lg p-4 flex flex-col gap-3">
          <Skeleton className="h-4 w-20" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <div className="flex flex-col gap-1"><Skeleton className="h-3 w-24" /><Skeleton className="h-3 w-16" /></div>
            </div>
          ))}
        </div>
        <div className="bg-background border border-border rounded-lg p-4 flex flex-col gap-3">
          <Skeleton className="h-4 w-20" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <div className="flex flex-col gap-1"><Skeleton className="h-3 w-28" /><Skeleton className="h-3 w-16" /></div>
            </div>
          ))}
        </div>
      </CrmDetailRightPanel>
    </CrmDetailLayout>
  )
}

export function PreviewSheetSkeleton() {
  return (
    <div className="p-0 flex flex-col h-full">
      {/* Header section */}
      <div className="bg-[color:var(--color-slate-50)] border-b border-border/60 px-6 py-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4 items-center">
            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>

      {/* Content section */}
      <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
        <div className="space-y-4">
          <Skeleton className="h-4 w-20" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-border/40">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-md" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
