import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

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
