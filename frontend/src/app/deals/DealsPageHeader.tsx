"use client"

import * as React from "react"
import { Handshake, MoreVertical, ChevronDown, Package, ShoppingCart, Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { CrmPageHeader } from "@/components/crm/CrmPageLayout"
import { CrmTabs } from "@/components/crm/CrmTabs"
import { dealsService } from "@/services/deals"
import { toast } from "sonner"
import { logAudit } from "@/lib/audit"

interface DealsPageHeaderProps {
  canCreate: boolean
  canExport: boolean
  isCreateOpen: boolean
  setIsCreateOpen: (open: boolean) => void
  onExport: () => void
  workspaceId: string | null
  user: any
  onSuccess?: () => void
  tabItems: Array<{ id: string; label: string; closable?: boolean; count?: number; color?: string }>
  activeTab: string
  setActiveTab: (tab: string) => void
  handleTabClose: (id: string) => void
  handleTabReorder: (newTabs: { id: string; label: string; closable?: boolean; color?: string }[]) => void
  handleAddTab: () => void
  onRenameTab: (id: string, newName: string) => void
  onColorChangeTab: (id: string, color: string) => void
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
  const [status, setStatus] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setFile(null)
      setImporting(false)
      setStatus(null)
    }
  }, [open])

  const handleImport = async () => {
    if (!file || !workspaceId) return

    setImporting(true)
    setStatus("Uploading...")

    try {
      const result = await dealsService.importCSV(file, workspaceId)

      if (result.error) {
        toast.error(result.error.message)
        setImporting(false)
        return
      }

      const importId = result.data?.import_id
      if (!importId) {
        toast.error("Import started but no ID returned")
        setImporting(false)
        return
      }

      setStatus("Processing...")

      const pollInterval = setInterval(async () => {
        const pollResult = await dealsService.getImport(importId, workspaceId)

        if (pollResult.error) {
          clearInterval(pollInterval)
          setImporting(false)
          setStatus(null)
          toast.error(pollResult.error.message)
          return
        }

        const record = pollResult.data
        if (!record) {
          clearInterval(pollInterval)
          setImporting(false)
          setStatus(null)
          toast.error("Import record not found")
          return
        }

        if (record.status === "completed" || record.status === "completed_with_errors") {
          clearInterval(pollInterval)
          setImporting(false)
          setStatus(null)
          if (record.failed_rows > 0) {
            toast.warning(`Import finished with ${record.failed_rows} failed row(s) out of ${record.total_rows}.`)
          } else {
            toast.success(`Imported ${record.processed_rows} deals successfully.`)
          }
          if (workspaceId) {
            logAudit({
              workspace_id: workspaceId,
              action: "Import",
              category: "Deal",
              subcategory: "Deals Import Completed",
              source: "web",
              modifiedBy: user,
            })
          }
          onSuccess?.()
          onOpenChange(false)
        } else if (record.status === "failed") {
          clearInterval(pollInterval)
          setImporting(false)
          setStatus(null)
          toast.error(record.errors?.[0] ?? "Import failed.")
          onOpenChange(false)
        }
      }, 3000)
    } catch (err) {
      toast.error("Failed to import deals")
      setImporting(false)
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
        <h3 className="text-lg font-semibold mb-4">Import Deals</h3>

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

export function DealsPageHeader({
  canCreate,
  canExport,
  isCreateOpen,
  setIsCreateOpen,
  onExport,
  workspaceId,
  user,
  onSuccess,
  tabItems,
  activeTab,
  setActiveTab,
  handleTabClose,
  handleTabReorder,
  handleAddTab,
  onRenameTab,
  onColorChangeTab,
}: DealsPageHeaderProps) {
  const [importOpen, setImportOpen] = React.useState(false)

  return (
    <>
      <CrmPageHeader
        title="Deals"
        icon={<Handshake className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-muted-foreground">
              <MoreVertical className="h-5 w-5" />
            </Button>
            <Link href="/orders" className="h-9 inline-flex items-center gap-1.5 px-3 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">View Orders</span>
            </Link>
            <Link href="/products" className="h-9 inline-flex items-center gap-1.5 px-3 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Manage Products</span>
            </Link>
            {canExport && (
              <Button
                variant="outline"
                className="h-9 font-bold gap-2"
                onClick={onExport}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}
            {canCreate && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-4 gap-2 border-0 shadow-sm transition-all active:scale-95">
                    <span className="hidden sm:inline">Add deals</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-lg p-1">
                  <DropdownMenuItem
                    className="py-2.5 px-3 cursor-pointer text-sm font-medium"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    Create new
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="py-2.5 px-3 cursor-pointer text-sm font-medium"
                    onClick={() => setImportOpen(true)}
                  >
                    Import
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
        onSuccess={onSuccess}
      />
    </>
  )
}
