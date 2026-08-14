import React, { useState } from "react";
import { Edit3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { OBJECT_TYPES } from "@/lib/crm-constants";
import { PropertyFormState } from "./CreatePropertyFormState";

interface DetailsStepProps {
  form: PropertyFormState;
  setForm: React.Dispatch<React.SetStateAction<PropertyFormState>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleObjectTypeChange: (value: string) => void;
  groups: string[];
  internalName: string;
  onInternalNameChange?: (value: string) => void;
}

export function DetailsStep({
  form,
  setForm,
  handleInputChange,
  handleObjectTypeChange,
  groups,
  internalName,
  onInternalNameChange,
}: DetailsStepProps) {
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [draftName, setDraftName] = useState(internalName);
  const [nameError, setNameError] = useState<string | null>(null);

  const openEditName = () => {
    setDraftName(internalName);
    setNameError(null);
    setEditNameOpen(true);
  };

  const handleSaveName = () => {
    const finalName = draftName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!finalName) {
      setNameError("Internal name cannot be empty.");
      return;
    }
    if (/\s/.test(draftName) || /[A-Z]/.test(draftName) || /[^a-z0-9_]/.test(draftName)) {
      setNameError("Use lowercase letters, numbers, and underscores only (snake_case). No spaces.");
      return;
    }
    onInternalNameChange?.(finalName);
    setEditNameOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="font-normal cursor-pointer">
          Property label <span className="text-destructive">*</span>
        </Label>
        <Input
          name="label"
          value={form.label}
          onChange={handleInputChange}
          placeholder="Enter property label"
          className="w-full"
        />
        {form.label && (
          <div className="mt-2 flex items-center gap-3 text-muted-foreground text-[12px]">
            <span>Internal name ⓘ</span>
            <span className="font-mono">{internalName}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={openEditName}
              aria-label="Edit internal name"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Label className="font-normal cursor-pointer">
          Object type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={form.object_type}
          onValueChange={handleObjectTypeChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[200] max-h-[320px]">
            {OBJECT_TYPES.map((obj) => (
              <SelectItem key={obj.value} value={obj.value}>
                {obj.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label className="font-normal cursor-pointer">
          Group <span className="text-destructive">*</span>
        </Label>
        <Select
          value={form.group_name}
          onValueChange={(val) =>
            setForm((prev) => ({ ...prev, group_name: val }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a group" />
          </SelectTrigger>
          <SelectContent className="z-[200] max-h-[320px]">
            {groups.map((group) => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Label className="font-normal cursor-pointer">
          Description
        </Label>
        <Textarea
          name="description"
          value={form.description}
          onChange={handleInputChange}
          placeholder="Enter description for this property"
          className="w-full"
          rows={4}
        />
      </div>

      <Separator className="bg-border my-6" />

      {/* Quick settings */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-semibold text-foreground">Quick settings</h3>
        <div className="flex items-center justify-between rounded-[8px] border border-border bg-card px-4 py-3">
          <div>
            <p className="text-[13px] font-medium text-foreground">Required</p>
            <p className="text-[12px] text-muted-foreground">Make this property required when creating or editing records</p>
          </div>
          <Switch
            checked={form.isRequired}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, isRequired: checked }))
            }
          />
        </div>
        <div className="flex items-center justify-between rounded-[8px] border border-border bg-card px-4 py-3">
          <div>
            <p className="text-[13px] font-medium text-foreground">Show in forms and chatflows</p>
            <p className="text-[12px] text-muted-foreground">Allow this property to be used in forms and chatflows</p>
          </div>
          <Switch
            checked={form.showInForms}
            onCheckedChange={(checked) =>
              setForm((prev) => ({ ...prev, showInForms: checked }))
            }
          />
        </div>
      </div>

      <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Edit internal name</DialogTitle>
            <DialogDescription>
              The internal name is used as the API property key. It must be
              unique, lowercase, and use snake_case (letters, numbers,
              underscores only — no spaces).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Internal name</Label>
            <Input
              value={draftName}
              onChange={(e) => {
                setDraftName(e.target.value);
                setNameError(null);
              }}
              placeholder="e.g. property_label"
              className="w-full font-mono"
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditNameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveName}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
