"use client"

import { useState, useEffect } from "react"
import { Search, ArrowUpDown, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { CreatePermissionSetPage } from "./CreatePermissionSetPage"

export function PermissionSetsTab() {
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (createOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [createOpen])

  const permissionSets = [
    {
      id: "super_admin",
      name: "Super Admin",
      access: "Super Admin",
      accessDetail: "Super Admin",
      userCount: 1,
    }
  ]

  const filtered = permissionSets.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  if (createOpen) {
    return <CreatePermissionSetPage onBack={() => setCreateOpen(false)} />
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
        <Button onClick={() => setCreateOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(set => (
              <TableRow key={set.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                      className="text-primary hover:underline font-medium text-sm"
                      onClick={() => setCreateOpen(true)}
                    >
                      {set.name}
                    </button>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{set.access}</div>
                    <div className="text-muted-foreground">{set.accessDetail}</div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{set.userCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
