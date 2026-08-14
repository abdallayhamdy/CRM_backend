"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { FormEditorSkeleton } from "@/components/crm/FormEditorSkeleton"

const EditTaskFormEditor = dynamic(
  () => import("@/components/crm/EditTaskFormEditor").then(m => ({ default: m.EditTaskFormEditor })),
  { ssr: false, loading: () => <FormEditorSkeleton /> }
)

export default function TaskFormEditorPage() {
  const router = useRouter()

  return (
    <EditTaskFormEditor onClose={() => router.push('/tasks')} />
  )
}
