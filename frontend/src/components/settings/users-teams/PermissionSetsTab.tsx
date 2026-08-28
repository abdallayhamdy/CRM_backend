"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, ArrowUpDown, Info, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { permissionSetsService, PermissionSet } from "@/services/permissionSets"
import { CreatePermissionSetPage } from "./CreatePermissionSetPage"

export function PermissionSetsTab() {
  const { workspaceId } = useAuth()
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [sets, setSets] = useState<PermissionSet[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [pageOpen, setPageOpen] = useState<
    { mode: "create" } | { mode: "edit"; set: PermissionSet } | null
  >(null)

  const reload = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    const { data, error } = await permissionSetsService.list(workspaceId)
    if (error) {
      toast.error(error.message)
    } else if (data) {
      setSets(data)
    }
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    reload()
  }, [reload, refreshKey])

  useEffect(() => {
    if (pageOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [pageOpen])

  const filtered = sets.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (set: PermissionSet) => {
    if (!workspaceId) return
    if (!confirm(`Delete "${set.name}"? Users with this permission set will lose its access.`)) return
    const { error } = await permissionSetsService.remove(workspaceId, set.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Permission set deleted.")
    setRefreshKey(k => k + 1)
  }

  const handleSaved = () => {
    setPageOpen(null)
    setRefreshKey(k => k + 1)
  }

  if (pageOpen) {
    return (
      <CreatePermissionSetPage
        onBack={() => setPageOpen(null)}
        onSaved={handleSaved}
        initialSet={pageOpen.mode === "edit" ? pageOpen.set : null}
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Create sets of access for different tasks your team does. Assign one or more to users to manage permissions in bulk.
      </p>

      <div className="flex items-center justify-between">
        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setPageOpen({ mode: "create" })} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Create permission set
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10">
                <Checkbox />
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1 cursor-pointer">
                  Name <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1 cursor-pointer">
                  Access <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1 cursor-pointer">
                  Users <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {sets.length === 0 ? "No permission sets yet." : "No permission sets match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(set => (
                <TableRow key={set.id} className="group">
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-primary hover:underline font-medium text-sm"
                        onClick={() => setPageOpen({ mode: "edit", set })}
                      >
                        {set.name}
                      </button>
                      {set.locked && (
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                          Locked
                        </span>
                      )}
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{set.locked ? "Locked" : "Custom"}</div>
                      <div className="text-muted-foreground">{set.description || "—"}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{set.users_count ?? set.users?.length ?? 0}</TableCell>
                  <TableCell>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setPageOpen({ mode: "edit", set })}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(set)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}