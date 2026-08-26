'use client'

import { CrmErrorBoundary } from "@/components/crm/CrmErrorBoundary"

export default function DealsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <CrmErrorBoundary error={error} reset={reset} category="Deals" />
}
