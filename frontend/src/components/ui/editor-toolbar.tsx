"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ColorPickerPopover } from "@/components/ui/color-picker-popover"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Quote,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
} from "lucide-react"
import { cn } from "@/lib/utils"

const TOOLBAR_BTN =
  "h-8 w-8 p-0 flex items-center justify-center text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted aria-pressed:bg-muted aria-pressed:text-foreground dark:hover:bg-muted/50"

const FONT_FAMILIES = [
  { label: "Sans Serif", value: "sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Monospace", value: "monospace" },
]

const FONT_SIZES = ["8", "9", "10", "11", "12", "14", "18", "24"]

interface ToolbarButtonProps {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}

function ToolbarButton({ active, onClick, title, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(TOOLBAR_BTN, active && "bg-muted text-foreground")}
      data-active={active ? "true" : undefined}
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  )
}

interface EditorToolbarProps {
  editor: Editor
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showMore, setShowMore] = React.useState(false)
  const [, setTick] = React.useState(0)

  React.useEffect(() => {
    const handler = () => setTick((t) => t + 1)
    editor.on("selectionUpdate", handler)
    editor.on("transaction", handler)
    return () => {
      editor.off("selectionUpdate", handler)
      editor.off("transaction", handler)
    }
  }, [editor])

  const setLink = React.useCallback(() => {
    const previous = editor.getAttributes("link").href as string | undefined
    const input = window.prompt("Enter URL", previous || "https://")
    if (input === null) return
    if (input === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    const url = /^https?:\/\//i.test(input) ? input : `https://${input}`
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  const getCurrentTextColor = React.useCallback((): string => {
    const attrs = editor.getAttributes("textStyle")
    if (attrs.color) return attrs.color
    return "#000000"
  }, [editor])

  const getCurrentHighlightColor = React.useCallback((): string => {
    const attrs = editor.getAttributes("highlight")
    if (attrs.color) return attrs.color
    return "#ffff00"
  }, [editor])

  const currentFontFamily = (() => {
    const attrs = editor.getAttributes("textStyle")
    return attrs.fontFamily || "sans-serif"
  })()

  const currentFontSize = (() => {
    const attrs = editor.getAttributes("textStyle")
    if (attrs.fontSize) return attrs.fontSize.replace("pt", "")
    return "11"
  })()

  return (
    <div className="border-b border-border">
      {/* Row 1: Basic formatting */}
      <div className="flex flex-wrap items-center gap-0.5 p-2">
        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <ToolbarButton
          title="Insert Link"
          active={editor.isActive("link")}
          onClick={setLink}
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2 gap-1 text-[13px] text-muted-foreground hover:text-foreground"
          onClick={() => setShowMore(!showMore)}
        >
          More
          {showMore ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Row 2: Extended formatting (toggled) */}
      {showMore && (
        <div className="flex flex-wrap items-center gap-0.5 px-2 pb-2 pt-0">
          {/* Font Family */}
          <Select
            value={currentFontFamily}
            onValueChange={(val) =>
              editor.chain().focus().setFontFamily(val).run()
            }
          >
            <SelectTrigger className="h-8 w-[120px] text-xs" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-xs">
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Font Size */}
          <Select
            value={currentFontSize}
            onValueChange={(val) =>
              editor.chain().focus().setFontSize(`${val}pt`).run()
            }
          >
            <SelectTrigger className="h-8 w-[60px] text-xs" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Text Color */}
          <ColorPickerPopover
            currentColor={getCurrentTextColor()}
            onSelect={(hex) =>
              editor.chain().focus().setColor(hex).run()
            }
            onReset={() =>
              editor.chain().focus().unsetColor().run()
            }
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                TOOLBAR_BTN,
                editor.isActive("textStyle", { color: getCurrentTextColor() }) &&
                  "bg-muted text-foreground"
              )}
              title="Text Color"
            >
              <span className="flex flex-col items-center leading-none">
                <span className="text-sm font-bold">A</span>
                <span
                  className="w-3.5 h-1 rounded-sm mt-0.5"
                  style={{ backgroundColor: getCurrentTextColor() }}
                />
              </span>
            </Button>
          </ColorPickerPopover>

          {/* Highlight Color */}
          <ColorPickerPopover
            currentColor={getCurrentHighlightColor()}
            onSelect={(hex) =>
              editor.chain().focus().toggleHighlight({ color: hex }).run()
            }
            onReset={() =>
              editor.chain().focus().unsetHighlight().run()
            }
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                TOOLBAR_BTN,
                editor.isActive("highlight") && "bg-muted text-foreground"
              )}
              title="Highlight Color"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </ColorPickerPopover>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* Blockquote */}
          <ToolbarButton
            title="Blockquote"
            active={editor.isActive("blockquote")}
            onClick={() =>
              editor.chain().focus().toggleBlockquote().run()
            }
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>

          {/* Bullet List */}
          <ToolbarButton
            title="Bullet List"
            active={editor.isActive("bulletList")}
            onClick={() =>
              editor.chain().focus().toggleBulletList().run()
            }
          >
            <List className="h-4 w-4" />
          </ToolbarButton>

          {/* Text Align */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  TOOLBAR_BTN,
                  (editor.isActive({ textAlign: "left" }) ||
                    editor.isActive({ textAlign: "center" }) ||
                    editor.isActive({ textAlign: "right" }) ||
                    editor.isActive({ textAlign: "justify" })) &&
                    "bg-muted text-foreground"
                )}
                title="Text Align"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().setTextAlign("left").run()
                }
              >
                <AlignLeft className="h-4 w-4 mr-2" />
                Left
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().setTextAlign("center").run()
                }
              >
                <AlignCenter className="h-4 w-4 mr-2" />
                Center
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().setTextAlign("right").run()
                }
              >
                <AlignRight className="h-4 w-4 mr-2" />
                Right
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().setTextAlign("justify").run()
                }
              >
                <AlignJustify className="h-4 w-4 mr-2" />
                Justify
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}
