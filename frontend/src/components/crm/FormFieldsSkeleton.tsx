import { Skeleton } from "@/components/ui/skeleton"

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
