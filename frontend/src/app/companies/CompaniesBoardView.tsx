"use client"

import * as React from "react"
import { CrmBoardView, BoardColumn } from "@/components/crm/CrmBoardView"
import { CrmDateCell } from "@/components/crm/CrmDateCell"
import { Company } from "@/lib/types/crm"

interface CompaniesBoardViewProps {
  data: Company[]
  boardColumns: BoardColumn[]
  setSelectedCompany: (company: Company | null) => void
  onDragEnd?: (result: { active: string; over: string | null; overColumn?: string }) => void
}

function CompanyBoardCard({ company }: { company: Company }) {
  return (
    <>
      <div className="flex justify-between items-start mb-2 mr-6">
        <h4 className="text-[14px] font-bold text-primary hover:underline leading-tight truncate">
          {company.name}
        </h4>
      </div>

      <div className="space-y-1.5 text-[12px] text-muted-foreground font-medium">
        <div className="flex items-center gap-1.5">
          Domain: {company.domain || "No domain"}
        </div>
        <div className="flex items-center gap-1.5">
          Industry: {company.industry || "No industry"}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Owner:</span>
          <span className="truncate">{company.owner ? `${company.owner.first_name} ${company.owner.last_name || ''}`.trim() : "Unassigned"}</span>
        </div>
        <div className="flex items-center gap-1.5 border-t border-border pt-1.5 mt-1.5">
          <span className="text-muted-foreground">Created:</span>
          <CrmDateCell date={company.created_at} className="inline-block" />
        </div>
      </div>
    </>
  )
}

export function CompaniesBoardView({
  data,
  boardColumns,
  setSelectedCompany,
  onDragEnd,
}: CompaniesBoardViewProps) {
  return (
    <CrmBoardView<Company>
      data={data}
      columns={boardColumns}
      groupField="lifecycle_stage"
      onItemClick={setSelectedCompany}
      onDragEnd={onDragEnd}
      renderCard={(company) => <CompanyBoardCard company={company} />}
    />
  )
}
