"use client"

import { CrmHeaderSkeleton, CrmTabsSkeleton, CrmTableSkeleton } from "@/components/crm/Skeletons"

export default function GlobalLoading() {
  return (
    <div className="flex flex-col h-full w-full bg-background animate-in fade-in duration-500">
      <CrmHeaderSkeleton />
      <CrmTabsSkeleton />
      <div className="p-0 flex-1">
        <CrmTableSkeleton />
      </div>
    </div>
  )
}
