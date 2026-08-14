"use client";

import React from "react";
import { PropertyFormState } from "./CreatePropertyFormState";

interface FileFieldEditorProps {
  form: PropertyFormState;
  setForm: React.Dispatch<React.SetStateAction<PropertyFormState>>;
}

export function FileFieldEditor({ form, setForm }: FileFieldEditorProps) {
  return (
    <div className="space-y-4">
      {/* Warning box */}
      <div className="border border-status-warning/50 bg-status-warning/10 rounded-md p-4 space-y-1">
        <p className="text-sm font-semibold">Property permissions don&apos;t affect access by URL</p>
        <p className="text-sm text-muted-foreground">To keep sensitive files secure, avoid sharing file URLs with unauthorized users.</p>
        <a href="#" className="text-sm text-status-success dark:text-status-success underline flex items-center gap-1">
          Learn more about property access ↗
        </a>
      </div>

      {/* External file access */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">External file access</p>
        <p className="text-xs text-muted-foreground">Can these files be accessed outside of SalesHub?</p>

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="radio"
            name="file_access"
            value="private"
            checked={form.file_access === 'private'}
            onChange={() => setForm(p => ({ ...p, file_access: 'private' }))}
            className="mt-1"
          />
          <div>
            <p className="text-sm font-medium">Private</p>
            <p className="text-xs text-muted-foreground">These files can only be accessed by users in your SalesHub account.</p>
          </div>
        </label>

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="radio"
            name="file_access"
            value="public"
            checked={form.file_access === 'public'}
            onChange={() => setForm(p => ({ ...p, file_access: 'public' }))}
            className="mt-1"
          />
          <div>
            <p className="text-sm font-medium">Public</p>
            <p className="text-xs text-muted-foreground">These files can be accessed by anyone with the file&apos;s URL. This is recommended if you need to use these files on public content, like website pages.</p>
          </div>
        </label>
      </div>
    </div>
  );
}
