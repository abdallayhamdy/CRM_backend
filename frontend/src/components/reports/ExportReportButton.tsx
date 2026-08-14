"use client"

import React, { useState, useCallback } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { reportsService } from "@/services/reports"
import { useReportsFilters, type ReportsFilters } from "@/app/reports/reports-filters"

function buildExportParams(activeTab: string, filters: Record<string, any>): Record<string, string> {
  const params: Record<string, string> = {}
  const f = filters[activeTab] || {}

  if (activeTab === 'executive' && f.period) {
    params.period = f.period
  }
  if (f.dateRange?.from) params.from = f.dateRange.from instanceof Date ? f.dateRange.from.toISOString() : String(f.dateRange.from)
  if (f.dateRange?.to) params.to = f.dateRange.to instanceof Date ? f.dateRange.to.toISOString() : String(f.dateRange.to)

  const arrayKeys: Record<string, string[]> = {
    sales: ['stages', 'reps'],
    orders: ['products'],
    support: ['priorities', 'types'],
    productivity: ['employees'],
    'calls-log': ['reps', 'types', 'results'],
  }

  const keys = arrayKeys[activeTab] || []
  for (const key of keys) {
    if (f[key]?.length) params[key] = f[key].join(',')
  }

  return params
}

interface ExportReportButtonProps {
  section: string
  label?: string
}

export function ExportReportButton({ section, label = "Export Report" }: ExportReportButtonProps) {
  const [exporting, setExporting] = useState(false)
  const { filters } = useReportsFilters()

  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      const params = buildExportParams(section, filters as Record<string, any>)
      await reportsService.exportReport(section, params)
    } catch (err) {
      console.error('Export failed:', err)
      toast.error((err as Error).message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }, [section, filters])

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 text-[13px] font-bold"
      onClick={handleExport}
      disabled={exporting}
    >
      {exporting ? (
        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5 mr-1.5" />
      )}
      {exporting ? 'Exporting...' : label}
    </Button>
  )
}
