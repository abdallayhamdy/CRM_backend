"use client"

import React from "react"
import { BarChart2 } from "lucide-react"
import { SecondarySidebarLayout } from "@/components/layout/SecondarySidebarLayout"
import { ReportsSidebar } from "@/components/reports/ReportsSidebar"
import { CrmPageHeader } from "@/components/crm/CrmPageLayout"
import { ReportsFilterProvider } from "../reports-filters"
import { SupportSection } from "../sections/support-section"
import { ExportReportButton } from "@/components/reports/ExportReportButton"

function SupportReportContent() {
  return (
    <SecondarySidebarLayout
      sidebar={<ReportsSidebar activeTab="support" onTabChange={() => {}} />}
    >
      <CrmPageHeader
        title="Support Report"
        icon={<BarChart2 className="h-5 w-5" />}
        actions={<ExportReportButton section="support" />}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <SupportSection />
        </div>
      </div>
    </SecondarySidebarLayout>
  )
}

export default function SupportReportPage() {
  return (
    <ReportsFilterProvider>
      <SupportReportContent />
    </ReportsFilterProvider>
  )
}
