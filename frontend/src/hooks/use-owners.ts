"use client"

import { useState, useEffect } from "react"
import { authService } from "@/services/auth"
import { Profile } from "@/lib/types/crm"

export function useOwners(workspaceId: string | null) {
  const [owners, setOwners] = useState<Profile[]>([])

  useEffect(() => {
    if (!workspaceId) return

    const controller = new AbortController()

    async function loadOwners() {
      if (!workspaceId) return
      try {
        const { data } = await authService.listProfiles(workspaceId)
        if (!controller.signal.aborted && data) setOwners(data)
      } catch {
        // Expected in standalone mode
      }
    }

    loadOwners()
    return () => controller.abort()
  }, [workspaceId])

  return owners
}
