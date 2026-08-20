"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { tasksService } from "@/services/tasks"
import type { ActivityEditorProps } from "./types"

export function TaskEditorSheet({ open, onClose, onSaved, entityType, entityId, workspaceId }: ActivityEditorProps) {
  const [title, setTitle] = React.useState("")
  const [dueDate, setDueDate] = React.useState("")
  const [dueTime, setDueTime] = React.useState("")
  const [priority, setPriority] = React.useState("none")
  const [type, setType] = React.useState("to_do")
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setTitle("")
      setDueDate("")
      setDueTime("")
      setPriority("none")
      setType("to_do")
      setNotes("")
    }
  }, [open])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const payload: any = {
        title,
        description: notes || undefined,
        due_date: dueDate && dueTime ? `${dueDate} ${dueTime}` : dueDate || undefined,
        status: "pending",
        task_subtype: type || undefined,
      }
      if (entityType && entityId && ["contact", "company", "deal"].includes(entityType)) {
        payload.taskable_type = entityType
        payload.taskable_id = entityId
      }
      const { error } = await tasksService.create(payload)
      if (error) throw error
      toast.success("Task created")
      onSaved()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create task")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[480px]">
        <SheetHeader>
          <SheetTitle>Create task</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <Input placeholder="Task title *" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Due time</Label>
              <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="to_do">To-do</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="follow_up">Follow up</SelectItem>
                  <SelectItem value="follow_up_after_meeting">Follow up after meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="resize-none" rows={3} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!title.trim() || saving}>
              {saving ? "Saving..." : "Create task"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
