"use client"

import React from "react"
import { BarChart2 } from "lucide-react"
import { SecondarySidebarLayout } from "@/components/layout/SecondarySidebarLayout"
import { ReportsSidebar } from "@/components/reports/ReportsSidebar"
import { CrmPageHeader } from "@/components/crm/CrmPageLayout"
import { ReportsFilterProvider } from "../reports-filters"
import { ProductivitySection } from "../sections/productivity-section"
import { ExportReportButton } from "@/components/reports/ExportReportButton"

function ProductivityReportContent() {
  return (
    <SecondarySidebarLayout
      sidebar={<ReportsSidebar activeTab="productivity" onTabChange={() => {}} />}
    >
      <CrmPageHeader
        title="Productivity Report"
        icon={<BarChart2 className="h-5 w-5" />}
        actions={<ExportReportButton section="productivity" />}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <ProductivitySection />
        </div>
      </div>
    </SecondarySidebarLayout>
  )
}

export default function ProductivityReportPage() {
  return (
    <ReportsFilterProvider>
      <ProductivityReportContent />
    </ReportsFilterProvider>
  )
}
