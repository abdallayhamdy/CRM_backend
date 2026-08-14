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

export function EmailEditorSheet({ open, onClose, onSaved, entityType, entityId, workspaceId }: ActivityEditorProps) {
  const [subject, setSubject] = React.useState("")
  const [body, setBody] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setSubject("")
      setBody("")
    }
  }, [open])

  const handleSave = async () => {
    if (!subject.trim()) return
    setSaving(true)
    try {
      const { error } = await activitiesService.create({
        workspace_id: workspaceId,
        type: "email",
        title: subject,
        description: body || undefined,
        contact_id: entityType === "contact" ? entityId : undefined,
        company_id: entityType === "company" ? entityId : undefined,
        deal_id: entityType === "deal" ? entityId : undefined,
        ticket_id: entityType === "ticket" ? entityId : undefined,
      })
      if (error) throw error
      toast.success("Email logged")
      onSaved()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to log email")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[440px]">
        <SheetHeader>
          <SheetTitle>Log an email</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-1">
            <Label>Subject *</Label>
            <Input placeholder="Email subject" value={subject} onChange={(e) => setSubject(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1">
            <Label>Body</Label>
            <Textarea placeholder="Email body..." value={body} onChange={(e) => setBody(e.target.value)} className="resize-none" rows={6} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!subject.trim() || saving}>
              {saving ? "Saving..." : "Log email"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
