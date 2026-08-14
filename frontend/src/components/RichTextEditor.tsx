"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { TiptapEditorSkeleton } from "@/components/ui/TiptapEditorSkeleton"

const TiptapEditor = dynamic(
  () => import("@/components/ui/tiptap-editor").then(m => ({ default: m.TiptapEditor })),
  { ssr: false, loading: () => <TiptapEditorSkeleton /> }
)

interface RichTextEditorProps {
  initialValue?: string
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
  onFocus?: () => void
  onBlur?: () => void
  minHeight?: string
  style?: React.CSSProperties
}

export const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  ({ initialValue = "", onChange, placeholder, className, onFocus, onBlur, minHeight, style }, ref) => {
    // Keep the public `ref` pointing at a real DOM node (callers read it as HTMLDivElement)
    const innerRef = React.useRef<HTMLDivElement>(null)
    React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement)

    return (
      <div ref={innerRef} className={className} style={style}>
        <TiptapEditor
          content={initialValue}
          placeholder={placeholder}
          editable
          minHeight={minHeight}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={onChange}
        />
      </div>
    )
  }
)

RichTextEditor.displayName = "RichTextEditor"
