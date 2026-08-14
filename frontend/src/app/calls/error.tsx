'use client'

import { useEffect } from 'react'
import { reportError } from '@/lib/error-reporter'

export default function CallsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportError('Calls', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <h2 className="text-lg font-semibold text-foreground mb-2">Calls Error</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Failed to load calls. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
