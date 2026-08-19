"use client"

import { useEffect, useState } from "react"

interface SyncedTypewriterProps {
  lines: { text: string; className?: string }[]
  speed?: number
  delayBetweenWords?: number
  cursor?: boolean
  cursorChar?: string
}

export function SyncedTypewriter({
  lines,
  speed = 100,
  delayBetweenWords = 2000,
  cursor = true,
  cursorChar = "|",
}: SyncedTypewriterProps) {
  const [displayTexts, setDisplayTexts] = useState<string[]>(lines.map(() => ""))
  const [isDeleting, setIsDeleting] = useState(false)
  const [charIndex, setCharIndex] = useState(0)
  const [showCursor, setShowCursor] = useState(true)

  const maxLength = Math.max(...lines.map((l) => l.text.length))

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (charIndex < maxLength) {
            setDisplayTexts(lines.map((l) => l.text.substring(0, charIndex + 1)))
            setCharIndex(charIndex + 1)
          } else {
            setTimeout(() => {
              setIsDeleting(true)
            }, delayBetweenWords)
          }
        } else {
          if (charIndex > 0) {
            setDisplayTexts(lines.map((l) => l.text.substring(0, charIndex - 1)))
            setCharIndex(charIndex - 1)
          } else {
            setIsDeleting(false)
          }
        }
      },
      isDeleting ? speed / 2 : speed,
    )

    return () => clearTimeout(timeout)
  }, [charIndex, isDeleting, speed, delayBetweenWords, lines, maxLength])

  useEffect(() => {
    if (!cursor) return

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)

    return () => clearInterval(cursorInterval)
  }, [cursor])

  return (
    <div className="flex flex-col items-center gap-4">
      {lines.map((line, index) => (
        <div key={index} className={line.className}>
          {displayTexts[index]}
          {cursor && index === lines.length - 1 && (
            <span className="ml-1 transition-opacity duration-75" style={{ opacity: showCursor ? 1 : 0 }}>
              {cursorChar}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
