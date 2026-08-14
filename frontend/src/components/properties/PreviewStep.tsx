import React from "react";
import DOMPurify from "dompurify";
import {
  CheckCircle2,
  Info,
  MapPin,
  Activity,
  Loader2,
  List,
  ShieldCheck,
  TextCursor,
  Zap,
  Type,
  Space,
} from "lucide-react";
import { PropertyFormState } from "./CreatePropertyFormState";

interface PreviewStepProps {
  form: PropertyFormState;
  internalName: string;
  getFieldTypeIcon: (fieldType: string) => React.ReactNode;
}

export function PreviewStep({ form, internalName, getFieldTypeIcon }: PreviewStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-[20px] font-bold text-foreground">
        Preview your property
      </h2>
      <div className="mt-6 p-6 bg-primary-foreground border border-border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-3xl">
            {getFieldTypeIcon(form.field_type)}
          </div>
          <div className="space-y-2">
            <p className="text-[18px] font-bold text-foreground">
              {form.label || "New Property"}
            </p>
            {internalName && (
              <p className="text-[14px] text-muted-foreground/60 font-mono">
                {internalName}
              </p>
            )}
          </div>
        </div>

        {form.description && (
          <div className="mt-4">
            <p className="text-[14px] text-muted-foreground/60">
              {form.description}
            </p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="font-normal cursor-pointer text-foreground">
            Field settings
          </h3>
          <div className="mt-4 space-y-3 text-[13px]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[var(--color-hs-green)] flex-shrink-0" />
              <span>Required: {form.isRequired ? "Yes" : "No"}</span>
            </div>
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
              <span>Object type: {form.object_type}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
              <span>Group: {form.group_name || "None"}</span>
            </div>
            {form.description && (
              <div className="flex items-start gap-3">
                <Activity className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                <span>Description: Provided</span>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Loader2 className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
              <span>
                Default value:{" "}
                {form.default_value ? (
                  form.field_type === "rich_text" ? (
                    <span
                      className="text-xs border border-border dark:border-border rounded bg-card dark:bg-card px-2 py-1 max-w-[400px] block overflow-hidden text-ellipsis"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(form.default_value) }}
                    />
                  ) : (
                    form.default_value
                  )
                ) : (
                  "None"
                )}
              </span>
            </div>
            {["dropdown", "dropdown_select", "radio_select", "multiple_checkboxes"].includes(
              form.field_type,
            ) &&
              form.options.length > 0 && (
                <div className="flex items-start gap-3">
                  <List className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                  <span>
                    Options: {form.options.length} configured
                  </span>
                </div>
              )}
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[var(--color-hs-green)] flex-shrink-0" />
              <span>
                Unique values:{" "}
                {form.require_unique ? "Enabled" : "Disabled"}
              </span>
            </div>
            {form.require_min_chars && (
              <div className="flex items-start gap-3">
                <TextCursor className="w-4 h-4 text-[var(--color-hs-green)] flex-shrink-0" />
                <span>Min characters: {form.min_chars}</span>
              </div>
            )}
            {form.limit_max_chars && (
              <div className="flex items-start gap-3">
                <TextCursor className="w-4 h-4 text-[var(--color-hs-green)] flex-shrink-0" />
                <span>Max characters: {form.max_chars}</span>
              </div>
            )}
            {form.auto_remove_disallowed && (
              <div className="flex items-start gap-3">
                <Zap className="w-4 h-4 text-[var(--color-hs-green)] flex-shrink-0" />
                <span>Auto-remove disallowed: Enabled</span>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Type className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
              <span>
                Character type:{" "}
                {form.allowed_characters === "all"
                  ? "All"
                  : form.allowed_characters === "numbers_only"
                    ? "Numbers only"
                    : "No symbols"}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Space className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
              <span>
                Spaces:{" "}
                {form.allowed_spaces === "all"
                  ? "All allowed"
                  : form.allowed_spaces === "no_leading_trailing"
                    ? "No leading/trailing"
                    : "No spaces"}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Type className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
              <span>
                Case sensitivity:{" "}
                {form.case_sensitivity === "not_sensitive"
                  ? "Not case-sensitive"
                  : form.case_sensitivity === "uppercase_only"
                    ? "Uppercase only"
                    : form.case_sensitivity === "lowercase_only"
                      ? "Lowercase only"
                      : "Title casing"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
