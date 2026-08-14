"use client";

import * as React from "react";
import { GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface FieldLogicConfig {
  field: string;
  value: string;
}

interface FieldLogicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current property being configured */
  propertyLabel: string;
  /** All other available fields that can act as the controlling field */
  availableFields: { id: string; label: string }[];
  value: FieldLogicConfig | null;
  onChange: (value: FieldLogicConfig | null) => void;
}

export function FieldLogicDialog({
  open,
  onOpenChange,
  propertyLabel,
  availableFields,
  value,
  onChange,
}: FieldLogicDialogProps) {
  const [field, setField] = React.useState<string>(value?.field ?? "");
  const [val, setVal] = React.useState<string>(value?.value ?? "");

  React.useEffect(() => {
    if (open) {
      setField(value?.field ?? "");
      setVal(value?.value ?? "");
    }
  }, [open, value]);

  const handleSave = () => {
    if (!field) {
      onChange(null);
    } else {
      onChange({ field, value: val });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Field logic for &quot;{propertyLabel}&quot;
          </DialogTitle>
          <DialogDescription>
            Show this field only when another field meets a condition. Leave the
            controlling field empty to always show it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Show this field only if{" "}
            <span className="font-medium text-foreground">[field]</span> ={" "}
            <span className="font-medium text-foreground">[value]</span>
          </p>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Controlling field</Label>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a field" />
              </SelectTrigger>
              <SelectContent className="z-[200] max-h-[280px]">
                {availableFields.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No other fields available
                  </SelectItem>
                ) : (
                  availableFields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Equals value</Label>
            <Input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="Enter the value that triggers visibility"
              className="w-full"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {value && (
            <Button
              variant="outline"
              onClick={() => {
                onChange(null);
                onOpenChange(false);
              }}
            >
              Clear logic
            </Button>
          )}
          <Button onClick={handleSave}>Save logic</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
