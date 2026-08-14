"use client"

import { useEffect, useRef } from "react"

function getPrimaryHSL(): { h: number; s: number; l: number } {
  const style = getComputedStyle(document.documentElement)
  const raw = style.getPropertyValue("--primary").trim()
  const parts = raw.split(/\s+/).map(Number)
  return { h: parts[0] || 217, s: parts[1] || 91, l: parts[2] || 60 }
}

function getBackgroundHSL(): string {
  const style = getComputedStyle(document.documentElement)
  const raw = style.getPropertyValue("--background").trim()
  return raw || "222.2 84% 4.9%"
}

const RADIUS = 200

export function MouseGlowEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeRef = useRef(false)
  const rafRef = useRef<number>(0)
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const saved = localStorage.getItem("app-mouse-glow") === "true"
    activeRef.current = saved
    if (saved) document.documentElement.classList.add("mouse-glow")
    if (!saved) canvas.style.display = "none"

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    const debouncedResize = () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
      resizeTimerRef.current = setTimeout(resize, 150)
    }

    let pending = false
    const onMouseMove = (e: MouseEvent) => {
      if (!activeRef.current) return
      if (pending) return
      pending = true
      rafRef.current = requestAnimationFrame(() => {
        const ctx = canvas.getContext("2d")
        if (!ctx) { pending = false; return }
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = `hsl(${getBackgroundHSL()})`
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        const { h, s, l } = getPrimaryHSL()
        const gradient = ctx.createRadialGradient(e.clientX, e.clientY, 0, e.clientX, e.clientY, RADIUS)
        gradient.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, 0.18)`)
        gradient.addColorStop(0.5, `hsla(${h}, ${s}%, ${l}%, 0.07)`)
        gradient.addColorStop(1, "transparent")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        pending = false
      })
    }

    const onMouseLeave = () => {
      cancelAnimationFrame(rafRef.current)
      pending = false
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = `hsl(${getBackgroundHSL()})`
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }

    const onToggle = () => {
      activeRef.current = !activeRef.current
      if (!activeRef.current) {
        cancelAnimationFrame(rafRef.current)
        pending = false
        const ctx = canvas.getContext("2d")
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
        canvas.style.display = "none"
        document.documentElement.classList.remove("mouse-glow")
      } else {
        canvas.style.display = ""
        document.documentElement.classList.add("mouse-glow")
      }
    }

    window.addEventListener("resize", debouncedResize)
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseleave", onMouseLeave)
    window.addEventListener("app-mouse-glow-changed", onToggle)

    return () => {
      cancelAnimationFrame(rafRef.current)
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current)
      window.removeEventListener("resize", debouncedResize)
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseleave", onMouseLeave)
      window.removeEventListener("app-mouse-glow-changed", onToggle)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -2,
        pointerEvents: "none",
      }}
    />
  )
}
