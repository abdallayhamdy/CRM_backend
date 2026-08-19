import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CrmOverviewCards, CrmOverviewCardsSkeleton } from "@/components/dashboard/CrmOverviewCards";
import { IntegrationCards } from "@/components/dashboard/IntegrationCards";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
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
            <Suspense fallback={
              <Card className="border border-border shadow-sm">
                <div className="p-6 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16 rounded-md" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                  <Skeleton className="h-24 w-full rounded-lg border border-border" />
                </div>
              </Card>
            }>
              <IntegrationCards />
            </Suspense>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <Suspense fallback={
              <Card className="border border-border shadow-sm">
                <div className="p-6 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => (
                      <Skeleton key={i} className="h-32 rounded-lg border border-border" />
                    ))}
                  </div>
                </div>
              </Card>
            }>
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
