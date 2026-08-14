"use client"

import { Building2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface RecordAccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityLabel: string
  workspaceName?: string
  memberCount: number
}

export function RecordAccessDialog({
  open,
  onOpenChange,
  entityLabel,
  workspaceName,
  memberCount,
}: RecordAccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Record access</DialogTitle>
          <DialogDescription>Who can view this {entityLabel} record.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2 border border-border rounded p-3">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <div className="text-[13px]">
              <div className="font-medium text-foreground">
                All members of {workspaceName || "this workspace"}
              </div>
              <div className="text-muted-foreground">
                Workspace-level access — no per-record permission granularity exists in this build.
              </div>
            </div>
          </div>
          <div className="text-[12px] text-muted-foreground">
            {memberCount} member{memberCount === 1 ? "" : "s"} in this workspace can view this record.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
