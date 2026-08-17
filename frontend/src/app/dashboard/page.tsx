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
            {isVisible("overdue") && (
              <div>
                <Suspense fallback={<OverdueCardSkeleton />}>
                  <OverdueCard />
                </Suspense>
              </div>
            )}
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
          </div>
        )}

        {(isVisible("recentActivity") || isVisible("phoneCalls")) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {isVisible("recentActivity") && (
              <div className="lg:col-span-2">
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
              </div>
            )}
            {isVisible("phoneCalls") && (
              <div>
                <Suspense fallback={<PhoneCallCardSkeleton />}>
                  <PhoneCallCard />
                </Suspense>
              </div>
            )}
          </div>
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
