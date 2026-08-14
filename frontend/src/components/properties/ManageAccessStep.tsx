import { ShieldCheck } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function ManageAccessStep() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[20px] font-bold text-foreground">
          Manage access
        </h2>
        <p className="text-[14px] text-muted-foreground mt-1">
          Choose who can see and edit this property across the platform.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label className="font-normal cursor-pointer">
            Property visibility
          </Label>
          <RadioGroup defaultValue="everyone" className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-card dark:bg-card border border-border rounded-xl hover:border-primary transition-colors cursor-pointer group">
              <RadioGroupItem value="everyone" id="everyone" className="mt-1" />
              <label htmlFor="everyone" className="flex-1 cursor-pointer">
                <span className="block text-sm font-bold text-foreground group-hover:text-primary transition-colors">Everyone</span>
                <span className="block text-xs text-muted-foreground/60 mt-0.5">All users can view and use this property in filters and forms.</span>
              </label>
            </div>
            <div className="flex items-start gap-3 p-4 bg-card dark:bg-card border border-border rounded-xl hover:border-primary transition-colors cursor-pointer group">
              <RadioGroupItem value="admins" id="admins" className="mt-1" />
              <label htmlFor="admins" className="flex-1 cursor-pointer">
                <span className="block text-sm font-bold text-foreground group-hover:text-primary transition-colors">Admins only</span>
                <span className="block text-xs text-muted-foreground/60 mt-0.5">Only users with administrative privileges can view or edit this data.</span>
              </label>
            </div>
            <div className="flex items-start gap-3 p-4 bg-card dark:bg-card border border-border rounded-xl hover:border-primary transition-colors cursor-pointer group">
              <RadioGroupItem value="specific" id="specific" className="mt-1" />
              <label htmlFor="specific" className="flex-1 cursor-pointer">
                <span className="block text-sm font-bold text-foreground group-hover:text-primary transition-colors">Specific teams</span>
                <span className="block text-xs text-muted-foreground/60 mt-0.5">Choose specific teams or individual users who need access.</span>
              </label>
            </div>
          </RadioGroup>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <p className="text-xs text-primary font-medium">
              These settings will apply to all existing and future records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
