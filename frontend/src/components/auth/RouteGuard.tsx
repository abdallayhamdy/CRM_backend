"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

interface RouteGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireSuperAdmin?: boolean
  requirePermissions?: string[]
  redirectTo?: string
}

export function RouteGuard({
  children,
  requireAuth = true,
  requireSuperAdmin = false,
  requirePermissions = [],
  redirectTo,
}: RouteGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, isSuperAdmin, permissions } = useAuth()

  useEffect(() => {
    if (loading) return

    if (requireAuth && !user) {
      router.replace(redirectTo || "/login")
      return
    }

    if (requireSuperAdmin && !isSuperAdmin) {
      router.replace(redirectTo || "/dashboard")
      return
    }

    if (!isSuperAdmin && requirePermissions.length > 0) {
      const hasPermission = requirePermissions.some((p) => permissions.includes(p))
      if (!hasPermission) {
        router.replace(redirectTo || "/dashboard")
        return
      }
    }
  }, [loading, user, isSuperAdmin, permissions, requireAuth, requireSuperAdmin, requirePermissions, redirectTo, router, pathname])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (requireAuth && !user) return null

  if (requireSuperAdmin && !isSuperAdmin) return null

  if (!isSuperAdmin && requirePermissions.length > 0) {
    const hasPermission = requirePermissions.some((p) => permissions.includes(p))
    if (!hasPermission) return null
  }

  return <>{children}</>
}
