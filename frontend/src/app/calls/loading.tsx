import { CrmTableSkeleton } from "@/components/crm/Skeletons"

export default function CallsLoading() {
  return (
    <div className="flex flex-col h-full w-full bg-background">
      <div className="flex-1 p-0">
        <CrmTableSkeleton />
      </div>
    </div>
  )
}
