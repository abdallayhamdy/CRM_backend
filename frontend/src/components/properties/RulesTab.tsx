"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Save, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/shared/FormField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { laravelApi } from "@/lib/laravel-api";

interface PropertyRules {
  visibility: { show_in_forms: boolean };
  validation: {
    type: "basic" | "custom";
    unique_values: boolean;
    min_chars: number | null;
    max_chars: number | null;
    auto_remove_disallowed: boolean;
    regex: string;
    invalid_message: string;
    additional_message: string;
  };
  allowed_characters: "all" | "numbers_only" | "no_symbols";
  allowed_spaces: "all" | "no_leading_trailing" | "none";
  case_sensitivity: "none" | "uppercase" | "lowercase" | "title";
}

const DEFAULT_RULES: PropertyRules = {
  visibility: { show_in_forms: true },
  validation: {
    type: "basic",
    unique_values: false,
    min_chars: null,
    max_chars: null,
    auto_remove_disallowed: false,
    regex: "",
    invalid_message: "",
    additional_message: "",
  },
  allowed_characters: "all",
  allowed_spaces: "all",
  case_sensitivity: "none",
};

interface RulesTabProps {
  propertyId: string;
  isSystemProperty: boolean;
  fieldType: string;
}

export default function RulesTab({ propertyId, isSystemProperty, fieldType }: RulesTabProps) {
  const [rules, setRules] = useState<PropertyRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const savedRules = useRef<PropertyRules | null>(null);

  const [uniqueCount, setUniqueCount] = useState<number>(0);
  const [uniqueLimit, setUniqueLimit] = useState<number>(10);

  const [testValue, setTestValue] = useState("");

  const testResult = React.useMemo<'empty' | 'valid' | 'invalid' | 'regex_error'>(() => {
    if (!rules || rules.validation.type !== 'custom') return 'empty';
    if (!testValue) return 'empty';
    if (!rules.validation.regex) return 'valid';
    try {
      return new RegExp(rules.validation.regex).test(testValue) ? 'valid' : 'invalid';
    } catch {
      return 'regex_error';
    }
  }, [testValue, rules?.validation.regex, rules?.validation.type]);

  const isTextField = new Set([
    "single_line_text",
    "multi_line_text",
    "email",
    "url",
    "phone_number",
  ]).has(fieldType);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await laravelApi.get<{ data: { rules: any; unique_count?: number; unique_limit?: number } }>(`/properties/${propertyId}/rules`);
      if (!error && data?.data) {
        const d = data.data;
        const merged: PropertyRules = {
          visibility: { ...DEFAULT_RULES.visibility, ...(d.rules?.visibility || {}) },
          validation: { ...DEFAULT_RULES.validation, ...(d.rules?.validation || {}) },
          allowed_characters: d.rules?.allowed_characters || DEFAULT_RULES.allowed_characters,
          allowed_spaces: d.rules?.allowed_spaces || DEFAULT_RULES.allowed_spaces,
          case_sensitivity: d.rules?.case_sensitivity || DEFAULT_RULES.case_sensitivity,
        };
        setRules(merged);
        savedRules.current = merged;
        setUniqueCount(d.unique_count || 0);
        setUniqueLimit(d.unique_limit || 10);
      } else {
        console.error(`[RulesTab] GET /rules failed`);
        let message = error || "Failed to load rules";
        toast.error(message);
        setRules(JSON.parse(JSON.stringify(DEFAULT_RULES)));
      }
    } catch (e: unknown) {
      console.error('[RulesTab] fetchRules network error:', e);
      toast.error("Failed to load rules");
      setRules(JSON.parse(JSON.stringify(DEFAULT_RULES)));
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleSave = async () => {
    if (!rules) return;
    try {
      setSaving(true);
      const { error } = await laravelApi.patch(`/properties/${propertyId}/rules`, rules);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Rules saved successfully");
      // Refresh counts and update the saved baseline
      await fetchRules();
    } catch (e) {
      toast.error("Failed to save rules");
    } finally {
      setSaving(false);
    }
  };

  const updateRule = (updater: (prev: PropertyRules) => void) => {
    setRules((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      updater(next);
      return next;
    });
  };

  const handleReset = () => {
    setRules(JSON.parse(JSON.stringify(DEFAULT_RULES)));
    toast.info("Rules reset to defaults — click Save to apply.");
  };

  const handleCancel = () => {
    if (savedRules.current) {
      setRules(JSON.parse(JSON.stringify(savedRules.current)));
      toast.info("Changes discarded.");
    }
  };

  const handleAllowedCharactersChange = (val: "all" | "numbers_only" | "no_symbols") => {
    updateRule((next) => {
      next.allowed_characters = val;
      if (val === "numbers_only") {
        next.allowed_spaces = "none";
      } else if (rules?.allowed_characters === "numbers_only") {
        next.allowed_spaces = "all";
      }
      if (next.allowed_characters === "all" && next.allowed_spaces === "all") {
        next.validation.auto_remove_disallowed = false;
      }
    });
  };

  const handleAllowedSpacesChange = (val: "all" | "no_leading_trailing" | "none") => {
    updateRule((next) => {
      next.allowed_spaces = val;
      if (next.allowed_characters === "all" && next.allowed_spaces === "all") {
        next.validation.auto_remove_disallowed = false;
      }
    });
  };

  if (loading || !rules) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const isAutoRemoveDisabled = rules.allowed_characters === "all" && rules.allowed_spaces === "all";

  return (
    <div className="space-y-6 max-w-3xl pb-16">

      {/* Visibility */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Visibility</h3>
        <div className="flex items-center gap-2">
          <Checkbox 
            id="show_in_forms" 
            checked={rules.visibility.show_in_forms} 
            onCheckedChange={(c) => updateRule((r) => { r.visibility.show_in_forms = !!c; })}
          />
          <Label htmlFor="show_in_forms" className="text-sm font-normal text-muted-foreground">
            Show property in forms and chatflows
          </Label>
        </div>
      </section>

      <Separator />

      {/* Validation */}
      <section className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Validation rules</h3>
          <p className="text-[13px] text-muted-foreground mt-1">
            Specify what values are allowed for this property. These rules apply when creating, editing, and importing records with the CRM.
          </p>
        </div>

        <RadioGroup 
          value={rules.validation.type} 
          onValueChange={(v) => updateRule(r => { r.validation.type = v as any; })}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="basic" id="val_basic" />
            <Label htmlFor="val_basic" className="text-sm font-normal text-foreground">
              Validate using basic rules
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="custom" id="val_custom" />
            <Label htmlFor="val_custom" className="text-sm font-normal text-foreground">
              Validate using custom rules
            </Label>
          </div>
        </RadioGroup>

        {rules.validation.type === 'basic' && (
          <div className="space-y-8 pl-6 border-l-2 border-border py-2">
            {/* Unique Values */}
            <div className="flex items-center gap-2">
              <Checkbox 
                id="unique_values" 
                checked={rules.validation.unique_values}
                disabled={isSystemProperty || (!rules.validation.unique_values && uniqueCount >= uniqueLimit)}
                onCheckedChange={(c) => updateRule(r => { r.validation.unique_values = !!c; })}
              />
              <Label htmlFor="unique_values" className={`text-sm font-normal ${isSystemProperty ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                Require unique values for this property ({uniqueCount} of {uniqueLimit})
              </Label>
            </div>

            {isTextField && (
              <>
                {/* Min/Max Chars */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id="min_chars" 
                      checked={rules.validation.min_chars !== null}
                      onCheckedChange={(c) => updateRule(r => { r.validation.min_chars = c ? 1 : null; })}
                    />
                    <Label htmlFor="min_chars" className="text-sm font-normal text-muted-foreground">
                      Require minimum number of characters
                    </Label>
                    {rules.validation.min_chars !== null && (
                      <Input 
                        type="number" 
                        min="1"
                        className="w-24 h-8 text-sm"
                        value={rules.validation.min_chars} 
                        onChange={(e) => updateRule(r => { r.validation.min_chars = parseInt(e.target.value) || 1; })}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id="max_chars" 
                      checked={rules.validation.max_chars !== null}
                      onCheckedChange={(c) => updateRule(r => { r.validation.max_chars = c ? 100 : null; })}
                    />
                    <Label htmlFor="max_chars" className="text-sm font-normal text-muted-foreground">
                      Limit to maximum number of characters
                    </Label>
                    {rules.validation.max_chars !== null && (
                      <Input 
                        type="number" 
                        min="1"
                        className="w-24 h-8 text-sm"
                        value={rules.validation.max_chars} 
                        onChange={(e) => updateRule(r => { r.validation.max_chars = parseInt(e.target.value) || 100; })}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id="auto_remove" 
                      disabled={isAutoRemoveDisabled}
                      checked={rules.validation.auto_remove_disallowed}
                      onCheckedChange={(c) => updateRule(r => { r.validation.auto_remove_disallowed = !!c; })}
                    />
                    <Label htmlFor="auto_remove" className={`text-sm font-normal ${isAutoRemoveDisabled ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                      Automatically remove disallowed characters and spaces
                    </Label>
                  </div>
                </div>

                {/* Allowed Characters */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Allowed characters</h4>
                  <RadioGroup 
                    value={rules.allowed_characters} 
                    onValueChange={handleAllowedCharactersChange}
                    className="space-y-2"
                  >
                    {[
                      { val: "all", label: "Allow all characters" },
                      { val: "numbers_only", label: "Allow numbers only" },
                      { val: "no_symbols", label: "Don't allow symbols or special characters" }
                    ].map(opt => (
                      <div key={opt.val} className="flex items-center gap-2">
                        <RadioGroupItem value={opt.val} id={`char_${opt.val}`} />
                        <Label htmlFor={`char_${opt.val}`} className="text-sm font-normal text-muted-foreground">
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Allowed Spaces */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Allowed spaces</h4>
                  <RadioGroup 
                    value={rules.allowed_spaces} 
                    onValueChange={handleAllowedSpacesChange}
                    className="space-y-2"
                  >
                    {[
                      { val: "all", label: "Allow all spaces", disabled: rules.allowed_characters === "numbers_only" },
                      { val: "no_leading_trailing", label: "Don't allow leading and trailing spaces", disabled: false },
                      { val: "none", label: "Don't allow any spaces", disabled: false }
                    ].map(opt => (
                      <div key={opt.val} className="flex items-center gap-2">
                        <RadioGroupItem value={opt.val} id={`space_${opt.val}`} disabled={opt.disabled} />
                        <Label htmlFor={`space_${opt.val}`} className={`text-sm font-normal ${opt.disabled ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Case Sensitivity */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Case-sensitivity</h4>
                  <RadioGroup 
                    value={rules.case_sensitivity} 
                    onValueChange={(v) => updateRule(r => { r.case_sensitivity = v as any; })}
                    className="space-y-2"
                  >
                    {[
                      { val: "none", label: "Not case-sensitive" },
                      { val: "uppercase", label: "Allow uppercase letters only" },
                      { val: "lowercase", label: "Allow lowercase letters only" },
                      { val: "title", label: "Require title casing" }
                    ].map(opt => (
                      <div key={opt.val} className="flex items-center gap-2">
                        <RadioGroupItem value={opt.val} id={`case_${opt.val}`} />
                        <Label htmlFor={`case_${opt.val}`} className="text-sm font-normal text-muted-foreground">
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}
          </div>
        )}

        {rules.validation.type === 'custom' && (
          <div className="space-y-6 pl-6 border-l-2 border-border py-2">
            <FormField label="Custom rule regex *" required>
              <div className="text-[12px] text-primary hover:underline cursor-pointer mb-1 inline-block">
                Learn more about writing regex validation rules
              </div>
              <Input
                placeholder="Add your regex expression here."
                value={rules.validation.regex}
                onChange={(e) => updateRule(r => { r.validation.regex = e.target.value; })}
                className="font-mono text-sm"
              />
            </FormField>

            <FormField label="Invalid value message *" required description="This message will be shown when a user adds an invalid value.">
              <Textarea
                placeholder="Briefly describe your custom rule."
                value={rules.validation.invalid_message}
                maxLength={100}
                onChange={(e) => updateRule(r => { r.validation.invalid_message = e.target.value; })}
                className="resize-none h-20"
              />
              <div className="text-[12px] text-muted-foreground/60 text-right">
                {rules.validation.invalid_message.length}/100 characters
              </div>
            </FormField>

            <FormField label="Additional invalid value message" description="This tooltip message can give more detailed instructions if needed.">
              <Textarea
                placeholder="Describe the specific requirements in detail."
                value={rules.validation.additional_message}
                maxLength={550}
                onChange={(e) => updateRule(r => { r.validation.additional_message = e.target.value; })}
                className="resize-none h-28"
              />
              <div className="text-[12px] text-muted-foreground/60 text-right">
                {rules.validation.additional_message.length}/550 characters
              </div>
            </FormField>

            <Card className="bg-accent border-border p-4 shadow-none">
              <h4 className="text-sm font-semibold text-foreground mb-3">Test custom rules</h4>
              <FormField label="Property value">
                <Input
                  value={testValue}
                  onChange={(e) => setTestValue(e.target.value)}
                  placeholder="Type a value to test..."
                  className={`bg-background ${testResult === 'invalid' ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />

                <div className="h-6 mt-1 flex items-center">
                  {testResult === 'regex_error' && (
                    <div className="flex items-center text-destructive text-[12px]">
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                      Invalid regex pattern
                    </div>
                  )}
                  {testResult === 'invalid' && (
                    <div className="flex items-center text-destructive text-[12px]">
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                      {rules.validation.invalid_message || "Invalid value"}
                    </div>
                  )}
                  {testResult === 'valid' && testValue && (
                    <div className="flex items-center text-status-success text-[12px]">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Value is valid
                    </div>
                  )}
                </div>
              </FormField>
            </Card>

            <div className="flex items-center gap-2 pt-2">
              <Checkbox 
                id="unique_values_custom" 
                checked={rules.validation.unique_values}
                disabled={isSystemProperty || (!rules.validation.unique_values && uniqueCount >= uniqueLimit)}
                onCheckedChange={(c) => updateRule(r => { r.validation.unique_values = !!c; })}
              />
              <Label htmlFor="unique_values_custom" className={`text-sm font-normal ${isSystemProperty ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                Require unique values for this property ({uniqueCount} of {uniqueLimit})
              </Label>
            </div>
          </div>
        )}
      </section>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <Button
          variant="outline"
          className="text-[13px] border-border text-muted-foreground gap-2"
          onClick={handleReset}
          disabled={saving}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to default
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-[13px] border-border text-muted-foreground"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-white text-[13px] font-semibold gap-2 px-6"
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save rules'}
          </Button>
        </div>
      </div>
    </div>
  );
}
