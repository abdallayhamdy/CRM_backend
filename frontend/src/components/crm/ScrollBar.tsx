"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ScrollBarProps {
  scrollRef: React.RefObject<HTMLDivElement | null>
  sliderRef: React.RefObject<HTMLInputElement | null>
  canScroll: boolean
}

function ScrollBarInner({ scrollRef, sliderRef, canScroll }: ScrollBarProps) {
  const handleSliderInput = (e: React.FormEvent<HTMLInputElement>) => {
    const value = parseFloat((e.target as HTMLInputElement).value)
    if (scrollRef.current) {
      const { scrollWidth, clientWidth } = scrollRef.current
      const scrollLeft = (value / 100) * (scrollWidth - clientWidth)
      scrollRef.current.scrollLeft = scrollLeft
    }
  }

  const scrollByAmount = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth'
      })
    }
  }

  if (!canScroll) return null

  return (
    <div className="h-6 flex items-center justify-center gap-4 px-4 border-t border-border relative z-30 shadow-[0_-1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center w-full max-w-[calc(100%-32px)] gap-2">
        <button
          onClick={() => scrollByAmount('left')}
          className="text-muted-foreground hover:text-muted-foreground transition-colors flex-shrink-0"
        >
          <ChevronLeft className="h-3 w-3" strokeWidth={2.5} />
        </button>

        <div className="flex-1 flex items-center h-4">
          <input
            ref={sliderRef}
            type="range"
            min="0"
            max="100"
            step="0.1"
            defaultValue="0"
            onInput={handleSliderInput}
            className="board-slider"
          />
        </div>

        <button
          onClick={() => scrollByAmount('right')}
          className="text-muted-foreground hover:text-muted-foreground transition-colors flex-shrink-0"
        >
          <ChevronRight className="h-3 w-3" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

export const ScrollBar = React.memo(ScrollBarInner)
ScrollBar.displayName = "ScrollBar"
