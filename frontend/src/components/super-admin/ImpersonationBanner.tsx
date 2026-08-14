"use client"

import * as React from "react"
import { toast } from "sonner"
import { superAdminService, type ImpersonationStatus } from "@/services/super-admin"
import { clearImpersonationToken, isImpersonating } from "@/lib/laravel-api"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"

export function ImpersonationBanner() {
  const [status, setStatus] = React.useState<ImpersonationStatus | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [stopping, setStopping] = React.useState(false)
  const [countdown, setCountdown] = React.useState("")

  React.useEffect(() => {
    if (!isImpersonating()) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function checkStatus() {
      const result = await superAdminService.getImpersonationStatus()
      if (cancelled) return

      if (result.error || !result.data?.active) {
        clearImpersonationToken()
        setStatus(null)
        setLoading(false)
        return
      }

      setStatus(result.data)
      setLoading(false)
    }

    checkStatus()
    const interval = setInterval(checkStatus, 60000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  React.useEffect(() => {
    if (!status?.expires_at) return

    function updateCountdown() {
      const now = new Date()
      const expires = new Date(status!.expires_at!)
      const diff = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000))
      const minutes = Math.floor(diff / 60)
      const seconds = diff % 60
      setCountdown(`${minutes}:${seconds.toString().padStart(2, "0")}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [status?.expires_at])

  const handleStop = async () => {
    setStopping(true)
    const result = await superAdminService.stopImpersonation()
    if (result.error) {
      toast.error(result.error.message)
      setStopping(false)
      return
    }
    clearImpersonationToken()
    setStatus(null)
    toast.success("Impersonation ended. You are back to your Platform Owner account.")
    window.location.href = "/super-admin/users"
    setStopping(false)
  }

  if (loading || !status?.active) return null

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2.5 flex items-center justify-between text-sm font-medium shrink-0">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Impersonating <strong>{status.target_user?.name}</strong> ({status.target_user?.email}) in{" "}
          <strong>{status.workspace?.name}</strong>
        </span>
        {countdown && (
          <span className="ml-2 text-amber-800 text-xs">
            ({countdown})
          </span>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-3 text-xs font-bold bg-amber-600 text-amber-50 border-amber-700 hover:bg-amber-700"
        onClick={handleStop}
        disabled={stopping}
      >
        {stopping ? (
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
        ) : null}
        Stop Impersonation
      </Button>
    </div>
  )
}
