"use client"

import React from "react"
import { BarChart2 } from "lucide-react"
import { SecondarySidebarLayout } from "@/components/layout/SecondarySidebarLayout"
import { ReportsSidebar } from "@/components/reports/ReportsSidebar"
import { CrmPageHeader } from "@/components/crm/CrmPageLayout"
import { ReportsFilterProvider } from "../reports-filters"
import { OrdersSection } from "../sections/orders-section"
import { ExportReportButton } from "@/components/reports/ExportReportButton"

function OrdersProductsReportContent() {
  return (
    <SecondarySidebarLayout
      sidebar={<ReportsSidebar activeTab="orders" onTabChange={() => {}} />}
    >
      <CrmPageHeader
        title="Orders & Products Report"
        icon={<BarChart2 className="h-5 w-5" />}
        actions={<ExportReportButton section="orders" />}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <OrdersSection />
        </div>
      </div>
    </SecondarySidebarLayout>
  )
}

export default function OrdersProductsReportPage() {
  return (
    <ReportsFilterProvider>
      <OrdersProductsReportContent />
    </ReportsFilterProvider>
  )
}
