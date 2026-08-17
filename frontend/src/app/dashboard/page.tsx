"use client"

"use client"

import { Suspense, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { DashboardCustomizer } from "@/components/dashboard/DashboardCustomizer"
import { CrmOverviewCards, CrmOverviewCardsSkeleton } from "@/components/dashboard/CrmOverviewCards"
import { IntegrationCards } from "@/components/dashboard/IntegrationCards"
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard"
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist"
import { PhoneCallCard, PhoneCallCardSkeleton } from "@/components/dashboard/PhoneCallCard"
import { OverdueCard, OverdueCardSkeleton } from "@/components/dashboard/OverdueCard"
import { useDashboardLayout } from "@/hooks/use-dashboard-layout"

export default function DashboardPage() {
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const { visibility, isVisible, toggleCard, resetAll } = useDashboardLayout()

  return (
    <div className="bg-muted/50 h-full overflow-y-auto">
      <div className="w-full px-6 py-8">
        <DashboardHeader onCustomize={() => setCustomizerOpen(true)} />
        <OnboardingChecklist />

        {isVisible("overview") && (
          <Suspense fallback={<CrmOverviewCardsSkeleton />}>
            <CrmOverviewCards />
          </Suspense>
        )}

        {(isVisible("overdue") || isVisible("integrations")) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
            {isVisible("integrations") && (
              <div>
                <Suspense fallback={
                  <div className="mb-8 space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex gap-2 mb-3">
                      <Skeleton className="h-8 w-16 rounded-md" />
                      <Skeleton className="h-8 w-20 rounded-md" />
                    </div>
                    <Skeleton className="h-24 w-full rounded-lg border border-border" />
                  </div>
                }>
                  <IntegrationCards />
                </Suspense>
              </div>
            )}
            {(isVisible("overdue") || isVisible("phoneCalls")) && (
              <div className="flex flex-col gap-3">
                {isVisible("overdue") && (
                  <Suspense fallback={<OverdueCardSkeleton />}>
                    <OverdueCard />
                  </Suspense>
                )}
                {isVisible("phoneCalls") && (
                  <Suspense fallback={<PhoneCallCardSkeleton />}>
                    <PhoneCallCard />
                  </Suspense>
                )}
              </div>
            )}
          </div>
        )}

        {isVisible("recentActivity") && (
          <Suspense fallback={
            <div className="mb-8 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-32 rounded-lg border border-border" />
                ))}
              </div>
            </div>
          }>
            <RecentActivityCard />
          </Suspense>
        )}
      </div>

      <DashboardCustomizer
        open={customizerOpen}
        onOpenChange={setCustomizerOpen}
        visibility={visibility}
        onToggle={toggleCard}
        onReset={resetAll}
      />
    </div>
  )
}
