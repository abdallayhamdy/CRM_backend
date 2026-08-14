"use client";

import React, { useState, useEffect } from 'react';
import { Info, Mail, Languages, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { laravelApi } from '@/lib/laravel-api';
import { useAuth } from '@/hooks/use-auth';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

const InfoTip = ({ content }: { content: string }) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help inline-block ml-1" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs bg-foreground text-primary-foreground border-none">{content}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface WorkspaceSettingsResponse {
  data: {
    default_language: string;
    default_date_format: string;
  };
}

export default function UserDefaultsPage() {
  const { workspaceId } = useAuth();
  const [language,    setLanguage]    = useState('en');
  const [dateFormat,  setDateFormat]  = useState('us');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!workspaceId) return;
      setLoading(true);
      const { data, error } = await laravelApi.get<WorkspaceSettingsResponse>('/workspace/settings');
      if (!error && data?.data) {
        setLanguage(data.data.default_language || 'en');
        setDateFormat(data.data.default_date_format || 'us');
      }
      setLoading(false);
    }
    load();
  }, [workspaceId]);

  const handleSave = async () => {
    if (!workspaceId) return;
    setIsSaving(true);
    const { error } = await laravelApi.patch('/workspace/settings', {
      default_language: language,
      default_date_format: dateFormat,
    });

    if (error) {
      toast.error('Failed to save preferences');
    } else {
      toast.success('User defaults saved successfully');
    }
    setIsSaving(false);
  };

  return (
    <div className="w-full space-y-8 pb-32">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">User Defaults</h2>
          <p className="text-[14px] text-muted-foreground">
            Set defaults for users in your account. Individual users can override these in their own settings.
          </p>
        </div>
        <Badge variant="outline" className="bg-muted text-foreground border-border font-medium py-1 px-3">
          Account-wide
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* ── New User Defaults ── */}
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/50 border-b border-border py-4">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-primary" />
              <CardTitle className="text-[15px] font-bold text-foreground">Language & Region</CardTitle>
            </div>
            <CardDescription className="text-[13px] text-muted-foreground">
              These settings will be applied to all new users by default.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Language */}
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-foreground flex items-center">
                Language
                <InfoTip content="The default interface language for new users." />
              </Label>
              <Select value={language} onValueChange={setLanguage} disabled={loading}>
                <SelectTrigger className="border-border bg-background h-10 focus:ring-primary">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (US)</SelectItem>
                  <SelectItem value="en-gb">English (UK)</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date & Number Format */}
            <div className="space-y-2">
              <Label className="text-[13px] font-bold text-foreground flex items-center">
                Date & Number Format
                <InfoTip content="Controls how dates (MM/DD/YYYY vs DD/MM/YYYY) and numbers (1,000.00 vs 1.000,00) appear." />
              </Label>
              <Select value={dateFormat} onValueChange={setDateFormat} disabled={loading}>
                <SelectTrigger className="border-border bg-background h-10 focus:ring-primary">
                  <SelectValue placeholder="Select Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States (04/21/2026)</SelectItem>
                  <SelectItem value="uk">United Kingdom (21/04/2026)</SelectItem>
                  <SelectItem value="eu">European Union (21.04.2026)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground italic mt-1.5 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Example: 1,234.56 USD | April 21, 2026
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Sticky Save Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="w-full px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            You have unsaved changes
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Discard
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 font-bold h-11 transition-all"
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Saving…
                </div>
              ) : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
