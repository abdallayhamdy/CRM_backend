"use client"

import * as React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Placeholder from "@tiptap/extension-placeholder"
import Image from "@tiptap/extension-image"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import Highlight from "@tiptap/extension-highlight"
import FontFamily from "@tiptap/extension-font-family"
import DOMPurify from "dompurify"
import { cn } from "@/lib/utils"
import { FontSize } from "@/lib/tiptap/font-size"

export interface TiptapEditorProps {
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
  editable?: boolean
  className?: string
  minHeight?: string
  style?: React.CSSProperties
  onFocus?: () => void
  onBlur?: () => void
  toolbarVariant?: "note" | "task"
}

export function TiptapEditor({
  content = "",
  onChange,
  placeholder,
  editable = true,
  className,
  minHeight = "150px",
  style,
  onFocus,
  onBlur,
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({
        bulletList: { HTMLAttributes: { class: "list-disc list-inside mb-4 ml-2 space-y-1" } },
        orderedList: { HTMLAttributes: { class: "list-decimal list-inside mb-4 ml-2 space-y-1" } },
        blockquote: {
          HTMLAttributes: {
            class: "border-l-4 border-border pl-4 py-1 my-4 bg-muted/40 italic text-muted-foreground rounded-r",
          },
        },
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      Image.configure({
        HTMLAttributes: { class: "max-w-full rounded-md" },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2 font-medium",
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder || "" }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      FontFamily,
      FontSize,
    ],
    editable,
    content: content || "",
    editorProps: {
      attributes: {
        class: cn(
          "rich-text-content outline-none text-foreground leading-relaxed w-full focus:outline-none",
          className,
        ),
        style: `min-height:${minHeight}; padding:0.75rem; overflow-y:auto; font-family: sans-serif; font-size: 11pt;`,
      },
      handleDOMEvents: {
        focus: () => {
          onFocus?.()
          return false
        },
        blur: () => {
          onBlur?.()
          return false
        },
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  React.useEffect(() => {
    if (editor && !editor.isDestroyed && content !== undefined) {
      try {
        if (content !== editor.getHTML()) {
          editor.commands.setContent(content || "", { emitUpdate: false })
        }
      } catch {
        // Editor may have been destroyed during render
      }
    }
  }, [content, editor])

  React.useEffect(() => {
    editor?.setEditable(editable)
  }, [editable, editor])

  if (!editor) {
    return (
      <div
        className={cn("rich-text-content border border-border rounded-md bg-card", className)}
        style={{ minHeight, ...style }}
      />
    )
  }

  return (
    <div className="border border-border rounded-md overflow-hidden bg-card dark:bg-card">
      <EditorContent editor={editor} style={style} />
    </div>
  )
}

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
      "ul", "ol", "li", "blockquote", "a", "img",
      "h1", "h2", "h3", "span", "div",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "style", "src", "alt"],
  })
}
