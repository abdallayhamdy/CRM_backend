"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { activitiesService } from "@/services/activities"
import type { ActivityEditorProps } from "./types"

export function MeetingEditorSheet({ open, onClose, onSaved, entityType, entityId, workspaceId }: ActivityEditorProps) {
  const [title, setTitle] = React.useState("")
  const [meetingDate, setMeetingDate] = React.useState("")
  const [startTime, setStartTime] = React.useState("")
  const [endTime, setEndTime] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setTitle("")
      setMeetingDate("")
      setStartTime("")
      setEndTime("")
      setLocation("")
      setNotes("")
    }
  }, [open])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const meetingDetails = [
        startTime && `Start: ${startTime}`,
        endTime && `End: ${endTime}`,
        location && `Location: ${location}`
      ].filter(Boolean).join(' | ')

      const fullDescription = [notes, meetingDetails].filter(Boolean).join('\n\n')

      const { error } = await activitiesService.create({
        workspace_id: workspaceId,
        type: "meeting",
        title,
        description: fullDescription || undefined,
        contact_id: entityType === "contact" ? entityId : undefined,
        company_id: entityType === "company" ? entityId : undefined,
        deal_id: entityType === "deal" ? entityId : undefined,
        ticket_id: entityType === "ticket" ? entityId : undefined,
        activity_date: meetingDate || undefined,
      })
      if (error) throw error
      toast.success("Meeting logged")
      onSaved()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to log meeting")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[480px]">
        <SheetHeader>
          <SheetTitle>Log a meeting</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <Input placeholder="Meeting title *" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Start time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>End time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <Input placeholder="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Textarea placeholder="Notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className="resize-none" rows={4} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!title.trim() || saving}>
              {saving ? "Saving..." : "Log meeting"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
