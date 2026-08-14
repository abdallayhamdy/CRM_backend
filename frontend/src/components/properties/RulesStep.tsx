import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PropertyFormState } from "./CreatePropertyFormState";

interface RulesStepProps {
  form: PropertyFormState;
  handleCheckboxChange: (name: string, checked: boolean | "indeterminate") => void;
  handleRadioChange: (name: string, value: string) => void;
  handleNumberChange: (name: string, value: string) => void;
}

export function RulesStep({
  form,
  handleCheckboxChange,
  handleRadioChange,
  handleNumberChange,
}: RulesStepProps) {
  return (
    <div className="space-y-6">
      {/* Visibility options */}
      <div className="space-y-4">
        <Label className="font-normal cursor-pointer">
          Visibility options
        </Label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              name="showInForms"
              checked={form.showInForms}
              onCheckedChange={(checked) =>
                handleCheckboxChange("showInForms", checked)
              }
            />
            <span className="text-sm text-foreground">Show this property on forms and chatflows</span>
          </label>
          <p className="text-[12px] text-muted-foreground/60 mt-1">
            When turned off, this property won't appear in any forms
            or chatflows.
          </p>
        </div>
      </div>

      {/* Validation options */}
      <div className="space-y-6">
        <h3 className="font-normal cursor-pointer text-foreground">
          Validation options
        </h3>
        <p className="text-[12px] text-muted-foreground/60">
          Set rules for what values are accepted in this property.
        </p>
        <Separator className="my-4" />
      </div>

      {/* Basic rules */}
      <div className="space-y-4">
        <Label className="font-normal cursor-pointer">
          Basic rules
        </Label>
        <div className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                name="require_unique"
                checked={form.require_unique}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("require_unique", checked)
                }
              />
              <span className="text-sm text-foreground">No two records can have the same value for this property</span>
            </label>
            <p className="text-sm text-muted-foreground mt-1">
              No two records can have the same value for this
              property.
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                name="require_min_chars"
                checked={form.require_min_chars}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("require_min_chars", checked)
                }
              />
              <span className="text-sm text-foreground">Require a value for this property</span>
            </label>
            {form.require_min_chars && (
              <div className="mt-3">
                <Input
                  name="min_chars"
                  type="number"
                  value={form.min_chars?.toString() || ""}
                  onChange={(e) =>
                    handleNumberChange("min_chars", e.target.value)
                  }
                  placeholder="Minimum characters"
                  className="w-[150px]"
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                name="limit_max_chars"
                checked={form.limit_max_chars}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("limit_max_chars", checked)
                }
              />
              <span className="text-sm text-foreground">Limit to maximum number of characters</span>
            </label>
            {form.limit_max_chars && (
              <div className="mt-3">
                <Input
                  name="max_chars"
                  type="number"
                  value={form.max_chars?.toString() || ""}
                  onChange={(e) =>
                    handleNumberChange("max_chars", e.target.value)
                  }
                  placeholder="Maximum characters"
                  className="w-[150px]"
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                name="auto_remove_disallowed"
                checked={form.auto_remove_disallowed}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(
                    "auto_remove_disallowed",
                    checked,
                  )
                }
                disabled={
                  !(form.require_min_chars || form.limit_max_chars)
                }
              />
              <span className="text-sm text-foreground">Automatically remove disallowed characters and spaces</span>
            </label>
            {!form.require_min_chars && !form.limit_max_chars && (
              <p className="text-sm text-muted-foreground mt-1 pl-4">
                Turn on minimum or maximum character limits to
                enable this option.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Allowed characters */}
      <div className="space-y-6">
        <Label className="font-normal cursor-pointer">
          Allowed characters
        </Label>
        <RadioGroup
          name="allowed_characters"
          value={form.allowed_characters}
          onValueChange={(val) =>
            handleRadioChange("allowed_characters", val)
          }
          className="space-y-2"
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="all" id="ac_all" />
            <span className="text-sm text-foreground">Allow all characters</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="numbers_only" id="ac_numbers_only" />
            <span className="text-sm text-foreground">Allow numbers only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="no_symbols" id="ac_no_symbols" />
            <span className="text-sm text-foreground">Don't allow symbols or special characters</span>
          </label>
        </RadioGroup>
        <div className="mt-2 flex items-start gap-2 text-[12px] text-muted-foreground/60">
          <Info className="w-4 h-4" />
          <span>
            Symbols include:{" "}
            <code className="text-muted-foreground/60">
              {"!@#$%^&*()_+-=[]{ }|;':\",./<>?"}
            </code>
          </span>
        </div>
      </div>

      {/* Allowed spaces */}
      <div className="space-y-6">
        <Label className="font-normal cursor-pointer">
          Allowed spaces
        </Label>
        <RadioGroup
          name="allowed_spaces"
          value={form.allowed_spaces}
          onValueChange={(val) =>
            handleRadioChange("allowed_spaces", val)
          }
          className="space-y-2"
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="all" id="as_all" />
            <span className="text-sm text-foreground">Allow all spaces</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="no_leading_trailing" id="as_no_leading_trailing" />
            <span className="text-sm text-foreground">Don't allow leading and trailing spaces</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="no_spaces" id="as_no_spaces" />
            <span className="text-sm text-foreground">Don't allow any spaces</span>
          </label>
        </RadioGroup>
      </div>

      {/* Case sensitivity */}
      <div className="space-y-6">
        <Label className="font-normal cursor-pointer">
          Case sensitivity
        </Label>
        <RadioGroup
          name="case_sensitivity"
          value={form.case_sensitivity}
          onValueChange={(val) =>
            handleRadioChange("case_sensitivity", val)
          }
          className="space-y-2"
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="not_sensitive" id="cs_not_sensitive" />
            <span className="text-sm text-foreground">Not case-sensitive</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="uppercase_only" id="cs_uppercase_only" />
            <span className="text-sm text-foreground">Allow uppercase letters only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="lowercase_only" id="cs_lowercase_only" />
            <span className="text-sm text-foreground">Allow lowercase letters only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <RadioGroupItem value="title_casing" id="cs_title_casing" />
            <span className="text-sm text-foreground">Require title casing</span>
          </label>
        </RadioGroup>
      </div>
    </div>
  );
}
