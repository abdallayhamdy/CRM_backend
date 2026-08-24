"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { FormField } from "@/components/shared/FormField"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { tasksService } from "@/services/tasks"
import type { ActivityEditorProps } from "./types"
import { sanitizeRichText, TiptapEditor } from "@/components/editor/tiptap-editor"
import { FloatingPanel } from "./FloatingPanel"
import { CheckSquare, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import DateTimePicker from "@/components/shared/date-time-picker"

const SMART_DATE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "next_week", label: "Next week" },
  { value: "in_3_days", label: "In 3 business days" },
  { value: "next_month", label: "Next month" },
]

function resolveSmartDate(value: string): string {
  const now = new Date()
  switch (value) {
    case "today":
      return now.toISOString().split("T")[0]
    case "tomorrow": {
      const d = new Date(now)
      d.setDate(d.getDate() + 1)
      return d.toISOString().split("T")[0]
    }
    case "next_week": {
      const d = new Date(now)
      d.setDate(d.getDate() + 7)
      return d.toISOString().split("T")[0]
    }
    case "in_3_days": {
      const d = new Date(now)
      let count = 0
      while (count < 3) {
        d.setDate(d.getDate() + 1)
        if (d.getDay() !== 0 && d.getDay() !== 6) count++
      }
      return d.toISOString().split("T")[0]
    }
    case "next_month": {
      const d = new Date(now)
      d.setMonth(d.getMonth() + 1)
      return d.toISOString().split("T")[0]
    }
    default:
      return value
  }
}

function RecordChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted text-xs font-medium text-foreground border border-border">
      {label}
    </span>
  )
}

function entityLabel(entityType: ActivityEditorProps["entityType"]): string {
  switch (entityType) {
    case "contact": return "Contact"
    case "company": return "Company"
    case "deal": return "Deal"
    case "ticket": return "Ticket"
    case "document": return "Document"
    case "order": return "Order"
    default: return "Record"
  }
}

const SELECT_TRIGGER = "h-9 text-sm justify-between"

export function TaskEditorSheet({ open, onClose, onSaved, entityType, entityId, workspaceId }: ActivityEditorProps) {
  const [title, setTitle] = React.useState("")
  const [dueDateTime, setDueDateTime] = React.useState(resolveSmartDate("in_3_days") + " 08:00 AM")
  const [smartDate, setSmartDate] = React.useState("in_3_days")
  const [priority, setPriority] = React.useState("")
  const [type, setType] = React.useState("")
  const [queue, setQueue] = React.useState("general")
  const [assignedTo, setAssignedTo] = React.useState("")
  const [sendReminder, setSendReminder] = React.useState("")
  const [setRepeat, setSetRepeat] = React.useState(false)
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const htmlNotes = sanitizeRichText(notes)
      const description = htmlNotes !== "<p></p>" && htmlNotes.replace(/<[^>]*>/g, "").trim() !== "" ? htmlNotes : undefined

      let combinedDueDate: string | undefined
      if (dueDateTime) {
        const parsed = new Date(dueDateTime)
        if (!isNaN(parsed.getTime())) {
          combinedDueDate = parsed.toISOString()
        } else {
          combinedDueDate = dueDateTime
        }
      }

      let taskable_type: string | undefined
      let taskable_id: string | undefined
      if (entityType === "contact" || entityType === "company" || entityType === "deal") {
        taskable_type = entityType
        taskable_id = entityId
      }

      const assigned = assignedTo && assignedTo !== "unassigned" ? assignedTo : null

      const { error } = await tasksService.create({
        title,
        description,
        task_subtype: type || undefined,
        due_date: combinedDueDate,
        assigned_to: assigned,
        status: "pending",
        taskable_type,
        taskable_id,
      })
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

  React.useEffect(() => {
    if (open) {
      setTitle("")
      setDueDateTime(resolveSmartDate("in_3_days") + " 08:00 AM")
      setSmartDate("in_3_days")
      setPriority("")
      setType("")
      setQueue("general")
      setAssignedTo("")
      setSendReminder("")
      setSetRepeat(false)
      setNotes("")
    }
  }, [open])

  const now = new Date()
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })

  return (
    <FloatingPanel
      open={open}
      onClose={onClose}
      icon={<CheckSquare className="w-4 h-4" />}
      title="Task"
      associatedSection={
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Associated with 1 record</span>
          <span className="text-border">—</span>
          <RecordChip label={entityLabel(entityType)} />
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {dateStr} at {timeStr} GMT+2
          </span>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-5"
          >
            {saving ? "Saving..." : "Create"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Task title */}
        <input
          type="text"
          placeholder="Enter your task"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-sm text-foreground placeholder:text-muted-foreground bg-transparent border border-border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
          autoFocus
        />

        {/* Activity date */}
        <div>
          <FormField label="Activity date">
            <DateTimePicker
              value={dueDateTime}
              onChange={(val) => {
                setSmartDate("custom")
                setDueDateTime(val)
              }}
            />
          </FormField>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SMART_DATE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setSmartDate(opt.value)
                  const datePart = resolveSmartDate(opt.value)
                  const timePart = dueDateTime.split(" ").slice(1).join(" ") || "08:00 AM"
                  setDueDateTime(datePart + " " + timePart)
                }}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors",
                  smartDate === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Send reminder */}
        <div>
          <FormField label="Send reminder">
            <DateTimePicker
              value={sendReminder}
              onChange={setSendReminder}
              placeholder="No reminder"
            />
          </FormField>
        </div>

        {/* Task Type, Priority, Queue, Assigned to — 4 columns */}
        <div className="grid grid-cols-4 gap-3">
          <FormField label="Task Type">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className={cn(SELECT_TRIGGER, "border-border")}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="to_do">To-do</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="follow_up">Follow up</SelectItem>
                <SelectItem value="follow_up_after_meeting">Follow up after meeting</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Priority">
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className={cn(SELECT_TRIGGER, "border-border")}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Queue">
            <Select value={queue} onValueChange={setQueue}>
              <SelectTrigger className={cn(SELECT_TRIGGER, "border-border")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Assigned to">
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger className={cn(SELECT_TRIGGER, "border-border")}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>

        {/* Notes */}
        <div>
          <FormField label="Notes">
            <TiptapEditor
              content={notes}
              onChange={setNotes}
              placeholder="Add notes about this task..."
              toolbarVariant="task"
              minHeight="100px"
            />
          </FormField>
        </div>
      </div>
    </FloatingPanel>
  )
}
