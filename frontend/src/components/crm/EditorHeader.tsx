import * as React from "react"
import { ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EditorHeader({
  onClose,
  onSave,
  onReset,
  saving,
  hasChanges,
  title = "Edit Contact form",
}: {
  onClose: () => void
  onSave: (exit?: boolean) => void
  onReset: () => void
  saving: boolean
  hasChanges: boolean
  title?: string
}) {
  return (
    <header className="h-[52px] bg-foreground flex items-center justify-between px-4 shrink-0 text-primary-foreground shadow-sm z-50">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onClose}
          className="text-primary-foreground hover:bg-primary-foreground/10 h-9 px-3 gap-2 text-[14px] font-bold transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="h-5 w-[1px] bg-primary-foreground/20" />
        <h1 className="text-[14px] font-bold tracking-tight text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {!saving && (
          <span className="text-[12px] text-primary-foreground/50 font-medium mr-2">All changes saved</span>
        )}
        <Button
          variant="secondary"
          className="bg-muted hover:bg-border text-foreground h-9 px-5 text-[14px] font-bold border-none transition-colors"
          onClick={() => alert("The preview shows exactly how the creation form will look for your users.")}
        >
          Preview
        </Button>
        <Button
          variant="ghost"
          className="text-primary-foreground hover:bg-primary-foreground/10 h-9 px-4 text-[14px] font-bold transition-colors"
          onClick={onReset}
        >
          Reset
        </Button>
        <Button
          variant="ghost"
          className="text-primary-foreground hover:bg-primary-foreground/10 h-9 px-4 text-[14px] font-bold transition-colors"
          onClick={() => onSave()}
          disabled={saving || !hasChanges}
        >
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save"}
        </Button>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-6 text-[14px] font-bold border-none transition-all shadow-sm active:scale-95"
          onClick={() => onSave(true)}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save and exit"}
        </Button>
      </div>
    </header>
  )
}
