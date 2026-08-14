"use client"

import * as React from "react"
import { CrmDataTable } from "@/components/crm/CrmDataTable"
import { Deal } from "@/lib/types/crm"
import type { ColumnDef } from "@tanstack/react-table"
import type { TableSettings } from "@/components/crm/TableSettingsDialog"

interface DealsTableViewProps {
  filteredData: Deal[]
  tableColumns: ColumnDef<Deal, unknown>[]
  columnVersion: number
  selectedIds: Set<string>
  toggleOne: (id: string) => void
  handleUpdateCell: (deal: Deal, columnId: string, value: string | number | boolean | null) => Promise<void>
  setSelectedDeal: (deal: Deal | null) => void
  tableSettings?: TableSettings
  onHistoryClick?: (deal: Deal) => void
}

export function DealsTableView({
  filteredData,
  tableColumns,
  columnVersion,
  selectedIds,
  toggleOne,
  handleUpdateCell,
  setSelectedDeal,
  tableSettings,
  onHistoryClick,
}: DealsTableViewProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <CrmDataTable
        key={`deals-table-${columnVersion}`}
        columns={tableColumns}
        data={filteredData}
        onRowClick={setSelectedDeal}
        onUpdateCell={handleUpdateCell}
        onHistoryClick={onHistoryClick}
        entityName="deal"
        selectedIds={selectedIds}
        onToggleOne={toggleOne}
        tableSettings={tableSettings}
      />
    </div>
  )
}
