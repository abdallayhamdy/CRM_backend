"use client"

import React from "react"
import { BarChart2 } from "lucide-react"
import { SecondarySidebarLayout } from "@/components/layout/SecondarySidebarLayout"
import { ReportsSidebar } from "@/components/reports/ReportsSidebar"
import { CrmPageHeader } from "@/components/crm/CrmPageLayout"
import { ReportsFilterProvider } from "../reports-filters"
import { CallsLogSection } from "../sections/calls-log-section"
import { ExportReportButton } from "@/components/reports/ExportReportButton"

function CallsLogReportContent() {
  return (
    <SecondarySidebarLayout
      sidebar={<ReportsSidebar activeTab="calls-log" onTabChange={() => {}} />}
    >
      <CrmPageHeader
        title="Calls Log Report"
        icon={<BarChart2 className="h-5 w-5" />}
        actions={<ExportReportButton section="calls-log" />}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <CallsLogSection />
        </div>
      </div>
    </SecondarySidebarLayout>
  )
}

export default function CallsLogReportPage() {
  return (
    <ReportsFilterProvider>
      <CallsLogReportContent />
    </ReportsFilterProvider>
  )
}
