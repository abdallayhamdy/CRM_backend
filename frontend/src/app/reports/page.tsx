"use client";

import React from "react";
import { BarChart2 } from "lucide-react";
import { SecondarySidebarLayout } from "@/components/layout/SecondarySidebarLayout";
import { ReportsSidebar } from "@/components/reports/ReportsSidebar";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CrmPageHeader } from "@/components/crm/CrmPageLayout";
import { ReportsFilterProvider, useReportsFilters } from "./reports-filters";
import { ExportReportButton } from "@/components/reports/ExportReportButton";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const SectionLoading = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-[200px]" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
    <Skeleton className="h-[400px] w-full animate-pulse bg-muted" />
  </div>
);

const ExecutiveSummarySection = dynamic(() => import("./sections/executive-summary-section").then(m => m.ExecutiveSummarySection), { ssr: false, loading: SectionLoading });
const SalesSection = dynamic(() => import("./sections/sales-section").then(m => m.SalesSection), { ssr: false, loading: SectionLoading });
const CustomersSection = dynamic(() => import("./sections/customers-section").then(m => m.CustomersSection), { ssr: false, loading: SectionLoading });
const OrdersSection = dynamic(() => import("./sections/orders-section").then(m => m.OrdersSection), { ssr: false, loading: SectionLoading });
const SupportSection = dynamic(() => import("./sections/support-section").then(m => m.SupportSection), { ssr: false, loading: SectionLoading });
const ProductivitySection = dynamic(() => import("./sections/productivity-section").then(m => m.ProductivitySection), { ssr: false, loading: SectionLoading });
const CallsLogSection = dynamic(() => import("./sections/calls-log-section").then(m => m.CallsLogSection), { ssr: false, loading: SectionLoading });

function ReportsPageContent() {
  const { activeTab, setActiveTab } = useReportsFilters();

  return (
    <SecondarySidebarLayout
      sidebar={<ReportsSidebar activeTab={activeTab} onTabChange={setActiveTab} />}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <CrmPageHeader
          title="Reports"
          icon={<BarChart2 className="h-5 w-5" />}
          actions={<ExportReportButton section={activeTab} />}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <TabsContent value="executive"><ExecutiveSummarySection /></TabsContent>
            <TabsContent value="sales"><SalesSection /></TabsContent>
            <TabsContent value="customers"><CustomersSection /></TabsContent>
            <TabsContent value="orders"><OrdersSection /></TabsContent>
            <TabsContent value="support"><SupportSection /></TabsContent>
            <TabsContent value="productivity"><ProductivitySection /></TabsContent>
            <TabsContent value="calls-log"><CallsLogSection /></TabsContent>
          </div>
        </div>
      </Tabs>
    </SecondarySidebarLayout>
  );
}

export default function ReportsPage() {
  return (
    <ReportsFilterProvider>
      <ReportsPageContent />
    </ReportsFilterProvider>
  );
}
