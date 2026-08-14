"use client"

import { useState } from "react"
import { Trash2, UserCheck, Download, X, Loader2, Pencil, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface WorkspaceMember {
  id: string
  name: string
}

interface BulkActionToolbarProps {
  count: number
  entityName: string
  onDelete: () => Promise<void>
  onAssignOwner?: (ownerId: string, ownerName: string) => Promise<void>
  onExport?: () => void
  onEdit?: () => void
  onCreateTask?: () => void
  onClear: () => void
  members?: WorkspaceMember[]
}

export function BulkActionToolbar({
  count,
  entityName,
  onDelete,
  onAssignOwner,
  onExport,
  onEdit,
  onCreateTask,
  onClear,
  members = []
}: BulkActionToolbarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [assigning, setAssigning] = useState(false)

  if (count === 0) return null

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete()
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleAssign = async (ownerId: string, ownerName: string) => {
    setAssigning(true)
    try {
      await onAssignOwner?.(ownerId, ownerName)
    } finally {
      setAssigning(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg shadow-xl border border-primary/80 animate-in slide-in-from-bottom-2">
        <span className="text-sm font-medium px-2 mr-1">
          {count} {entityName}{count > 1 ? 's' : ''} selected
        </span>
        <div className="w-px h-5 bg-primary-foreground/30 mx-1" />

        {onEdit && (
          <Button
            variant="ghost" size="sm"
            className="text-primary-foreground hover:bg-primary-foreground/20 h-8"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
        )}

        {onAssignOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost" size="sm"
                className="text-primary-foreground hover:bg-primary-foreground/20 h-8"
                disabled={assigning}
              >
                {assigning ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4 mr-1.5" />
                )}
                Assign
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {members.length === 0 ? (
                <DropdownMenuItem disabled>No members found</DropdownMenuItem>
              ) : members.map(member => (
                <DropdownMenuItem
                  key={member.id}
                  onClick={() => handleAssign(member.id, member.name)}
                >
                  {member.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onCreateTask && (
          <Button
            variant="ghost" size="sm"
            className="text-primary-foreground hover:bg-primary-foreground/20 h-8"
            onClick={onCreateTask}
          >
            <CheckSquare className="h-4 w-4 mr-1.5" />
            Create Task
          </Button>
        )}

        <Button
          variant="ghost" size="sm"
          className="text-primary-foreground hover:bg-primary-foreground/20 h-8"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleting}
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Delete
        </Button>

        {onExport && (
          <Button
            variant="ghost" size="sm"
            className="text-primary-foreground hover:bg-primary-foreground/20 h-8"
            onClick={onExport}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
        )}

        <Button
          variant="ghost" size="sm"
          className="text-primary-foreground/70 hover:bg-primary-foreground/20 hover:text-primary-foreground h-8 ml-1"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {count} {entityName}{count > 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All selected {entityName}s will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                `Delete ${count} ${entityName}${count > 1 ? 's' : ''}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
