'use client'

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DataTable } from "@/components/shared/DataTable"
import { superAdminService, type PlatformOwner } from "@/services/super-admin"
import { Shield, Loader2, Plus, UserMinus } from "lucide-react"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function CreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [passwordConfirmation, setPasswordConfirmation] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== passwordConfirmation) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    const result = await superAdminService.createPlatformOwner({ name, email, password, password_confirmation: passwordConfirmation })
    setLoading(false)

    if (result.error) {
      setError(result.error.message)
    } else {
      toast.success("Platform Owner created successfully")
      setName("")
      setEmail("")
      setPassword("")
      setPasswordConfirmation("")
      onOpenChange(false)
      onCreated()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Platform Owner</DialogTitle>
          <DialogDescription>
            Add a new Platform Owner with full platform administration access.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="po-name">Full Name</Label>
            <Input
              id="po-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="po-email">Email</Label>
            <Input
              id="po-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="po-password">Password</Label>
            <Input
              id="po-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
              minLength={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="po-password-confirm">Confirm Password</Label>
            <Input
              id="po-password-confirm"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              dir="ltr"
              minLength={8}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function PlatformOwnersPage() {
  const [owners, setOwners] = React.useState<PlatformOwner[]>([])
  const [loading, setLoading] = React.useState(true)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [deactivateTarget, setDeactivateTarget] = React.useState<PlatformOwner | null>(null)

  const loadOwners = React.useCallback(async () => {
    setLoading(true)
    const result = await superAdminService.getPlatformOwners()
    if (!result.error) {
      setOwners(result.data)
    }
    setLoading(false)
  }, [])

  React.useEffect(() => {
    loadOwners()
  }, [loadOwners])

  const handleDeactivate = async () => {
    if (!deactivateTarget) return
    const result = await superAdminService.deactivatePlatformOwner(deactivateTarget.id)
    setDeactivateTarget(null)
    if (result.error) {
      toast.error(result.error.message)
    } else {
      toast.success(`${deactivateTarget.name} has been deactivated`)
      loadOwners()
    }
  }

  const columns: ColumnDef<PlatformOwner, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
              {getInitials(row.original.name)}
            </div>
            <span className="font-medium text-foreground">
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const owner = row.original
          return (
            <div className="flex items-center justify-end gap-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Platform Owner
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setDeactivateTarget(owner)}
              >
                <UserMinus className="h-3 w-3 mr-1" />
                Deactivate
              </Button>
            </div>
          )
        },
      },
    ],
    []
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-foreground">Platform Owners</h1>
            <p className="text-xs text-muted-foreground">
              {loading ? "Loading..." : `${owners.length} platform owner${owners.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Platform Owner
        </Button>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={owners}
            searchKey="name"
            emptyTitle="No platform owners"
            emptyDescription="No platform owners have been created yet."
          />
        )}
      </div>

      <CreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={loadOwners}
      />

      <AlertDialog open={!!deactivateTarget} onOpenChange={() => setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Platform Owner?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate <strong>{deactivateTarget?.name}</strong> and revoke their access.
              They will no longer be able to access the super admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
