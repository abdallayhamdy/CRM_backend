"use client"

import * as React from "react"
import { Folder, FolderOpen, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface FolderItem {
  id: string
  name: string
  documentCount: number
}

interface FoldersSectionProps {
  folders: FolderItem[]
  selectedFolderId: string | null
  onSelect: (folderId: string | null) => void
  onDelete: (folderId: string) => void
  onRename: (folderId: string, newName: string) => void
  onCreateNew: () => void
}

export function FoldersSection({
  folders,
  selectedFolderId,
  onSelect,
  onDelete,
  onRename,
  onCreateNew,
}: FoldersSectionProps) {
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editValue, setEditValue] = React.useState("")

  const handleDoubleClick = (folder: FolderItem) => {
    setEditingId(folder.id)
    setEditValue(folder.name)
  }

  const handleRenameSubmit = (folderId: string) => {
    if (editValue.trim()) {
      onRename(folderId, editValue.trim())
    }
    setEditingId(null)
  }

  return (
    <div className="px-2 py-3">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Folders</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* All Documents Card */}
        <button
          onClick={() => onSelect(null)}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
            selectedFolderId === null
              ? "border-primary bg-primary/5 text-primary"
              : "border-border bg-card hover:border-primary/50 hover:bg-muted/50 text-foreground"
          }`}
        >
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
            selectedFolderId === null ? "bg-primary/10" : "bg-muted"
          }`}>
            <FolderOpen className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">All documents</span>
        </button>

        {/* Folder Cards */}
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all group ${
              selectedFolderId === folder.id
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-card hover:border-primary/50 hover:bg-muted/50 text-foreground"
            }`}
          >
            <div
              onClick={() => onSelect(folder.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(folder.id) } }}
              role="button"
              tabIndex={0}
              className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            >
              <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                selectedFolderId === folder.id ? "bg-primary/10" : "bg-muted"
              }`}>
                <Folder className="h-4 w-4" />
              </div>
              {editingId === folder.id ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleRenameSubmit(folder.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameSubmit(folder.id)
                    if (e.key === "Escape") setEditingId(null)
                  }}
                  className="h-6 w-32 text-sm"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  className="text-sm font-medium truncate max-w-[120px]"
                  onDoubleClick={() => handleDoubleClick(folder)}
                >
                  {folder.name}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{folder.documentCount}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDoubleClick(folder)
                }}
                title="Rename"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(folder.id)
                }}
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}

        {/* Create New Folder Card */}
        <button
          onClick={onCreateNew}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-muted-foreground hover:text-foreground"
        >
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
          </div>
          <span className="text-sm font-medium">New folder</span>
        </button>
      </div>
    </div>
  )
}