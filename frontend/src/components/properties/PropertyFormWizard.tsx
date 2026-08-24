"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Info,
  CheckCircle2,
  List,
  Loader2,
  ShieldCheck,
  Zap,
  Layout,
  RefreshCw,
  FileText,
  Type,
  AlertTriangle,
  ChevronLeft,
  Edit3,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/shared/FormField";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import FieldTypeSelector from "@/components/properties/FieldTypeSelector";
import { OBJECT_TYPES, OBJECT_TYPE_GROUPS } from "@/lib/crm-constants";
import { laravelApi } from "@/lib/laravel-api";
import { clearPropertiesCache } from "@/hooks/use-properties";

interface PropertyFormState {
  object_type: string;
  label: string;
  internal_name: string;
  description: string;
  group_name: string;
  field_type: string;
  default_value: string | null;
  show_in_forms: boolean;
  require_unique: boolean;
  require_min_chars: boolean;
  min_chars: number | null;
  limit_max_chars: boolean;
  max_chars: number | null;
  auto_remove_disallowed: boolean;
  allowed_characters: "all" | "numbers_only" | "no_symbols";
  allowed_spaces: "all" | "no_leading_trailing" | "no_spaces";
  case_sensitivity:
    | "not_sensitive"
    | "uppercase_only"
    | "lowercase_only"
    | "title_casing";
  options: Array<{ label: string; value: string }>;
}

const STEPS = [
  { id: "details", label: "Object Type & Label", description: "Define what you're tracking" },
  { id: "field-type", label: "Input Method", description: "How users will enter data" },
  { id: "rules", label: "Validation Rules", description: "Ensure data accuracy" },
  { id: "manage-access", label: "Permissions", description: "Who can see and edit" },
  { id: "preview", label: "Review & Create", description: "Launch your property" },
] as const;

type WizardStep = (typeof STEPS)[number]["id"];

export interface PropertyFormWizardProps {
  initialObjectType?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function PropertyFormWizard({
  initialObjectType = "contact",
  onCancel,
  onSuccess,
}: PropertyFormWizardProps) {
  const router = useRouter();

  const [step, setStep] = useState<WizardStep>("details");
  const [form, setForm] = useState<PropertyFormState>({
    object_type: initialObjectType,
    label: "",
    internal_name: "",
    description: "",
    group_name: "",
    field_type: "single_line_text",
    default_value: null,
    show_in_forms: true,
    require_unique: false,
    require_min_chars: false,
    min_chars: null,
    limit_max_chars: false,
    max_chars: null,
    auto_remove_disallowed: false,
    allowed_characters: "all",
    allowed_spaces: "all",
    case_sensitivity: "not_sensitive",
    options: [],
  });

  const [groups, setGroups] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [isEditingInternalName, setIsEditingInternalName] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [form.object_type]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await laravelApi.get<{ data: { properties: any[]; meta: any } }>(
        '/properties',
        { object_type: form.object_type, limit: 500 },
      );
      if (!error && data) {
        const raw = (data as any)?.data?.properties || [];
        const groupNames = [...new Set(raw.map((p: any) => p.group_name).filter(Boolean))] as string[];
        setGroups(groupNames.length > 0 ? groupNames : (OBJECT_TYPE_GROUPS[form.object_type] || []));
      } else {
        setGroups(OBJECT_TYPE_GROUPS[form.object_type] || []);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", { message: (error as Error)?.message });
      setGroups(OBJECT_TYPE_GROUPS[form.object_type] || []);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" && !value ? null : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      field_type: value,
      options: ["dropdown", "multiple_checkboxes", "dropdown_select", "radio_select"].includes(value)
        ? prev.options
        : [],
    }));
  };

  const handleSubmit = async () => {
    if (!form.label.trim() || !form.field_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);

    try {
      const internalName = form.internal_name || form.label
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      const body: Record<string, any> = {
        object_type: form.object_type,
        label: form.label.trim(),
        name: internalName,
        field_type: form.field_type,
        group_name: form.group_name || null,
        description: form.description || null,
        is_required: false,
        show_in_forms: form.show_in_forms,
        options: form.options.length > 0 ? form.options : undefined,
      };

      const { data: _result, error: submitError } = await laravelApi.post("/properties", body);

      if (!submitError) {
        toast.success("Property created successfully");
        clearPropertiesCache();
        if (onSuccess) onSuccess();
        else router.push(`/settings/properties?object_type=${form.object_type}`);
      } else {
        toast.error(submitError || "Failed to create property");
      }
    } catch (error) {
      console.error("Error creating property:", { message: (error as Error)?.message });
      toast.error("An error occurred while creating the property");
    } finally {
      setSaving(false);
    }
  };

  const internalNamePreview = form.internal_name || form.label
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  return (
    <div className="flex flex-col md:flex-row h-full min-h-0 bg-muted/50">
      {/* Sidebar - Progress Tracker */}
      <aside className="w-full md:w-80 border-r border-border flex flex-col bg-card shadow-sm z-10 shrink-0">
        <div className="p-6 md:p-8 flex flex-col h-full">
          {/* Header */}
          <div className="mb-10">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 -ml-2 text-muted-foreground hover:text-primary transition-all font-bold"
              onClick={() => onCancel ? onCancel() : router.back()}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Exit wizard
            </Button>
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">
              Create property
            </h2>
            <div className="h-1 w-12 bg-primary rounded-full mt-2" />
          </div>

          {/* Steps Navigation */}
          <nav className="flex-1 space-y-6">
            {STEPS.map((s, idx) => {
              const isActive = s.id === step;
              const isCompleted = STEPS.findIndex(st => st.id === step) > idx;

              return (
                <div key={s.id} className="relative group">
                  {/* Connection Line */}
                  {idx < STEPS.length - 1 && (
                    <div className={cn(
                      "absolute left-5 top-10 w-0.5 h-10 -z-0 transition-colors duration-500",
                      isCompleted ? "bg-primary" : "bg-border"
                    )} />
                  )}

                  <button
                    onClick={() => {
                      const targetIdx = idx;
                      const currentIdx = STEPS.findIndex(st => st.id === step);
                      if (targetIdx < currentIdx || (targetIdx === currentIdx + 1 && form.label)) {
                        setStep(s.id);
                      }
                    }}
                    className={cn(
                      "flex items-start gap-4 w-full text-left transition-all duration-300",
                      isActive ? "opacity-100" : "opacity-60 hover:opacity-100"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-300 z-10 shadow-sm",
                      isCompleted ? "bg-primary border-primary text-white" :
                      isActive ? "bg-card border-primary text-primary ring-4 ring-primary/10" :
                      "bg-card border-border text-muted-foreground/60"
                    )}>
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <span className="font-bold text-sm">{idx + 1}</span>}
                    </div>

                    <div className="pt-1">
                      <p className={cn(
                        "text-sm font-bold transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground/60"
                      )}>
                        {s.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 leading-tight mt-0.5 max-w-[160px]">
                        {s.description}
                      </p>
                    </div>
                  </button>
                </div>
              );
            })}
          </nav>

          {/* Quick Tip Section */}
          <div className="mt-auto pt-8 border-t border-border">
            <div className="bg-primary/5 rounded-xl p-4 flex gap-3 border border-primary/10">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-foreground">Quick Tip</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                  Unique internal names help with API integrations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-muted/50/50 min-w-0">
        <header className="h-16 flex items-center justify-between px-8 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-foreground truncate max-w-[200px] md:max-w-md">
              {form.label || "New Property"}
            </h1>
            <p className="text-xs text-muted-foreground/60 capitalize">
              {form.object_type} property
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Separator orientation="vertical" className="h-6 mx-1 hidden md:block" />
            <Button
              variant="outline"
              onClick={() => onCancel ? onCancel() : router.back()}
              className="h-9 px-5 border-border font-bold hover:bg-card"
            >
              Cancel
            </Button>

            {step !== "preview" ? (
              <Button
                onClick={() => {
                  const idx = STEPS.findIndex(s => s.id === step);
                  if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
                }}
                disabled={step === "details" && (!form.label || !form.group_name)}
                className="h-9 px-6 bg-primary hover:bg-primary/90 text-white font-bold"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={saving || !form.label.trim() || !form.field_type}
                className="h-9 px-6 bg-primary hover:bg-primary/90 text-white font-bold"
              >
                {saving ? "Creating..." : "Create"}
              </Button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 crm-scrollbar">
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {step === "details" && (
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Basic information</CardTitle>
                  <CardDescription>Give your property a name and description.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField label="Object type" required>
                    <Select
                      value={form.object_type}
                      onValueChange={(val) => setForm(prev => ({ ...prev, object_type: val }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[320px]">
                        {OBJECT_TYPES.map((obj) => (
                          <SelectItem key={obj.value} value={obj.value}>
                            {obj.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Group" required>
                    <Select
                      value={form.group_name}
                      onValueChange={(val) => setForm(prev => ({ ...prev, group_name: val }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a group" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[320px]">
                        {groups.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Label" required>
                    <Input
                      name="label"
                      value={form.label}
                      onChange={handleInputChange}
                      placeholder="e.g. Lead Score"
                      className="w-full"
                    />
                    {form.label && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/60 bg-muted/50 p-2 rounded">
                          <Info className="w-3 h-3" />
                          <span>Internal name: <code className="bg-muted px-1 rounded">{internalNamePreview}</code></span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-auto"
                            onClick={() => setIsEditingInternalName(!isEditingInternalName)}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                        </div>
                        {isEditingInternalName && (
                          <div className="space-y-1.5 pl-2 border-l-2 border-primary/30">
                            <Label className="text-[11px] font-bold">Edit internal name</Label>
                            <Input
                              value={form.internal_name || internalNamePreview}
                              onChange={(e) => setForm(prev => ({ ...prev, internal_name: e.target.value }))}
                              className="h-8 text-xs"
                            />
                            <p className="text-[10px] text-muted-foreground/60">
                              This is used for API and developer access. It cannot be changed after creation.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </FormField>

                  <FormField label="Description">
                    <Textarea
                      name="description"
                      value={form.description}
                      onChange={handleInputChange}
                      placeholder="Explain what this property is for..."
                      className="w-full min-h-[100px]"
                    />
                  </FormField>
                </CardContent>
              </Card>
            )}

            {step === "field-type" && (
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Field type</CardTitle>
                  <CardDescription>Determine how this data will be input and displayed.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldTypeSelector
                    value={form.field_type}
                    onChange={handleSelectChange}
                  />
                </CardContent>
              </Card>
            )}

            {step === "rules" && (
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Validation rules</CardTitle>
                  <CardDescription>Set rules for data entry.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-background">
                    <Checkbox
                      id="unique"
                      checked={form.require_unique}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, require_unique: !!checked }))}
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor="unique" className="text-sm font-bold cursor-pointer">Require unique values</Label>
                      <p className="text-xs text-muted-foreground/60">Prevent duplicate entries for this property.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-background">
                    <Checkbox
                      id="forms"
                      checked={form.show_in_forms}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, show_in_forms: !!checked }))}
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor="forms" className="text-sm font-bold cursor-pointer">Show in forms</Label>
                      <p className="text-xs text-muted-foreground/60">Allow this property to be used in forms.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === "manage-access" && (
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Manage Access</CardTitle>
                  <CardDescription>Configure who can see and edit this property.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Access control will be available after the property is created.
                  </div>
                </CardContent>
              </Card>
            )}

            {step === "preview" && (
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Review & Create</CardTitle>
                  <CardDescription>Review your property before creating it.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Object type:</span>
                      <span className="ml-2 font-medium">{form.object_type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Group:</span>
                      <span className="ml-2 font-medium">{form.group_name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Label:</span>
                      <span className="ml-2 font-medium">{form.label}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Internal name:</span>
                      <span className="ml-2 font-mono text-xs">{internalNamePreview}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Field type:</span>
                      <Badge variant="outline" className="ml-2 text-[11px]">{form.field_type}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Show in forms:</span>
                      <span className="ml-2 font-medium">{form.show_in_forms ? "Yes" : "No"}</span>
                    </div>
                  </div>
                  {form.description && (
                    <div>
                      <span className="text-muted-foreground text-sm">Description:</span>
                      <p className="text-sm mt-1">{form.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-border">
              <Button
                variant="outline"
                disabled={step === "details"}
                onClick={() => {
                  const idx = STEPS.findIndex(s => s.id === step);
                  if (idx > 0) setStep(STEPS[idx - 1].id);
                }}
                className="h-10 px-6 font-bold"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center gap-3">
                {step !== "preview" ? (
                  <Button
                    onClick={() => {
                      const idx = STEPS.findIndex(s => s.id === step);
                      if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
                    }}
                    disabled={step === "details" && (!form.label || !form.group_name)}
                    className="h-10 px-8 bg-primary hover:bg-primary/90 text-white font-bold shadow-md"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={saving || !form.label.trim() || !form.field_type}
                    className="h-10 px-8 bg-primary hover:bg-primary/90 text-white font-bold shadow-md"
                  >
                    {saving ? "Creating..." : "Create property"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
