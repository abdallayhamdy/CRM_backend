'use client'

import { useAuth } from '@/hooks/use-auth'

export function WorkspaceSwitcher() {
  const { activeWorkspace } = useAuth()

  if (!activeWorkspace) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm font-medium">
      {activeWorkspace.name}
    </div>
  )
}
