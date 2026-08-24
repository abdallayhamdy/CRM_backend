"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle, ArrowLeft, Save, BarChart2, Database, CheckCircle2,
  Info, Lock, Users, Loader2, ChevronRight, FileText, Settings2, Shield,
  Eye, ShieldCheck, Plus, X, Type
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
import { clearPropertiesCache } from '@/hooks/use-properties';

const RulesTab = dynamic(
  () => import('@/components/properties/RulesTab'),
  { ssr: false }
);
const ManageAccessTab = dynamic(
  () => import('@/components/properties/ManageAccessTab'),
  { ssr: false }
);
const FieldTypeSelector = dynamic(
  () => import('@/components/properties/FieldTypeSelector'),
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

type TabId = 'details' | 'field_type' | 'rules' | 'manage_access' | 'preview';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'details',       label: 'Details',       icon: FileText    },
  { id: 'field_type',    label: 'Field Type',    icon: Type        },
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

  // Field type specific state
  const [fieldType, setFieldType] = useState('');
  const [options, setOptions] = useState<Array<{ label: string; value: string; color?: string }>>([]);
  const [defaultValue, setDefaultValue] = useState('');
  const [numberFormat, setNumberFormat] = useState('formatted');
  const [dateDisplayFormat, setDateDisplayFormat] = useState('date_only');
  const [datetimeDisplayFormat, setDatetimeDisplayFormat] = useState('date_time_only');
  const [optionStyle, setOptionStyle] = useState('default');

  const isChoiceField = ['dropdown_select', 'radio_select', 'multiple_checkboxes'].includes(fieldType);
  const isNumberField = ['number', 'currency', 'percent'].includes(fieldType);

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
      setFieldType(p.field_type);
      setOptions(p.options?.length > 0 ? p.options.map((o: any) => ({ label: o.label, value: o.value, color: o.color || '' })) : []);
      setDefaultValue((p as any).default_value || '');
      setNumberFormat((p as any).number_format || 'formatted');
      setDateDisplayFormat((p as any).date_display_format || 'date_only');
      setDatetimeDisplayFormat((p as any).datetime_display_format || 'date_time_only');
      setOptionStyle((p as any).option_style || 'default');
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
        field_type: fieldType, default_value: defaultValue || null,
      };
      if (isChoiceField) {
        body.options = options.filter(opt => opt.label.trim() !== '');
        body.option_style = optionStyle;
      }
      if (isNumberField) {
        body.number_format = numberFormat;
      }
      if (fieldType === 'date_picker') {
        body.date_display_format = dateDisplayFormat;
      }
      if (fieldType === 'date_time_picker') {
        body.datetime_display_format = datetimeDisplayFormat;
      }
      if (!isSystem) { body.label = label.trim(); body.group_name = groupName || null; }
      const { data, error } = await laravelApi.patch<{ data: Property }>(`/properties/${propertyId}`, body);
      if (error) { setError(error); return; }
      const updated = (data as any)?.data ?? data;
      if (updated) setProperty(updated);
      clearPropertiesCache();
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

          {/* ── FIELD TYPE TAB ──────────────────────────────────────────────── */}
          {activeTab === 'field_type' && (
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
                      <h2 className="text-[18px] font-bold text-foreground">Field Type</h2>
                      <p className="text-[13px] text-muted-foreground mt-0.5">
                        Configure the field type and options for this property.
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
                  {/* Field type */}
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-foreground">Field type</Label>
                    <FieldTypeSelector
                      value={fieldType}
                      onChange={setFieldType}
                      placeholder="Select field type"
                    />
                  </div>

                  {/* Default Value - for most field types */}
                  {fieldType && !isChoiceField && !['calculation', 'rollup'].includes(fieldType) && (
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-foreground">Default value</Label>
                      {(fieldType === 'single_line_text' || fieldType === 'phone_number' || fieldType === 'email' || fieldType === 'url') && (
                        <Input
                          value={defaultValue}
                          onChange={(e) => setDefaultValue(e.target.value)}
                          placeholder={`Enter default ${fieldType === 'email' ? 'email' : fieldType === 'url' ? 'URL' : 'value'}`}
                          type={fieldType === 'email' ? 'email' : fieldType === 'url' ? 'url' : 'text'}
                          className="border-border text-[14px]"
                        />
                      )}
                      {fieldType === 'multi_line_text' && (
                        <Textarea
                          value={defaultValue}
                          onChange={(e) => setDefaultValue(e.target.value)}
                          placeholder="Enter default text value"
                          className="border-border text-[14px] resize-none min-h-[80px]"
                        />
                      )}
                      {isNumberField && (
                        <div className="relative">
                          {fieldType === 'currency' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>}
                          <Input
                            type="number"
                            value={defaultValue}
                            onChange={(e) => setDefaultValue(e.target.value)}
                            placeholder={fieldType === 'currency' ? '0.00' : fieldType === 'percent' ? '0' : '0'}
                            step="any"
                            className={`border-border text-[14px] ${fieldType === 'currency' ? 'pl-7' : fieldType === 'percent' ? 'pr-7' : ''}`}
                          />
                          {fieldType === 'percent' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>}
                        </div>
                      )}
                      {fieldType === 'number' && (
                        <Select value={numberFormat} onValueChange={setNumberFormat}>
                          <SelectTrigger className="border-border text-[14px]">
                            <SelectValue placeholder="Number format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="formatted">Formatted number</SelectItem>
                            <SelectItem value="unformatted">Unformatted number</SelectItem>
                            <SelectItem value="currency">Currency format</SelectItem>
                            <SelectItem value="percentage">Percentage format</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {(fieldType === 'date_picker') && (
                        <Input
                          type="date"
                          value={defaultValue}
                          onChange={(e) => setDefaultValue(e.target.value)}
                          className="border-border text-[14px]"
                        />
                      )}
                      {fieldType === 'date_time_picker' && (
                        <Input
                          type="datetime-local"
                          value={defaultValue}
                          onChange={(e) => setDefaultValue(e.target.value)}
                          className="border-border text-[14px]"
                        />
                      )}
                      {fieldType === 'single_checkbox' && (
                        <Select value={defaultValue} onValueChange={setDefaultValue}>
                          <SelectTrigger className="border-border text-[14px]">
                            <SelectValue placeholder="Select default value" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none_selected_boolean">None</SelectItem>
                            <SelectItem value="true">Yes / True</SelectItem>
                            <SelectItem value="false">No / False</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {fieldType === 'score' && (
                        <Select value={defaultValue} onValueChange={setDefaultValue}>
                          <SelectTrigger className="border-border text-[14px]">
                            <SelectValue placeholder="Select default rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="1">1 Star</SelectItem>
                            <SelectItem value="2">2 Stars</SelectItem>
                            <SelectItem value="3">3 Stars</SelectItem>
                            <SelectItem value="4">4 Stars</SelectItem>
                            <SelectItem value="5">5 Stars</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {fieldType === 'color_picker' && (
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={defaultValue || '#000000'}
                            onChange={(e) => setDefaultValue(e.target.value)}
                            className="w-10 h-10 rounded-[6px] border border-border cursor-pointer shrink-0"
                          />
                          <Input
                            value={defaultValue}
                            onChange={(e) => setDefaultValue(e.target.value)}
                            placeholder="#ffffff"
                            className="flex-1 border-border text-[14px] font-mono"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Date Display Format */}
                  {fieldType === 'date_picker' && (
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-foreground">Date display format</Label>
                      <Select value={dateDisplayFormat} onValueChange={setDateDisplayFormat}>
                        <SelectTrigger className="border-border text-[14px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date_only">Show date only</SelectItem>
                          <SelectItem value="date_with_relative">Show date with relative time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* DateTime Display Format */}
                  {fieldType === 'date_time_picker' && (
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-foreground">Date and time display format</Label>
                      <Select value={datetimeDisplayFormat} onValueChange={setDatetimeDisplayFormat}>
                        <SelectTrigger className="border-border text-[14px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date_time_only">Show date and time only</SelectItem>
                          <SelectItem value="date_time_relative">Show date, time, and relative time</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="rounded-[6px] border border-border bg-[var(--color-hs-light-bg)] px-3 py-2 mt-2">
                        <p className="text-[12px] text-muted-foreground">
                          Viewing and editing uses your device timezone. Filtering uses the account timezone.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Options - for choice fields */}
                  {isChoiceField && (
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-foreground">Options</Label>
                      <p className="text-[12px] text-muted-foreground">Add and manage options for this {fieldType.replace('_', ' ')} field.</p>

                      {/* Option Style */}
                      <div className="space-y-1 mt-3">
                        <Label className="text-[12px] font-medium text-foreground">Option style</Label>
                        <Select value={optionStyle} onValueChange={setOptionStyle}>
                          <SelectTrigger className="border-border text-[13px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="with_dot">With dot indicator</SelectItem>
                            <SelectItem value="badge">Badge style</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                       {/* Options List */}
                      <div className="space-y-2 mt-3">
                        {options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Input
                              placeholder="Label"
                              value={opt.label}
                              onChange={(e) => {
                                const newOptions = [...options];
                                newOptions[i].label = e.target.value;
                                if (!newOptions[i].value || newOptions[i].value === options[i].label.toLowerCase().replace(/\s+/g, '_')) {
                                  newOptions[i].value = e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                                }
                                setOptions(newOptions);
                              }}
                              className="flex-1 border-border text-[13px]"
                            />
                            <Input
                              placeholder="Internal value"
                              value={opt.value}
                              onChange={(e) => {
                                const newOptions = [...options];
                                newOptions[i].value = e.target.value;
                                setOptions(newOptions);
                              }}
                              className="flex-1 border-border bg-[var(--color-hs-light-bg)] text-[13px] font-mono"
                            />
                            <div className="shrink-0" title="Option color">
                              <input
                                type="color"
                                value={opt.color || '#3b82f6'}
                                onChange={(e) => {
                                  const newOptions = [...options];
                                  newOptions[i].color = e.target.value;
                                  setOptions(newOptions);
                                }}
                                className="w-8 h-8 rounded-[6px] border border-border cursor-pointer"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 shrink-0 h-8 w-8"
                              onClick={() => {
                                if (options.length <= 1) return;
                                setOptions(options.filter((_, idx) => idx !== i));
                              }}
                              disabled={options.length <= 1}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          className="w-full border-dashed border-border text-[var(--color-hs-blue)] hover:bg-[var(--color-hs-blue)]/5 hover:border-[var(--color-hs-blue)] text-[13px]"
                          onClick={() => setOptions([...options, { label: '', value: '', color: '' }])}
                        >
                          <Plus className="w-4 h-4 mr-1.5" />
                          Add another option
                        </Button>
                      </div>
                    </div>
                  )}
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
