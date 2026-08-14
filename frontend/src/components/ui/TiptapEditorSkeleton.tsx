import { Skeleton } from "@/components/ui/skeleton"

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
