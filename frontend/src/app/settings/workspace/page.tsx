"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { laravelApi } from '@/lib/laravel-api';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  Copy,
  Users,
  Camera,
  Upload,
  CheckCircle2,
} from 'lucide-react';

interface WorkspaceSettings {
  id: string;
  name: string;
  status: string;
  max_users: number;
  timezone: string | null;
  fiscal_year_start: string | null;
  industry: string | null;
  company_name: string | null;
  company_domain: string | null;
  company_address: string | null;
  company_city: string | null;
  company_state: string | null;
  company_zip: string | null;
  company_country: string | null;
  logo_path: string | null;
  created_at: string | null;
}

export default function WorkspaceSettingsPage() {
  const { activeWorkspace } = useAuth();
  const { canManageSettings } = usePermissions();

  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [workspaceName, setWorkspaceName] = useState(activeWorkspace?.name || '');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [memberCount, setMemberCount] = useState<number>(0);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await laravelApi.get<{ data: WorkspaceSettings }>('/workspace/settings');
    if (!error && data?.data) {
      const ws = data.data;
      setSettings(ws);
      setWorkspaceName(ws.name);
      if (ws.logo_path) {
        setLogoPreview(`/storage/${ws.logo_path}`);
      }
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    const { data, error } = await laravelApi.get('/workspace/members');
    if (!error && data) {
      const paginated = data as { meta?: { total?: number } };
      setMemberCount(paginated?.meta?.total ?? 0);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchMembers();
  }, [fetchSettings, fetchMembers]);

  const onWorkspaceNameChange = (val: string) => {
    setWorkspaceName(val);
    setHasChanges(val !== settings?.name);
  };

  const handleUpdateWorkspaceName = async () => {
    if (!workspaceName.trim()) return;
    setIsSaving(true);
    try {
      const { data, error } = await laravelApi.patch<{ data: WorkspaceSettings }>('/workspace/settings', {
        name: workspaceName.trim(),
      });
      if (error) {
        toast.error(error);
        return;
      }
      if (data?.data) {
        setSettings(data.data);
        setWorkspaceName(data.data.name);
      }
      toast.success('Workspace name updated successfully.');
      setHasChanges(false);
    } catch {
      toast.error('Failed to update workspace name.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be smaller than 2MB.');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const { data, error } = await laravelApi.upload<{ data: { logo_path: string; logo_url: string } }>(
        '/workspace/settings/logo',
        formData,
      );
      if (error) {
        toast.error(error);
        return;
      }
      if (data?.data) {
        setLogoPreview(data.data.logo_url);
        setSettings((prev) => (prev ? { ...prev, logo_path: data.data.logo_path } : prev));
      }
      toast.success('Logo uploaded successfully.');
    } catch {
      toast.error('Failed to upload logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard.');
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatStatus = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <>
      <div className="w-full pb-32">
      <PageHeader 
        title="Workspace Configuration"
        subtitle="Manage your organization's global environment, team structure, and security protocols."
        actions={
          <Badge variant="outline" className="bg-muted text-foreground border-border font-medium py-1 px-3">
            Enterprise Plan
          </Badge>
        }
      />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b border-border rounded-none mb-6">
          {[
            { value: 'general', label: 'General', isDanger: false },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={`
                px-6 py-3 text-[13px] font-semibold transition-all relative rounded-t-[4px] border-t-2 border-x border-transparent
                data-[state=active]:bg-muted/50 data-[state=active]:border-x-border data-[state=active]:shadow-none data-[state=active]:-mb-[1px]
                ${tab.isDanger 
                  ? 'text-destructive/70 hover:text-destructive data-[state=active]:text-destructive data-[state=active]:border-t-destructive' 
                  : 'text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:border-t-primary'
                }
              `}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── GENERAL TAB ── */}
        <TabsContent value="general" className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-[15px] font-bold text-foreground">
                <Building2 className="w-4 h-4 text-primary" />
                Workspace Information
              </CardTitle>
              <CardDescription className="text-[13px] text-muted-foreground">Update your workspace name and branding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Section */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="w-20 h-20 border border-border">
                    <AvatarImage src={logoPreview || undefined} />
                    <AvatarFallback className="bg-muted/50">
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  {canManageSettings && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-primary-foreground rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      {isUploadingLogo ? (
                        <CheckCircle2 className="w-6 h-6 animate-pulse" />
                      ) : (
                        <Camera className="w-6 h-6" />
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoChange}
                        disabled={isUploadingLogo}
                      />
                    </label>
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="text-[14px] font-bold text-foreground">Workspace Logo</h4>
                  <p className="text-[12px] text-muted-foreground">
                    Recommended size: 256x256px. Max 2MB.
                  </p>
                  {canManageSettings && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1.5 border-border text-foreground font-semibold hover:bg-accent"
                      onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                      disabled={isUploadingLogo}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isUploadingLogo ? 'Uploading...' : 'Upload New'}
                    </Button>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name" className="text-[13px] font-bold text-foreground">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    value={workspaceName}
                    onChange={(e) => onWorkspaceNameChange(e.target.value)}
                    disabled={!canManageSettings}
                    placeholder="Your workspace name"
                    className="border-border focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workspace-id" className="text-[13px] font-bold text-foreground">Workspace ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="workspace-id"
                      value={activeWorkspace?.id || ''}
                      readOnly
                      className="font-mono text-xs text-muted-foreground bg-muted/50 border-border"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 border-border hover:bg-accent"
                      onClick={() => copyToClipboard(activeWorkspace?.id || '')}
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>

              </CardContent>
            </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-[15px] font-bold text-foreground">Workspace Details</CardTitle>
              <CardDescription className="text-[13px] text-muted-foreground">Overview of your workspace usage and status.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                <div className="flex justify-between items-center px-6 py-4">
                  <span className="text-[13px] text-muted-foreground font-bold">Created Date</span>
                  <span className="text-[13px] text-foreground">{formatDate(settings?.created_at ?? null)}</span>
                </div>
                <div className="flex justify-between items-center px-6 py-4">
                  <span className="text-[13px] text-muted-foreground font-bold">Plan</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent font-semibold">
                    {formatStatus(settings?.status || 'trial')}
                  </Badge>
                </div>
                <div className="flex justify-between items-center px-6 py-4">
                  <span className="text-[13px] text-muted-foreground font-bold">Member Count</span>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[13px] font-bold text-foreground">{memberCount}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>

    {hasChanges && (
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 flex justify-end gap-3 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom duration-300">
        <Button 
          variant="outline" 
          onClick={() => {
            setWorkspaceName(settings?.name || activeWorkspace?.name || '');
            setHasChanges(false);
          }}
          className="border-border text-foreground h-10 px-6 font-semibold"
        >
          Discard
        </Button>
        <Button 
          onClick={handleUpdateWorkspaceName}
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-8 shadow-sm"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    )}
    </>
  );
}
