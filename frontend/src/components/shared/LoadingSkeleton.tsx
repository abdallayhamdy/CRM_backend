"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CrmDetailLayout, CrmDetailLeftPanel, CrmDetailCenterPanel, CrmDetailRightPanel } from "@/components/crm/CrmDetailLayout"
import { cn } from "@/lib/utils"

// ── Generic loading skeleton ──────────────────────────────────────

interface LoadingSkeletonProps {
  count?: number
  height?: number | string
  className?: string
  containerClassName?: string
}

export function LoadingSkeleton({
  count = 1,
  height = "2rem",
  className,
  containerClassName
}: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", containerClassName)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("w-full", className)}
          style={{ height }}
        />
      ))}
    </div>
  )
}

// ── CRM Table Skeleton ───────────────────────────────────────────

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

// ── CRM Header Skeleton ──────────────────────────────────────────

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

// ── CRM Tabs Skeleton ────────────────────────────────────────────

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

// ── Detail Page Skeleton ─────────────────────────────────────────

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

// ── Preview Sheet Skeleton ───────────────────────────────────────

export function PreviewSheetSkeleton() {
  return (
    <div className="p-0 flex flex-col h-full">
      {/* Header section */}
      <div className="bg-muted/30 border-b border-border/60 px-6 py-6">
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

// ── Tiptap Editor Skeleton ───────────────────────────────────────

export function TiptapEditorSkeleton({ className }: { className?: string }) {
  return (
    <div className={`border border-border rounded-md overflow-hidden bg-card ${className ?? ""}`}>
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-muted/30">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-6 w-16 rounded ml-1" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <Skeleton className="block w-full rounded-none" style={{ minHeight: "120px" }} />
    </div>
  )
}

// ── Form Fields Skeleton ─────────────────────────────────────────

export function FormFieldsSkeleton() {
  return (
    <div className="space-y-9">
      {[1, 2, 3].map((i) => (
        <div key={i} className="group relative space-y-2.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded opacity-0" />
            <Skeleton className="h-[13px] w-24 rounded" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
    </div>
  )
}

// ── Form Editor Skeleton ─────────────────────────────────────────

export function FormEditorSkeleton() {
  return (
    <div className="flex flex-col h-screen w-full bg-background font-sans">
      {/* Dark header bar */}
      <div className="h-[52px] bg-primary flex items-center justify-between px-4 shrink-0 shadow-sm z-50">
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

// ── Reports Section Skeleton ─────────────────────────────────────

export function ReportsSectionSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filter bar skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-[180px]" />
        <Skeleton className="h-8 w-[140px]" />
        <Skeleton className="h-8 w-[120px]" />
      </div>

      {/* KPI cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-card rounded-xl border border-border p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-24 mb-2" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        ))}
      </div>

      {/* Chart cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="p-5">
            <Skeleton className="h-3.5 w-48 mb-4" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="p-5">
            <Skeleton className="h-3.5 w-48 mb-4" />
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
