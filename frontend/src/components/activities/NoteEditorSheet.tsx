"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { notesService } from "@/services/notes"
import { tasksService } from "@/services/tasks"
import type { ActivityEditorProps } from "./types"
import { sanitizeRichText } from "@/components/ui/tiptap-editor"
import dynamic from "next/dynamic"
import { TiptapEditorSkeleton } from "@/components/ui/TiptapEditorSkeleton"

const TiptapEditor = dynamic(
  () => import("@/components/ui/tiptap-editor").then(m => ({ default: m.TiptapEditor })),
  { ssr: false, loading: () => <TiptapEditorSkeleton /> }
)
import { FloatingPanel } from "./FloatingPanel"
import { FileText, ChevronDown } from "lucide-react"

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
    default: return ""
  }
}

export function NoteEditorSheet({ open, onClose, onSaved, entityType, entityId, workspaceId }: ActivityEditorProps) {
  const [content, setContent] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [createTodo, setCreateTodo] = React.useState(false)
  const [todoType, setTodoType] = React.useState("todo")

  const handleSave = async () => {
    const html = sanitizeRichText(content)
    if (html.replace(/<[^>]*>/g, "").trim() === "") return
    setSaving(true)
    try {
      const payload: any = {
        content: html,
      }
      if (entityType && entityId && ["contact", "company", "deal"].includes(entityType)) {
        payload.notable_type = entityType
        payload.notable_id = entityId
      }
      const { error } = await notesService.create(payload)
      if (error) throw error

      if (createTodo) {
        const taskPayload: any = {
          title: `Follow up: ${html.replace(/<[^>]*>/g, "").trim().slice(0, 80)}`,
          description: html,
          status: "pending",
        }
        if (entityType && entityId && ["contact", "company", "deal"].includes(entityType)) {
          taskPayload.taskable_type = entityType
          taskPayload.taskable_id = entityId
        }
        const { error: taskError } = await tasksService.create(taskPayload)
        if (taskError) throw taskError
      }
      toast.success("Note saved")
      setContent("")
      setCreateTodo(false)
      onSaved()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save note")
    } finally {
      setSaving(false)
    }
  }

  const isContentEmpty = content.replace(/<[^>]*>/g, "").trim() === ""

  const now = new Date()
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true })

  return (
    <FloatingPanel
      open={open}
      onClose={onClose}
      icon={<FileText className="w-4 h-4" />}
      title="Note"
      forSection={
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">For</span>
          <RecordChip label={entityLabel(entityType)} />
        </div>
      }
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
            disabled={isContentEmpty || saving}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-5"
          >
            {saving ? "Saving..." : "Create note"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <TiptapEditor
          content={content}
          onChange={setContent}
          placeholder="Start typing to leave a note..."
          toolbarVariant="note"
          minHeight="160px"
        />

        {/* Create todo task row */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Checkbox
            id="create-todo"
            checked={createTodo}
            onCheckedChange={(v) => setCreateTodo(v === true)}
          />
          <Label htmlFor="create-todo" className="text-muted-foreground cursor-pointer">
            Create a
          </Label>
          <Select value={todoType} onValueChange={setTodoType}>
            <SelectTrigger className="h-8 w-20 text-xs border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">todo</SelectItem>
              <SelectItem value="call">call</SelectItem>
              <SelectItem value="email">email</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">task to follow up</span>
          <span className="font-semibold text-foreground">In 3 business days (Thursday)</span>
        </div>
      </div>
    </FloatingPanel>
  )
}
