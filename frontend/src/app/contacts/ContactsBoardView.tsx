"use client"

import * as React from "react"
import { CrmBoardView, BoardColumn } from "@/components/crm/CrmBoardView"
import { CrmDateCell } from "@/components/crm/CrmDateCell"
import { Contact } from "@/lib/types/crm"

interface ContactsBoardViewProps {
  data: Contact[]
  boardColumns: BoardColumn[]
  setPreviewContact: (contact: Contact | null) => void
  onDragEnd?: (result: { active: string; over: string | null; overColumn?: string }) => void
}

function ContactBoardCard({ contact }: { contact: Contact }) {
  return (
    <>
      <div className="flex justify-between items-start mb-2 mr-6">
        <h4 className="text-[14px] font-bold text-primary hover:underline leading-tight truncate">
          {contact.first_name} {contact.last_name}
        </h4>
      </div>

      <div className="space-y-1.5 text-[12px] text-muted-foreground font-medium">
        <div className="flex items-center gap-1.5">
          Email: {contact.email || "No email"}
        </div>
        <div className="flex items-center gap-1.5">
          Company: {contact.company?.name || "No company"}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Owner:</span>
          <span className="truncate">{contact.owner ? `${contact.owner.first_name} ${contact.owner.last_name || ''}`.trim() : "Unassigned"}</span>
        </div>
        <div className="flex items-center gap-1.5 border-t border-border pt-1.5 mt-1.5">
          <span className="text-muted-foreground">Created:</span>
          <CrmDateCell date={contact.created_at} className="inline-block" />
        </div>
      </div>
    </>
  )
}

export function ContactsBoardView({
  data,
  boardColumns,
  setPreviewContact,
  onDragEnd,
}: ContactsBoardViewProps) {
  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden flex-1 flex flex-col min-h-0">
      <CrmBoardView<Contact>
        data={data}
        columns={boardColumns}
        groupField="lifecycle_stage"
        onItemClick={setPreviewContact as any}
        onDragEnd={onDragEnd}
        renderCard={(contact) => <ContactBoardCard contact={contact} />}
      />
    </div>
  )
}
