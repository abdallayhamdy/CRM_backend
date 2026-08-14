"use client"

import React from "react"
import { BarChart2 } from "lucide-react"
import { SecondarySidebarLayout } from "@/components/layout/SecondarySidebarLayout"
import { ReportsSidebar } from "@/components/reports/ReportsSidebar"
import { CrmPageHeader } from "@/components/crm/CrmPageLayout"
import { ReportsFilterProvider } from "../reports-filters"
import { SalesSection } from "../sections/sales-section"
import { ExportReportButton } from "@/components/reports/ExportReportButton"

function SalesReportContent() {
  return (
    <SecondarySidebarLayout
      sidebar={<ReportsSidebar activeTab="sales" onTabChange={() => {}} />}
    >
      <CrmPageHeader
        title="Sales Report"
        icon={<BarChart2 className="h-5 w-5" />}
        actions={<ExportReportButton section="sales" />}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <SalesSection />
        </div>
      </div>
    </SecondarySidebarLayout>
  )
}

export default function SalesReportPage() {
  return (
    <ReportsFilterProvider>
      <SalesReportContent />
    </ReportsFilterProvider>
  )
}
