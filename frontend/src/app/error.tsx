'use client'

import { CrmErrorBoundary } from "@/components/crm/CrmErrorBoundary"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <CrmErrorBoundary
      error={error}
      reset={reset}
      category="RouteError"
      title="Something went wrong"
      description={error instanceof Error ? error.message : 'An unexpected error occurred.'}
    />
  )
}
