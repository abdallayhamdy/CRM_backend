import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CrmOverviewCards, CrmOverviewCardsSkeleton } from "@/components/dashboard/CrmOverviewCards";
import { TasksCard, TasksCardSkeleton } from "@/components/dashboard/TasksCard";
import { RecentActivityCard, RecentActivityCardSkeleton } from "@/components/dashboard/RecentActivityCard";
import { PhoneCallCard, PhoneCallCardSkeleton } from "@/components/dashboard/PhoneCallCard";
import { OverdueCard, OverdueCardSkeleton } from "@/components/dashboard/OverdueCard";

export default function DashboardPage() {
  return (
    <div className="bg-muted/50 h-full overflow-y-auto">
      <div className="w-full px-6 py-6 flex flex-col gap-3">
        <DashboardHeader />

        <Suspense fallback={<CrmOverviewCardsSkeleton />}>
          <CrmOverviewCards />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <Suspense fallback={<OverdueCardSkeleton />}>
              <OverdueCard />
            </Suspense>
          </div>
          <div>
            <Suspense fallback={<TasksCardSkeleton />}>
              <TasksCard />
            </Suspense>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <Suspense fallback={<RecentActivityCardSkeleton />}>
              <RecentActivityCard />
            </Suspense>
          </div>
          <div className="lg:col-span-1">
            <Suspense fallback={<PhoneCallCardSkeleton />}>
              <PhoneCallCard />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
