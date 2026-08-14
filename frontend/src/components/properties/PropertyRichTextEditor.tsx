import React from "react";
import dynamic from "next/dynamic";
import { sanitizeRichText } from "@/components/ui/tiptap-editor";
import { TiptapEditorSkeleton } from "@/components/ui/TiptapEditorSkeleton";

const TiptapEditor = dynamic(
  () => import("@/components/ui/tiptap-editor").then(m => ({ default: m.TiptapEditor })),
  { ssr: false, loading: () => <TiptapEditorSkeleton /> }
);

export interface PropertyRichTextEditorProps {
  value: string | null;
  onChange: (val: string) => void;
}

export function PropertyRichTextEditor({ value, onChange }: PropertyRichTextEditorProps) {
  return (
    <TiptapEditor
      content={value || ""}
      placeholder="Enter the default value..."
      editable
      onChange={(html) => onChange(sanitizeRichText(html))}
    />
  );
}
