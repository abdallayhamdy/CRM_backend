"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { activitiesService } from "@/services/activities"
import type { ActivityEditorProps } from "./types"

export function CallEditorSheet({ open, onClose, onSaved, entityType, entityId, workspaceId }: ActivityEditorProps) {
  const [direction, setDirection] = React.useState("outbound")
  const [outcome, setOutcome] = React.useState("connected")
  const [duration, setDuration] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [callDate, setCallDate] = React.useState(new Date().toISOString().split("T")[0])
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setDirection("outbound")
      setOutcome("connected")
      setDuration("")
      setNotes("")
      setCallDate(new Date().toISOString().split("T")[0])
    }
  }, [open])

  const handleSave = async () => {
    setSaving(true)
    try {
      const hasEntity = !!(entityType && entityId)
      const { error } = await activitiesService.create({
        workspace_id: workspaceId,
        type: "call",
        title: `Call: ${outcome}`,
        description: notes || undefined,
        contact_id: hasEntity && entityType === "contact" ? entityId : undefined,
        company_id: hasEntity && entityType === "company" ? entityId : undefined,
        deal_id: hasEntity && entityType === "deal" ? entityId : undefined,
        ticket_id: hasEntity && entityType === "ticket" ? entityId : undefined,
        activity_date: callDate || undefined,
      })
      if (error) throw error
      toast.success("Call logged")
      onSaved()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to log call")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[420px]">
        <SheetHeader>
          <SheetTitle>Log a call</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Direction</Label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Outcome</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="left_voicemail">Left voicemail</SelectItem>
                  <SelectItem value="no_answer">No answer</SelectItem>
                  <SelectItem value="wrong_number">Wrong number</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={callDate} onChange={(e) => setCallDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Duration (seconds)</Label>
              <Input type="number" placeholder="e.g. 120" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>
          <Textarea placeholder="Call notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className="resize-none" rows={4} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Log call"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
