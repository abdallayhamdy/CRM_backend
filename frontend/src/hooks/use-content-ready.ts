import { useState, useEffect, useRef } from "react"

/**
 * Ensures content skeleton displays for at least `minDelay` ms after data is ready,
 * preventing flash of incomplete content. Data-ready signal comes from the caller
 * (e.g. entity prop becoming non-null), not from an internal fetch.
 */
export function useContentReady(open: boolean, isDataReady: boolean, minDelay = 100) {
  const [isContentReady, setIsContentReady] = useState(false)
  const dataReadyAtRef = useRef(0)

  // Track the moment data becomes available while sheet is open
  useEffect(() => {
    if (open && isDataReady) {
      dataReadyAtRef.current = Date.now()
    }
  }, [open, isDataReady])

  // Once data is ready, wait the remaining time (minDelay - elapsed) then show content
  useEffect(() => {
    if (!open || !isDataReady || dataReadyAtRef.current === 0) {
      setIsContentReady(false)
      return
    }

    const elapsed = Date.now() - dataReadyAtRef.current
    const remaining = Math.max(0, minDelay - elapsed)

    const timer = setTimeout(() => setIsContentReady(true), remaining)
    return () => clearTimeout(timer)
  }, [open, isDataReady, minDelay])

  // Reset when sheet closes
  useEffect(() => {
    if (!open) {
      setIsContentReady(false)
      dataReadyAtRef.current = 0
    }
  }, [open])

  return isContentReady
}
