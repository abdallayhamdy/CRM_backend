"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  ChevronDown,
  CheckCircle,
  Info,
  CheckCircle2,
  List,
  Loader2,
  ShieldCheck,
  Zap,
  Activity,
  MapPin,
  TextCursor,
  Type,
  Space,
  Lock,
  Sparkles,
  X,
  Users,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import FieldTypeSelector from "@/components/properties/FieldTypeSelector";
import { OBJECT_TYPES } from "@/lib/crm-constants";
import { laravelApi } from "@/lib/laravel-api";

import { VisuallyHidden } from "@/components/ui/dialog";

interface PropertyFormState {
  object_type: string;
  label: string;
  description: string;
  group_name: string;
  field_type: string;
  default_value: string | null;
  is_required: boolean;
  show_in_forms: boolean;
  require_unique: boolean;
  require_min_chars: boolean;
  min_chars: number | null;
  limit_max_chars: boolean;
  max_chars: number | null;
  auto_remove_disallowed: boolean;
  allowed_characters: "all" | "numbers_only" | "no_symbols";
  allowed_spaces: "all" | "no_leading_trailing" | "no_spaces";
  case_sensitivity: "not_sensitive" | "uppercase_only" | "lowercase_only" | "title_casing";
  options: Array<{ label: string; value: string }>;
  access_level: "all" | "select" | "private";
}

export const STEPS = [
  { id: "details" as const, label: "Details" },
  { id: "field-type" as const, label: "Field type" },
  { id: "options" as const, label: "Options" },
  { id: "rules" as const, label: "Rules" },
  { id: "manage-access" as const, label: "Manage access" },
  { id: "preview" as const, label: "Preview" },
];

export type StepId = typeof STEPS[number]['id'];

interface CreatePropertyFormProps {
  initialData: Partial<PropertyFormState>;
  onSuccess: () => void;
  onCancel: () => void;
  isFullPage?: boolean;
  onStateChange?: (state: { step: string; isLastStep: boolean; canGoBack: boolean; isSaving: boolean }) => void;
}

export interface CreatePropertyFormRef {
  next: () => void;
  back: () => void;
  submit: () => void;
  canGoBack: boolean;
  isLastStep: boolean;
  isSaving: boolean;
}

const CreatePropertyForm = forwardRef<CreatePropertyFormRef, CreatePropertyFormProps>(({
  initialData,
  onSuccess,
  onCancel,
  isFullPage = false,
  onStateChange,
}, ref) => {
  const [step, setStep] = useState<"details" | "field-type" | "options" | "rules" | "manage-access" | "preview">("details");
  const [form, setForm] = useState<PropertyFormState>({
    object_type: initialData.object_type || "contact",
    label: initialData.label || "",
    description: initialData.description || "",
    group_name: initialData.group_name || "",
    field_type: initialData.field_type || "single_line_text",
    default_value: null,
    is_required: false,
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
    options: [{ label: "", value: "" }],
    access_level: "all",
  });

  const [groups, setGroups] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await laravelApi.get<{ properties: any[]; meta: any }>('/properties', { object_type: form.object_type, limit: 500 });
        if (!error && data) {
          const raw = (data as any)?.data?.properties || data.properties || [];
          const groupNames: string[] = [...new Set(raw.map((p: any) => p.group_name).filter(Boolean))] as string[];
          setGroups(groupNames);
          if (groupNames.length > 0 && !form.group_name) {
            setForm(prev => ({ ...prev, group_name: groupNames[0] }));
          }
        }
      } catch (e) {
        console.error("Failed to fetch groups", e);
      }
    };
    fetchGroups();
  }, [form.object_type]);

  const handleSubmit = async () => {
    if (!form.label.trim()) {
      toast.error("Label is required");
      return;
    }
    setSaving(true);
    try {
      const internalName = form.label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

      // Build structured JSONB objects for rules and access
      const rules = {
        visibility: {
          show_in_forms: form.show_in_forms,
        },
        validation: {
          type: "basic",
          is_required: form.is_required,
          require_unique: form.require_unique,
          require_min_chars: form.require_min_chars,
          min_chars: form.require_min_chars ? form.min_chars : null,
          limit_max_chars: form.limit_max_chars,
          max_chars: form.limit_max_chars ? form.max_chars : null,
          auto_remove_disallowed: form.auto_remove_disallowed,
          allowed_characters: form.allowed_characters,
          allowed_spaces: form.allowed_spaces,
          case_sensitivity: form.case_sensitivity,
        },
      };

      const ACCESS_TYPE: Record<string, string> = {
        all: "everyone_edit",
        select: "assign_teams_users",
        private: "private_admins",
      };

      const access = {
        type: ACCESS_TYPE[form.access_level] ?? "everyone_edit",
        level: form.access_level,
        assignments: [] as Array<{ entity_type: string; entity_id: string; access_level: string }>,
        allowed_users: [] as string[],
        allowed_teams: [] as string[],
      };

      const payload = {
        name: internalName,
        label: form.label,
        object_type: form.object_type,
        field_type: form.field_type,
        description: form.description,
        group_name: form.group_name,
        is_required: form.is_required,
        show_in_forms: form.show_in_forms,
        options: form.options,
        settings: {
          default_value: form.default_value,
          require_unique: form.require_unique,
          require_min_chars: form.require_min_chars,
          min_chars: form.min_chars,
          limit_max_chars: form.limit_max_chars,
          max_chars: form.max_chars,
          auto_remove_disallowed: form.auto_remove_disallowed,
          allowed_characters: form.allowed_characters,
          allowed_spaces: form.allowed_spaces,
          case_sensitivity: form.case_sensitivity,
          rules,
          access,
        },
      };

      const { data: result, error } = await laravelApi.post("/properties", payload);
      if (!error) {
        toast.success("Property created");
        onSuccess();
      } else {
        toast.error(error || "Failed to create property");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const isChoiceField = ["dropdown_select", "radio_select", "multiple_checkboxes", "multi_checkbox", "dropdown", "radio", "checkbox", "multi_select"].includes(form.field_type);

  useImperativeHandle(ref, () => ({
    next: () => {
      const idx = STEPS.findIndex(s => s.id === step);
      let nextIdx = idx + 1;
      
      // Skip options if not a choice field
      if (STEPS[nextIdx]?.id === "options" && !isChoiceField) {
        nextIdx++;
      }
      
      if (nextIdx < STEPS.length) setStep(STEPS[nextIdx].id);
    },
    back: () => {
      const idx = STEPS.findIndex(s => s.id === step);
      let prevIdx = idx - 1;
      
      // Skip options if not a choice field
      if (STEPS[prevIdx]?.id === "options" && !isChoiceField) {
        prevIdx--;
      }
      
      if (prevIdx >= 0) setStep(STEPS[prevIdx].id);
      else onCancel();
    },
    submit: handleSubmit,
    canGoBack: STEPS.findIndex(s => s.id === step) > 0,
    isLastStep: step === "preview",
    isSaving: saving,
  }));

  const canGoBack = STEPS.findIndex(s => s.id === step) > 0;
  const isLastStep = step === "preview";

  useEffect(() => {
    if (onStateChange) {
      onStateChange({ step, isLastStep, canGoBack, isSaving: saving });
    }
  }, [step, isLastStep, canGoBack, saving, onStateChange]);

  const addOption = () => {
    setForm({ ...form, options: [...form.options, { label: "", value: "" }] });
  };

  const updateOption = (index: number, field: "label" | "value", val: string) => {
    const newOptions = [...form.options];
    newOptions[index][field] = val;
    // Auto-fill value if label is changed and value is empty or matches previous label
    if (field === "label" && (!newOptions[index].value || newOptions[index].value === newOptions[index].label.toLowerCase().replace(/\s+/g, "_"))) {
      newOptions[index].value = val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    }
    setForm({ ...form, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (form.options.length <= 1) return;
    setForm({ ...form, options: form.options.filter((_, i) => i !== index) });
  };

  return (
    <div className="w-full">
      {/* Form Content */}
      <Card className="shadow-xl border-border overflow-hidden bg-card">
        <CardContent className="p-8">
          {step === "details" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Basic Information</h2>
                <p className="text-sm text-muted-foreground/60">Set the label and description for your new property.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold text-foreground">Object type</Label>
                  <Select value={form.object_type} onValueChange={v => setForm({...form, object_type: v})}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[320px]">
                      {OBJECT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold text-foreground">Label</Label>
                  <Input 
                    placeholder="e.g. Lead Score" 
                    value={form.label} 
                    onChange={e => setForm({...form, label: e.target.value})}
                    className="focus-visible:ring-primary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold text-foreground">Description</Label>
                  <Textarea 
                    placeholder="What is this property for?" 
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                    className="min-h-[100px] focus-visible:ring-primary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold text-foreground">Group</Label>
                  <Select value={form.group_name} onValueChange={v => setForm({...form, group_name: v})}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[320px]">
                      {groups.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === "field-type" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Field Type</h2>
                <p className="text-sm text-muted-foreground/60">Select how this property will be displayed and stored.</p>
              </div>
              <FieldTypeSelector 
                value={form.field_type}
                onChange={type => setForm({...form, field_type: type})}
              />
            </div>
          )}

          {step === "options" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Manage Options</h2>
                <p className="text-sm text-muted-foreground/60">Add and edit options for this {form.field_type.replace("_", " ")} field.</p>
              </div>
              <div className="space-y-3">
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex-1">
                      <Input 
                        placeholder="Label" 
                        value={opt.label} 
                        onChange={e => updateOption(i, "label", e.target.value)}
                        className="border-border"
                      />
                    </div>
                    <div className="flex-1">
                      <Input 
                        placeholder="Internal value" 
                        value={opt.value} 
                        onChange={e => updateOption(i, "value", e.target.value)}
                        className="border-border bg-secondary"
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 shrink-0"
                      onClick={() => removeOption(i)}
                      disabled={form.options.length <= 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full border-dashed border-border text-primary hover:bg-primary/5 hover:border-primary"
                  onClick={addOption}
                >
                   Add another option
                </Button>
              </div>
            </div>
          )}

          {step === "rules" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Validation Rules</h2>
                <p className="text-sm text-muted-foreground/60">Define rules to ensure data quality and consistency.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">General</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer" onClick={() => setForm({...form, require_unique: !form.require_unique})} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setForm({...form, require_unique: !form.require_unique}) } }}>
                      <Checkbox 
                        id="unique" 
                        checked={form.require_unique} 
                        onCheckedChange={c => setForm({...form, require_unique: !!c})} 
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="unique" className="text-sm font-semibold leading-none cursor-pointer">Require unique values</Label>
                        <p className="text-xs text-muted-foreground/60">Prevents duplicate entries for this property.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer" onClick={() => setForm({...form, show_in_forms: !form.show_in_forms})} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setForm({...form, show_in_forms: !form.show_in_forms}) } }}>
                      <Checkbox 
                        id="show_in_forms" 
                        checked={form.show_in_forms} 
                        onCheckedChange={c => setForm({...form, show_in_forms: !!c})} 
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="show_in_forms" className="text-sm font-semibold leading-none cursor-pointer">Show in forms</Label>
                        <p className="text-xs text-muted-foreground/60">Make this property available in public and internal forms.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer" onClick={() => setForm({...form, is_required: !form.is_required})} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setForm({...form, is_required: !form.is_required}) } }}>
                      <Checkbox 
                        id="is_required" 
                        checked={form.is_required} 
                        onCheckedChange={c => setForm({...form, is_required: !!c})} 
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="is_required" className="text-sm font-semibold leading-none cursor-pointer">Required field</Label>
                        <p className="text-xs text-muted-foreground/60">Users must fill in this property before saving a record.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Content Constraints</h3>
                  <div className="space-y-4">
                    {form.field_type === "single_line_text" || form.field_type === "multi_line_text" ? (
                      <>
                        <div className="space-y-3 p-4 bg-secondary rounded-xl border border-border">
                          <div className="flex items-center justify-between">
                            <Label className="font-semibold text-xs">Character limits</Label>
                            <Badge variant="outline" className="bg-card">Optional</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">Min</span>
                              <Input 
                                type="number" 
                                placeholder="None" 
                                value={form.min_chars || ""} 
                                onChange={e => setForm({...form, min_chars: e.target.value ? parseInt(e.target.value) : null, require_min_chars: !!e.target.value})}
                                className="h-8 text-xs border-border"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">Max</span>
                              <Input 
                                type="number" 
                                placeholder="None" 
                                value={form.max_chars || ""} 
                                onChange={e => setForm({...form, max_chars: e.target.value ? parseInt(e.target.value) : null, limit_max_chars: !!e.target.value})}
                                className="h-8 text-xs border-border"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 p-4 bg-secondary rounded-xl border border-border">
                          <Label className="font-semibold text-xs">Allowed characters</Label>
                          <Select 
                            value={form.allowed_characters} 
                            onValueChange={v => setForm({...form, allowed_characters: v as PropertyFormState['allowed_characters']})}
                          >
                            <SelectTrigger className="h-8 text-xs bg-card border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Any characters</SelectItem>
                              <SelectItem value="numbers_only">Numbers only</SelectItem>
                              <SelectItem value="no_symbols">Letters and numbers only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full min-h-[100px] border-2 border-dashed border-border rounded-xl bg-secondary/50">
                        <p className="text-xs text-muted-foreground text-center px-4 italic">No specific constraints available for this field type.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "manage-access" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Manage Access</h2>
                <p className="text-sm text-muted-foreground/60">Control who can see and edit this property.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: "all", title: "Everyone can view and edit", desc: "All users with property access can interact with this property.", icon: Users },
                  { id: "select", title: "Specific users and teams", desc: "Choose specific individuals or groups who can access this data.", icon: ShieldCheck },
                  { id: "private", title: "Private to me", desc: "Only you will be able to see and edit this property's values.", icon: Lock },
                ].map((item) => (
                  <div 
                    key={item.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer group",
                      form.access_level === item.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50 hover:bg-secondary"
                    )}
                    onClick={() => setForm({...form, access_level: item.id as PropertyFormState['access_level']})}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      form.access_level === item.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground/60 group-hover:bg-card"
                    )}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <Label className="font-bold text-sm text-foreground cursor-pointer">{item.title}</Label>
                        <RadioGroup value={form.access_level}>
                          <VisuallyHidden>
                            <RadioGroupItem value={item.id} id={item.id} />
                          </VisuallyHidden>
                        </RadioGroup>
                        {form.access_level === item.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground/60 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-8">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Final Review</h2>
                <p className="text-sm text-muted-foreground/60">Check your property settings before creating it.</p>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-status-info rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <div className="relative p-6 bg-card rounded-xl border border-border shadow-sm space-y-6">
                   <div className="flex items-center gap-5 pb-6 border-b border-border">
                    <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center shadow-inner">
                      <Sparkles className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-foreground">{form.label || "Untitled Property"}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-secondary text-muted-foreground/60 hover:bg-secondary text-[10px] uppercase tracking-wider font-bold">
                          {form.object_type}
                        </Badge>
                        <span className="text-muted-foreground/60">•</span>
                        <span className="text-xs font-medium text-primary">{form.field_type.replace("_", " ")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Group</span>
                      <p className="text-sm font-medium">{form.group_name || "Uncategorized"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Visibility</span>
                      <p className="text-sm font-medium">{form.show_in_forms ? "Visible in forms" : "Internal only"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Access</span>
                      <p className="text-sm font-medium capitalize">{form.access_level.replace("_", " ")}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Uniqueness</span>
                      <p className="text-sm font-medium">{form.require_unique ? "Required" : "Not required"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Required</span>
                      <p className="text-sm font-medium">{form.is_required ? "Yes — mandatory field" : "No — optional"}</p>
                    </div>
                  </div>

                  {form.description && (
                    <div className="pt-6 border-t border-border">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Description</span>
                      <p className="text-sm text-foreground leading-relaxed italic opacity-80">"{form.description}"</p>
                    </div>
                  )}

                  {isChoiceField && form.options.length > 0 && (
                    <div className="pt-6 border-t border-border">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-3">Options ({form.options.length})</span>
                      <div className="flex flex-wrap gap-2">
                        {form.options.slice(0, 5).map((opt, i) => (
                          <Badge key={i} variant="outline" className="border-border bg-card px-2 py-0.5 text-xs font-medium">
                            {opt.label || "(Empty)" }
                          </Badge>
                        ))}
                        {form.options.length > 5 && (
                          <span className="text-xs text-muted-foreground font-medium pt-1 ml-1">+{form.options.length - 5} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!isFullPage && (
            <div className="mt-10 pt-6 border-t flex justify-between">
              <Button variant="ghost" onClick={() => {
                const idx = STEPS.findIndex(s => s.id === step);
                let prevIdx = idx - 1;
                if (STEPS[prevIdx]?.id === "options" && !isChoiceField) prevIdx--;
                
                if (idx === 0) onCancel();
                else setStep(STEPS[prevIdx].id);
              }}>
                Back
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  const idx = STEPS.findIndex(s => s.id === step);
                  let nextIdx = idx + 1;
                  if (STEPS[nextIdx]?.id === "options" && !isChoiceField) nextIdx++;
                  
                  if (idx === STEPS.length - 1) handleSubmit();
                  else setStep(STEPS[nextIdx].id);
                }}
              >
                {step === "preview" ? (saving ? "Saving..." : "Create Property") : "Next"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

export default CreatePropertyForm;
