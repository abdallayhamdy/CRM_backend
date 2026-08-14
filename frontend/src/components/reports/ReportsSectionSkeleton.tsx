import { Skeleton } from "@/components/ui/skeleton"

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
