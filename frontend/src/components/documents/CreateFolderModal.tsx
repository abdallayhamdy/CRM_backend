"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { documentsService } from "@/services/documents"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { FolderPlus, Loader2 } from "lucide-react"

const folderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(100, "Name must be 100 characters or less"),
})

type FolderValues = z.infer<typeof folderSchema>

interface CreateFolderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateFolderModal({ open, onOpenChange, onSuccess }: CreateFolderModalProps) {
  const { workspaceId, user } = useAuth()
  const [creating, setCreating] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FolderValues>({
    resolver: zodResolver(folderSchema),
    mode: "onChange",
  })

  const onSubmit = async (data: FolderValues) => {
    setCreating(true)
    try {
      await documentsService.create({
        name: data.name,
        type: "Folder",
        uploaded_by: user?.id || null,
        workspace_id: workspaceId || undefined,
      })

      toast.success(`Folder "${data.name}" created`)
      reset()
      onSuccess?.()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create folder")
    } finally {
      setCreating(false)
    }
  }

  React.useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg flex flex-col gap-0">
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Create Folder
          </SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 crm-scrollbar">
          <p className="text-muted-foreground text-sm">Create a new folder to organize your documents.</p>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-semibold after:content-['*'] after:ml-0.5 after:text-destructive">
              Folder Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Q4 Proposals"
              className="border-border focus-visible:ring-primary"
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          </div>

          <div className="shrink-0 px-6 py-4 border-t border-border bg-background flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button" disabled={creating} className="h-9 text-[13px] font-semibold border-border text-foreground hover:bg-muted/50 disabled:opacity-50">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || creating}
              className="h-9 text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-sm disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
