export interface ActivityEditorProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  entityType?: "contact" | "company" | "deal" | "ticket" | "document" | "order"
  entityId?: string
  workspaceId: string | null
}
