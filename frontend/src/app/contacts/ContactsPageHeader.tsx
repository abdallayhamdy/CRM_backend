"use client"

import * as React from "react"
import { UserPlus, UserRound, Download, Upload, Copy, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportToCSV } from "@/lib/utils"
import { CrmPageHeader } from "@/components/crm/CrmPageLayout"
import { CrmTabs } from "@/components/crm/CrmTabs"
import { Contact } from "@/lib/types/crm"
import { logAudit } from "@/lib/audit"
import { toast } from "sonner"
import { laravelApi } from "@/lib/laravel-api"
import { contactsService } from "@/services/contacts"

interface ContactsPageHeaderProps {
  canCreate: boolean
  canExport: boolean
  data: Contact[]
  workspaceId: string | null
  user: any
  setCreateContactOpen: (open: boolean) => void
  tabItems: Array<{ id: string; label: string; closable?: boolean; count?: number; color?: string }>
  activeTab: string
  setActiveTab: (tab: string) => void
  handleTabClose: (id: string) => void
  handleTabReorder: (newTabs: { id: string; label: string; closable?: boolean; color?: string }[]) => void
  handleAddTab: () => void
  onRenameTab: (id: string, newName: string) => void
  onColorChangeTab: (id: string, color: string) => void
  onDataChange?: () => void
  selectedCount?: number
}

function ImportDialog({ open, onOpenChange, workspaceId, user, onSuccess }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string | null
  user: any
  onSuccess?: () => void
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [file, setFile] = React.useState<File | null>(null)
  const [importing, setImporting] = React.useState(false)
  const [polling, setPolling] = React.useState(false)
  const [status, setStatus] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setFile(null)
      setImporting(false)
      setPolling(false)
      setStatus(null)
    }
  }, [open])

  const handleImport = async () => {
    if (!file || !workspaceId) return

    setImporting(true)
    setStatus("Uploading...")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const { data, error } = await laravelApi.upload<{
        status: string
        data: { import_id: string; status: string }
      }>("/contacts/import", formData)

      if (error) {
        toast.error(error)
        setImporting(false)
        return
      }

      const importId = data?.data?.import_id
      if (!importId) {
        toast.error("Import started but no ID returned")
        setImporting(false)
        return
      }

      setPolling(true)
      setStatus("Processing...")

      const pollInterval = setInterval(async () => {
        const { data: statusData, error: statusError } = await laravelApi.get<{
          status: string
          data: {
            id: string
            status: string
            total_rows: number
            processed_rows: number
            failed_rows: number
            errors: string[] | null
            file_name: string
          }
        }>(`/contacts/import/${importId}`)

        if (statusError) {
          clearInterval(pollInterval)
          setImporting(false)
          setPolling(false)
          toast.error("Failed to check import status")
          return
        }

        const importStatus = statusData?.data
        if (!importStatus) return

        if (["completed", "completed_with_errors", "failed"].includes(importStatus.status)) {
          clearInterval(pollInterval)
          setImporting(false)
          setPolling(false)

          if (importStatus.status === "completed") {
            const count = importStatus.processed_rows || importStatus.total_rows || 0
            toast.success(`Successfully imported ${count} contacts`)
            if (workspaceId) {
              logAudit({
                workspace_id: workspaceId,
                action: "Import",
                category: "Contact",
                subcategory: "Contacts Imported",
                source: "web",
                modifiedBy: user,
              })
            }
            onOpenChange(false)
            onSuccess?.()
          } else if (importStatus.status === "completed_with_errors") {
            const processed = importStatus.processed_rows || 0
            const failed = importStatus.failed_rows || 0
            toast.warning(`Imported ${processed} contacts, ${failed} failed`)
            onOpenChange(false)
            onSuccess?.()
          } else {
            toast.error(`Import failed: ${importStatus.errors?.join(", ") || "Unknown error"}`)
          }
          setStatus(null)
        } else {
          const processed = importStatus.processed_rows || 0
          const total = importStatus.total_rows || 0
          setStatus(total > 0 ? `Processing... ${processed}/${total}` : "Processing...")
        }
      }, 2000)
    } catch (err) {
      toast.error("Failed to import contacts")
      setImporting(false)
      setPolling(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => !importing && onOpenChange(false)}
    >
      <div
        className="bg-background rounded-xl border border-border shadow-xl p-6 w-[480px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Import Contacts</h3>

        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {file ? file.name : "Click to select a CSV file"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setFile(f)
              }}
            />
          </div>

          {status && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              {status}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importing}
            >
              {importing ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CopyDialog({ open, onOpenChange, contact, workspaceId, user, onSuccess }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact | null
  workspaceId: string | null
  user: any
  onSuccess?: () => void
}) {
  React.useEffect(() => {
    if (!open) return
  }, [open])

  const handleCopy = async () => {
    if (!contact || !workspaceId) return

    try {
      const duplicate: Record<string, unknown> = {
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email ? `copy_${Date.now()}_${contact.email}` : undefined,
        phone: contact.phone,
        company_id: contact.company_id,
        owner_id: contact.owner_id,
        lifecycle_stage: contact.lifecycle_stage,
      }
      if (contact.custom_fields) {
        duplicate.custom_fields = {
          ...contact.custom_fields,
        }
      }

      const { data, error } = await contactsService.create(duplicate as Partial<Contact>)

      if (error) {
        toast.error(error.message || "Failed to duplicate contact")
        return
      }

      if (workspaceId) {
        logAudit({
          workspace_id: workspaceId,
          action: "Copy",
          category: "Contact",
          subcategory: "Contact Duplicated",
          source: "web",
          modifiedBy: user,
        })
      }

      toast.success("Contact duplicated successfully")
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      toast.error("Failed to duplicate contact")
    }
  }

  if (!open || !contact) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-background rounded-xl border border-border shadow-xl p-6 w-[400px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-2">Duplicate Contact</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create a copy of <strong>{contact.first_name} {contact.last_name}</strong>?
          The email will be modified to avoid duplicates.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ContactsPageHeader({
  canCreate,
  canExport,
  data,
  workspaceId,
  user,
  setCreateContactOpen,
  tabItems,
  activeTab,
  setActiveTab,
  handleTabClose,
  handleTabReorder,
  handleAddTab,
  onRenameTab,
  onColorChangeTab,
  onDataChange,
  selectedCount = 0,
  selectedContact,
}: ContactsPageHeaderProps & { selectedContact?: Contact | null }) {
  const [importOpen, setImportOpen] = React.useState(false)
  const [copyOpen, setCopyOpen] = React.useState(false)
  const [selectedForCopy, setSelectedForCopy] = React.useState<Contact | null>(null)
  const [saving, setSaving] = React.useState(false)

  const handleExport = () => {
    const exportData = data.map(c => ({
      "First Name": c.first_name,
      "Last Name": c.last_name,
      "Email": c.email,
      "Phone": c.phone,
      "Lifecycle Stage": c.lifecycle_stage,
      "Company": c.company?.name || "",
      "Lead Status": c.lead_status || "",
      "Owner": c.owner ? `${c.owner.first_name} ${c.owner.last_name}` : "Unassigned",
      "Created At": c.created_at,
      "Updated At": c.updated_at,
    }))
    exportToCSV(exportData, "contacts")
    if (workspaceId) {
      logAudit({
        workspace_id: workspaceId,
        action: "Export",
        category: "Contact",
        subcategory: "Contacts Exported",
        source: "web",
        modifiedBy: user,
      })
    }
    toast.success("Contacts exported successfully")
  }

  const handleCopy = () => {
    if (selectedCount === 0) {
      toast.error("Please select a contact first.")
      return
    }
    if (selectedCount > 1) {
      toast.error("Please select a single contact to copy.")
      return
    }
    if (selectedContact) {
      setSelectedForCopy(selectedContact)
      setCopyOpen(true)
    }
  }

  const handleSave = () => {
    setSaving(true)
    try {
      localStorage.setItem("crm_contact_active_view", activeTab)
      toast.success("View saved")
      if (workspaceId) {
        logAudit({
          workspace_id: workspaceId,
          action: "Save",
          category: "Contact",
          subcategory: "View Saved",
          source: "web",
          modifiedBy: user,
        })
      }
    } catch {
      toast.error("Failed to save view")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <CrmPageHeader
        title="Contacts"
        icon={<UserRound className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {canCreate && (
              <Button
                variant="outline"
                className="h-9 font-bold gap-2"
                onClick={() => setImportOpen(true)}
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Import</span>
              </Button>
            )}
            {canExport && (
              <Button
                variant="outline"
                className="h-9 font-bold gap-2"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}
            {canCreate && (
              <Button
                variant="outline"
                className="h-9 font-bold gap-2"
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
            )}
            <Button
              variant="outline"
              className="h-9 font-bold gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">{saving ? "Saving..." : "Save"}</span>
            </Button>
            {canCreate && (
              <Button
                onClick={() => setCreateContactOpen(true)}
                className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 gap-2 border-0 shadow-sm transition-all active:scale-95"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Create contact</span>
              </Button>
            )}
          </div>
        }
      >
        <CrmTabs
          items={tabItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onTabClose={handleTabClose}
          onReorder={handleTabReorder}
          onAddTab={handleAddTab}
          onRenameTab={onRenameTab}
          onColorChangeTab={onColorChangeTab}
          className="ml-0"
        />
      </CrmPageHeader>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        workspaceId={workspaceId}
        user={user}
        onSuccess={onDataChange}
      />

      <CopyDialog
        open={copyOpen}
        onOpenChange={setCopyOpen}
        contact={selectedForCopy}
        workspaceId={workspaceId}
        user={user}
        onSuccess={onDataChange}
      />
    </>
  )
}
