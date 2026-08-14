"use client"

import * as React from "react"
import { CrmDataTable } from "@/components/crm/CrmDataTable"
import { Contact } from "@/lib/types/crm"
import type { ColumnDef } from "@tanstack/react-table"
import type { TableSettings } from "@/components/crm/TableSettingsDialog"

interface ContactsTableViewProps {
  data: Contact[]
  tableColumns: ColumnDef<Contact, unknown>[]
  columnVersion: number
  selectedIds: Set<string>
  toggleOne: (id: string) => void
  tableSettings: TableSettings | null
  handleUpdateCell: (contact: Contact, columnId: string, value: string | number | boolean | null) => Promise<void>
  setPreviewContact: (contact: Contact | null) => void
  onHistoryClick?: (contact: Contact) => void
}

export function ContactsTableView({
  data,
  tableColumns,
  columnVersion,
  selectedIds,
  toggleOne,
  tableSettings,
  handleUpdateCell,
  setPreviewContact,
  onHistoryClick,
}: ContactsTableViewProps) {
  return (
    <div className="flex-1 flex min-h-0">
      {/* Table Panel */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <CrmDataTable<Contact, unknown>
          key={`contacts-table-${columnVersion}`}
          columns={tableColumns}
          data={data}
          onRowClick={setPreviewContact as any}
          onUpdateCell={handleUpdateCell}
          onHistoryClick={onHistoryClick}
          entityName="contact"
          selectedIds={selectedIds}
          onToggleOne={toggleOne}
          tableSettings={tableSettings ?? undefined}
        />
      </div>
    </div>
  )
}
