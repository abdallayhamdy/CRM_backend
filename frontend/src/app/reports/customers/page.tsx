"use client"

import React from "react"
import { BarChart2 } from "lucide-react"
import { SecondarySidebarLayout } from "@/components/layout/SecondarySidebarLayout"
import { ReportsSidebar } from "@/components/reports/ReportsSidebar"
import { CrmPageHeader } from "@/components/crm/CrmPageLayout"
import { ReportsFilterProvider } from "../reports-filters"
import { CustomersSection } from "../sections/customers-section"
import { ExportReportButton } from "@/components/reports/ExportReportButton"

function CustomersReportContent() {
  return (
    <SecondarySidebarLayout
      sidebar={<ReportsSidebar activeTab="customers" onTabChange={() => {}} />}
    >
      <CrmPageHeader
        title="Customers Report"
        icon={<BarChart2 className="h-5 w-5" />}
        actions={<ExportReportButton section="customers" />}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <CustomersSection />
        </div>
      </div>
    </SecondarySidebarLayout>
  )
}

export default function CustomersReportPage() {
  return (
    <ReportsFilterProvider>
      <CustomersReportContent />
    </ReportsFilterProvider>
  )
}
