"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [feedback, setFeedback] = React.useState("")

  function handleSubmit() {
    onOpenChange(false)
    setFeedback("")
  }

  if (!open) return null

  return (
    <div className="fixed bottom-4 right-4 z-[200] w-80 rounded-xl border border-border bg-card shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-foreground">Send Feedback</span>
        <button
          onClick={() => onOpenChange(false)}
          className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground">
          Help us improve Rootline CRM. Your feedback is invaluable.
        </p>
        <Textarea
          placeholder="How can we improve Rootline CRM?"
          aria-label="Send feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="min-h-[80px] text-sm"
        />
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={handleSubmit}>
            Send feedback
          </Button>
        </div>
      </div>
    </div>
  )
}
