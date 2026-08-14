"use client"

import { useEffect, useState, useCallback } from "react"
import { LAYOUT_CONSTANTS } from "@/lib/layout-constants"

function getPrimaryHSL(): { h: number; s: number; l: number } {
  const style = getComputedStyle(document.documentElement)
  const raw = style.getPropertyValue("--primary").trim()
  const parts = raw.split(/\s+/).map(Number)
  return { h: parts[0] || 217, s: parts[1] || 91, l: parts[2] || 60 }
}

export function GridOverlay() {
  const [visible, setVisible] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [gridImage, setGridImage] = useState("")

  const updateGrid = useCallback(() => {
    const dark = document.documentElement.classList.contains("dark")
    const p = getPrimaryHSL()

    if (dark) {
      setGridImage(
        `linear-gradient(hsla(${p.h}, ${p.s}%, ${p.l}%, 0.08) 1px, transparent 1px), ` +
        `linear-gradient(90deg, hsla(${p.h}, ${p.s}%, ${p.l}%, 0.08) 1px, transparent 1px)`
      )
    } else {
      setGridImage(
        `linear-gradient(hsla(${p.h}, ${p.s}%, ${Math.max(p.l - 30, 10)}%, 0.1) 1px, transparent 1px), ` +
        `linear-gradient(90deg, hsla(${p.h}, ${p.s}%, ${Math.max(p.l - 30, 10)}%, 0.1) 1px, transparent 1px)`
      )
    }
  }, [])

  useEffect(() => {
    const check = () => {
      setVisible(document.documentElement.classList.contains("grid-bg"))
      setIsDark(document.documentElement.classList.contains("dark"))
      updateGrid()
    }
    check()

    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [updateGrid])

  if (!visible) return null

  return (
    <div
      style={{
        position: "fixed",
        top: LAYOUT_CONSTANTS.TOPNAV_HEIGHT,
        left: LAYOUT_CONSTANTS.SIDEBAR_WIDTH,
        right: 0,
        bottom: 0,
        zIndex: -1,
        pointerEvents: "none",
        backgroundImage: gridImage,
        backgroundSize: "28px 28px",
      }}
    />
  )
}
