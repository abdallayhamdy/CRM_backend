"use client"

import { SuperAdminLayout } from "@/components/super-admin/SuperAdminLayout"
import { RouteGuard } from "@/components/auth/RouteGuard"

export default function SuperAdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard requireAuth={true} requireSuperAdmin={true}>
      <SuperAdminLayout>{children}</SuperAdminLayout>
    </RouteGuard>
  )
}
