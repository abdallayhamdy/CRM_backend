'use client'

import { useEffect, useRef } from 'react'

type Table = 'deals' | 'tickets' | 'contacts' | 'activity_comments'

interface RealtimeOptions {
  intervalMs?: number
}

/**
 * Poll-based replacement for Supabase Realtime.
 * Calls the provided callback on a fixed interval instead of
 * maintaining a WebSocket subscription.
 * Optimized to pause when page is in background (not visible).
 */
export function useRealtime(
  onEvent: (payload: Record<string, unknown>) => void,
  tables: Table[] = ['deals', 'tickets', 'contacts', 'activity_comments'],
  workspaceId?: string | null,
  options: RealtimeOptions = {}
) {
  const { intervalMs = 15000 } = options // Optimized default interval to 15s to reduce network load
  const callbackRef = useRef(onEvent)
  callbackRef.current = onEvent

  const tablesKey = tables.join(',')

  useEffect(() => {
    // Check for future window.Echo or window.Socket support
    const win = typeof window !== 'undefined' ? (window as any) : null
    if (win && win.Echo && workspaceId) {
      // Future Laravel Echo subscription logic:
      // const channel = win.Echo.private(`workspace.${workspaceId}`)
      // tables.forEach(table => {
      //   channel.listen(`.table.${table}`, (e: any) => callbackRef.current(e))
      // })
      // return () => {
      //   win.Echo.leave(`workspace.${workspaceId}`)
      // }
    }

    const runPoll = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return // Pause polling if tab is in the background
      }
      callbackRef.current({ type: 'poll', tables, workspaceId })
    }

    const id = setInterval(runPoll, intervalMs)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runPoll()
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    return () => {
      clearInterval(id)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [tablesKey, workspaceId, intervalMs])
}
