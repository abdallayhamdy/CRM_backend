"use client"

import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { FormEditorSkeleton } from "@/components/crm/FormEditorSkeleton"

const EditContactFormEditor = dynamic(
  () => import("@/components/crm/EditContactFormEditor").then(m => ({ default: m.EditContactFormEditor })),
  { ssr: false, loading: () => <FormEditorSkeleton /> }
)

export default function FormEditorPage() {
  const router = useRouter()

  return (
    <EditContactFormEditor onClose={() => router.push('/contacts')} />
  )
}
