"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle, ArrowLeft, Save, BarChart2, Database, CheckCircle2,
  Info, Lock, Users, Loader2, ChevronRight, FileText, Settings2, Shield,
  Eye, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import dynamic from 'next/dynamic';
import { laravelApi } from '@/lib/laravel-api';

const RulesTab = dynamic(
  () => import('@/components/properties/RulesTab'),
  { ssr: false }
);
const ManageAccessTab = dynamic(
  () => import('@/components/properties/ManageAccessTab'),
  { ssr: false }
);

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Property {
  id: string; object_type: string; name: string; label: string;
  field_type: string; group_name: string | null; description: string | null;
  is_required: boolean; is_archived: boolean; show_in_forms: boolean;
  created_by: string; options: any[]; created_at: string; updated_at: string;
}
interface PropertyGroup { id: string; name: string; object_type: string; }

const OBJECT_LABELS: Record<string, string> = {
  call:'Call', company:'Company', contact:'Contact',
  deal:'Deal', order:'Order',
  product:'Product', subscription:'Subscription', ticket:'Ticket',
};
const FIELD_LABELS: Record<string, string> = {
  single_line_text:'Single-line text', multi_line_text:'Multi-line text',
  rich_text:'Rich text', number:'Number', phone_number:'Phone number', phone:'Phone number',
  email:'Email', url:'URL', dropdown_select:'Dropdown select', dropdown:'Dropdown select',
  radio_select:'Radio select', radio:'Radio select', multiple_checkboxes:'Multiple checkboxes',
  multi_select:'Multiple checkboxes', boolean_checkbox:'Boolean (yes/no)', boolean:'Boolean (yes/no)',
  single_checkbox:'Single checkbox', date_picker:'Date picker', date:'Date picker',
  date_time_picker:'Date and time picker', date_time:'Date and time picker',
  file:'File', calculation:'Calculation', rollup:'Rollup', property_sync:'Property sync',
  currency:'Currency', percent:'Percent', score:'Score', hubspot_user:'HubSpot user',
  owner:'Owner', color_picker:'Color picker',
};

type TabId = 'details' | 'rules' | 'manage_access' | 'preview';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'details',       label: 'Details',       icon: FileText    },
  { id: 'rules',         label: 'Rules',         icon: Settings2   },
  { id: 'manage_access', label: 'Manage Access', icon: ShieldCheck },
  { id: 'preview',       label: 'Preview',       icon: Eye         },
];

const ROLE_PERMISSIONS: { role: string; desc: string }[] = [
  { role: 'Super Admin',   desc: 'Full access to all properties'        },
  { role: 'Admin',         desc: 'Can view and edit all properties'     },
  { role: 'Manager',       desc: 'Can view and edit assigned records'   },
  { role: 'Sales Rep',     desc: 'Can view and edit own records'        },
  { role: 'Viewer',        desc: 'Read-only access'                     },
];

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function PropertyEditPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabId>('details');
  const [property, setProperty] = useState<Property | null>(null);
  const [groups, setGroups] = useState<PropertyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [showInForms, setShowInForms] = useState(true);

  const isSystem = property?.created_by === 'System';

  const fetchProperty = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error } = await laravelApi.get<{ data: Property }>(`/properties/${propertyId}`);
      if (error || !data) { setError('Property not found.'); return; }
      const p: Property = (data as any)?.data ?? data;
      setProperty(p); setLabel(p.label); setDescription(p.description || '');
      setGroupName(p.group_name || ''); setIsRequired(p.is_required);
      setShowInForms(p.show_in_forms ?? true);
    } catch { setError('Failed to load property.'); }
    finally { setLoading(false); }
  }, [propertyId]);

  const fetchGroups = useCallback(async (objectType: string) => {
    try {
      const { data, error } = await laravelApi.get<{ properties: any[]; meta: any }>('/properties', { object_type: objectType, limit: 500 });
      if (!error && data) {
        const raw = (data as any)?.data?.properties || data.properties || [];
        const groupNames: string[] = [...new Set(raw.map((p: any) => p.group_name).filter(Boolean))] as string[];
        setGroups(groupNames.map((name: string) => ({ id: name, name, object_type: objectType })));
      }
    } catch { /* groups fetch failed, use empty array */ }
  }, []);

  useEffect(() => { fetchProperty(); }, [fetchProperty]);
  useEffect(() => { if (property?.object_type) fetchGroups(property.object_type); }, [property?.object_type, fetchGroups]);

  const handleSave = async () => {
    if (!property) return;
    setSaving(true); setSaved(false);
    try {
      const body: Record<string, any> = {
        description: description || null, is_required: isRequired, show_in_forms: showInForms,
      };
      if (!isSystem) { body.label = label.trim(); body.group_name = groupName || null; }
      const { data, error } = await laravelApi.patch<{ data: Property }>(`/properties/${propertyId}`, body);
      if (error) { setError(error); return; }
      const updated = (data as any)?.data ?? data;
      if (updated) setProperty(updated);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch { setError('Failed to save property.'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-6 h-6 animate-spin text-[var(--color-hs-blue)]" />
    </div>
  );

  if (error && !property) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <p className="text-muted-foreground">{error}</p>
      <Button variant="outline" onClick={() => router.back()}>Go back</Button>
    </div>
  );

  if (!property) return null;

  const fieldTypeLabel = FIELD_LABELS[property.field_type] || property.field_type;
  const objectTypeLabel = OBJECT_LABELS[property.object_type] || property.object_type;

  return (
    <div className="max-w-[960px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-6">
        <Link href="/settings/properties" className="hover:text-[var(--color-hs-blue)] transition-colors">Properties</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium truncate max-w-[300px]">{property.label}</span>
      </div>

      {/* System Banner */}
      {isSystem && (
        <div className="flex items-start gap-3 rounded-[6px] border border-status-warning/30 bg-status-warning/10 dark:bg-status-warning/10 dark:border-status-warning/30 px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-status-warning dark:text-status-warning mt-0.5 shrink-0" />
          <p className="text-[13px] text-status-warning dark:text-status-warning leading-relaxed">
            This property is provided by <strong>System</strong>, and only some rules can be modified.
          </p>
        </div>
      )}

      {/* Layout */}
      <div className="flex gap-6 items-start">
        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex border-b border-border mb-5">
            {TABS.map(({ id, label: tabLabel, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === id
                    ? 'border-[var(--color-hs-blue)] text-[var(--color-hs-blue)]'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tabLabel}
              </button>
            ))}
          </div>

          {/* ── DETAILS TAB ───────────────────────────────────────────────── */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-[6px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
                  <AlertTriangle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}
              <div className="rounded-[8px] border border-border bg-[var(--color-hs-card-bg)] shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[18px] font-bold text-foreground">Property details</h2>
                      <p className="text-[13px] text-muted-foreground mt-0.5">
                        Configure how this property behaves across your CRM.
                      </p>
                    </div>
                    {isSystem && (
                      <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground bg-[var(--color-hs-light-bg)] px-3 py-1.5 rounded-full border border-border">
                        <Lock className="w-3 h-3" /> System property
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-6 space-y-5">
                  {/* Label */}
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-foreground">Property label <span className="text-destructive">*</span></Label>
                    {isSystem ? (
                      <div className="flex items-center gap-2 h-10 px-3 rounded-[6px] border border-border bg-[var(--color-hs-light-bg)] text-[14px] text-muted-foreground select-none">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />{property.label}
                      </div>
                    ) : (
                      <Input value={label} onChange={(e) => setLabel(e.target.value)}
                        className="border-border focus-visible:ring-[var(--color-hs-blue)] text-[14px]" placeholder="Property label" />
                    )}
                  </div>

                  {/* Internal name */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-[13px] font-semibold text-foreground">Internal name</Label>
                      <div className="relative group">
                        <Info className="w-3.5 h-3.5 text-muted-foreground/60 cursor-help" />
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-56 bg-[var(--color-hs-text-primary)] text-white text-[11px] px-2 py-1.5 rounded-[4px] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          Auto-generated and cannot be changed.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 h-10 px-3 rounded-[6px] border border-border bg-[var(--color-hs-light-bg)] text-[14px] text-muted-foreground font-mono select-none">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />{property.name}
                    </div>
                  </div>

                  {/* Object type */}
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-foreground">Object type <span className="text-destructive">*</span></Label>
                    <div className="flex items-center gap-2 h-10 px-3 rounded-[6px] border border-border bg-[var(--color-hs-light-bg)] text-[14px] text-muted-foreground select-none">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />{objectTypeLabel}
                    </div>
                  </div>

                  {/* Field type */}
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-foreground">Field type</Label>
                    <div className="flex items-center gap-2 h-10 px-3 rounded-[6px] border border-border bg-[var(--color-hs-light-bg)] text-[14px] text-muted-foreground select-none">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />{fieldTypeLabel}
                    </div>
                  </div>

                  {/* Group */}
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-foreground">Group <span className="text-destructive">*</span></Label>
                    {isSystem ? (
                      <div className="flex items-center gap-2 h-10 px-3 rounded-[6px] border border-border bg-[var(--color-hs-light-bg)] text-[14px] text-muted-foreground select-none">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />{property.group_name || '—'}
                      </div>
                    ) : (
                      <Select value={groupName} onValueChange={setGroupName}>
                        <SelectTrigger className="border-border focus:ring-[var(--color-hs-blue)] text-[14px]">
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((g) => (<SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-foreground">Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a description for this property…"
                      className="border-border focus-visible:ring-[var(--color-hs-blue)] text-[14px] resize-none min-h-[90px]" />
                  </div>

                  <Separator className="bg-[var(--color-hs-border)]" />

                  {/* Quick toggles */}
                  <div className="space-y-3">
                    <h3 className="text-[13px] font-semibold text-foreground">Quick settings</h3>
                    <div className="flex items-center justify-between rounded-[8px] border border-border bg-[var(--color-hs-light-bg)] px-4 py-3">
                      <div>
                        <p className="text-[13px] font-medium text-foreground">Required</p>
                        <p className="text-[12px] text-muted-foreground">Users must fill this when creating a record.</p>
                      </div>
                      <Switch checked={isRequired} onCheckedChange={setIsRequired} />
                    </div>
                    <div className="flex items-center justify-between rounded-[8px] border border-border bg-[var(--color-hs-light-bg)] px-4 py-3">
                      <div>
                        <p className="text-[13px] font-medium text-foreground">Show in forms</p>
                        <p className="text-[12px] text-muted-foreground">Display this property in CRM forms.</p>
                      </div>
                      <Switch checked={showInForms} onCheckedChange={setShowInForms} />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-[var(--color-hs-light-bg)] flex items-center justify-between">
                  <Button variant="outline" className="text-[13px] border-border" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-1.5" />Back
                  </Button>
                  <div className="flex items-center gap-2">
                    {saved && (
                      <div className="flex items-center gap-1.5 text-[13px] text-status-success">
                        <CheckCircle2 className="w-4 h-4" />Saved
                      </div>
                    )}
                    <Button className="bg-[var(--color-hs-blue)] hover:bg-[var(--color-hs-blue-hover)] text-white text-[13px] font-semibold gap-1.5"
                      onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── RULES TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'rules' && (
            <RulesTab
              propertyId={propertyId}
              isSystemProperty={isSystem}
              fieldType={property.field_type}
            />
          )}

          {/* ── MANAGE ACCESS TAB ─────────────────────────────────────────── */}
          {activeTab === 'manage_access' && (
            <ManageAccessTab propertyId={propertyId} />
          )}

          {/* ── PREVIEW TAB ───────────────────────────────────────────────── */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="rounded-[8px] border border-border bg-[var(--color-hs-card-bg)] shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                  <h2 className="text-[18px] font-bold text-foreground">Field Preview</h2>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    This is how <strong>{property.label}</strong> will appear in a CRM form.
                  </p>
                </div>

                <div className="px-8 py-10">
                  {/* Simulated form card */}
                  <div className="max-w-[480px] mx-auto rounded-[10px] border border-border bg-[var(--color-hs-light-bg)] px-6 py-6 space-y-2 shadow-sm">
                    <Label className="text-[13px] font-semibold text-foreground">
                      {property.label}
                      {isRequired && <span className="text-destructive ml-1">*</span>}
                    </Label>

                    {property.description && (
                      <p className="text-[12px] text-muted-foreground -mt-1">{property.description}</p>
                    )}

                    {/* Render field based on type */}
                    {(property.field_type === 'single_line_text' || property.field_type === 'email' || property.field_type === 'url' || property.field_type === 'phone') && (
                      <input
                        type={property.field_type === 'email' ? 'email' : property.field_type === 'url' ? 'url' : 'text'}
                        placeholder={`Enter ${property.label.toLowerCase()}…`}
                        className="w-full h-9 px-3 rounded-[6px] border border-border bg-background text-[14px] text-foreground outline-none focus:ring-2 focus:ring-[var(--color-hs-blue)] transition-shadow"
                      />
                    )}

                    {property.field_type === 'multi_line_text' && (
                      <textarea
                        placeholder={`Enter ${property.label.toLowerCase()}…`}
                        rows={3}
                        className="w-full px-3 py-2 rounded-[6px] border border-border bg-background text-[14px] text-foreground outline-none focus:ring-2 focus:ring-[var(--color-hs-blue)] resize-none transition-shadow"
                      />
                    )}

                    {property.field_type === 'number' && (
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full h-9 px-3 rounded-[6px] border border-border bg-background text-[14px] text-foreground outline-none focus:ring-2 focus:ring-[var(--color-hs-blue)] transition-shadow"
                      />
                    )}

                    {(property.field_type === 'date' || property.field_type === 'date_time' || property.field_type === 'date_picker' || property.field_type === 'date_time_picker') && (
                      <input
                        type={property.field_type === 'date_time' || property.field_type === 'date_time_picker' ? 'datetime-local' : 'date'}
                        className="w-full h-9 px-3 rounded-[6px] border border-border bg-background text-[14px] text-foreground outline-none focus:ring-2 focus:ring-[var(--color-hs-blue)] transition-shadow"
                      />
                    )}

                    {(property.field_type === 'boolean' || property.field_type === 'boolean_checkbox') && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 rounded-full bg-[var(--color-hs-border)] relative cursor-pointer">
                          <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-background shadow transition-all" />
                        </div>
                        <span className="text-[13px] text-muted-foreground">Disabled</span>
                      </div>
                    )}

                    {(property.field_type === 'dropdown' || property.field_type === 'multiple_checkboxes' || property.field_type === 'dropdown_select' || property.field_type === 'radio_select' || property.field_type === 'multi_select') && (
                      <div className="w-full h-9 px-3 rounded-[6px] border border-border bg-background text-[14px] text-muted-foreground flex items-center justify-between cursor-pointer">
                        <span>Select an option…</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    )}

                    {property.field_type === 'file' && (
                      <div className="w-full h-16 rounded-[6px] border-2 border-dashed border-border flex items-center justify-center gap-2 text-[13px] text-muted-foreground cursor-pointer hover:border-[var(--color-hs-blue)] transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Click to upload or drag & drop
                      </div>
                    )}

                    {!['single_line_text','multi_line_text','email','url','phone','phone_number','number','currency','percent','score','date','date_time','date_picker','date_time_picker','boolean','boolean_checkbox','dropdown','dropdown_select','radio_select','multiple_checkboxes','multi_select','file'].includes(property.field_type) && (
                      <div className="w-full h-9 px-3 rounded-[6px] border border-border bg-background text-[14px] text-muted-foreground flex items-center">
                        <span className="italic">Preview not available for this field type.</span>
                      </div>
                    )}
                  </div>

                  {/* Field type badge */}
                  <div className="flex items-center justify-center mt-6">
                    <Badge variant="outline" className="text-[11px] h-5 px-2 font-medium">
                      {fieldTypeLabel}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full sm:w-[260px] shrink-0 space-y-4">
          <div className="rounded-[8px] border border-border bg-[var(--color-hs-card-bg)] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Property info</h3>
            </div>
            <div className="px-4 py-3 space-y-3">
              <div>
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">Type</p>
                <Badge variant="outline" className="text-[11px] h-5 px-2 font-medium">{fieldTypeLabel}</Badge>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">Created by</p>
                <p className="text-[13px] text-foreground font-medium">{property.created_by}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">Created</p>
                <p className="text-[13px] text-foreground">
                  {new Date(property.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">Last modified</p>
                <p className="text-[13px] text-foreground">
                  {new Date(property.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[8px] border border-border bg-[var(--color-hs-card-bg)] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Monitor</h3>
            </div>
            <div className="px-4 py-3 space-y-4">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5 text-[var(--color-hs-blue)]" />
                  <p className="text-[12px] font-semibold text-foreground">Usage</p>
                </div>
                {[{ label: 'Records with value', value: '—' }, { label: 'Used in forms', value: property.show_in_forms ? 'Yes' : 'No' }, { label: 'Used in workflows', value: '0' }].map((row) => (
                  <div key={row.label} className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] text-muted-foreground">{row.label}</span>
                    <span className="text-[12px] font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
              <Separator className="bg-[var(--color-hs-border)]" />
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart2 className="w-3.5 h-3.5 text-[var(--color-hs-blue)]" />
                  <p className="text-[12px] font-semibold text-foreground">Data quality</p>
                </div>
                {[{ label: 'Fill rate', value: '—' }, { label: 'Unique values', value: '—' }, { label: 'Empty records', value: '—' }].map((row) => (
                  <div key={row.label} className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] text-muted-foreground">{row.label}</span>
                    <span className="text-[12px] font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
              <Separator className="bg-[var(--color-hs-border)]" />
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Database className="w-3.5 h-3.5 text-[var(--color-hs-blue)]" />
                  <p className="text-[12px] font-semibold text-foreground">Data sources</p>
                </div>
                <p className="text-[12px] text-muted-foreground">No integrations writing to this property.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[8px] border border-border bg-[var(--color-hs-card-bg)] shadow-sm px-4 py-3 flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">Required field</span>
            <Badge variant={isRequired ? 'default' : 'outline'}
              className={`text-[11px] h-5 px-2 ${isRequired ? 'bg-[var(--color-hs-text-primary)] text-white' : ''}`}>
              {isRequired ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
