'use client'

import { CrmErrorBoundary } from "@/components/crm/CrmErrorBoundary"

export default function TicketsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <CrmErrorBoundary error={error} reset={reset} category="Tickets" />
}
