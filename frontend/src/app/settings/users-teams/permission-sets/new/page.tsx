"use client"

import { useRouter } from "next/navigation"
import { CreatePermissionSetPage } from "@/components/settings/users-teams/CreatePermissionSetPage"

export default function NewPermissionSetPage() {
  const router = useRouter()

  return (
    <CreatePermissionSetPage onBack={() => router.push("/settings/users-teams")} />
  )
}
