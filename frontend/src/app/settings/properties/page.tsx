"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { laravelApi } from '@/lib/laravel-api';
import { clearPropertiesCache } from '@/hooks/use-properties';

import {
  Search, ChevronDown, Plus, Lock, ExternalLink,
  Filter, SlidersHorizontal, Database, Trash2, Edit3,
  Eye, MoreHorizontal
} from 'lucide-react';

import dynamic from 'next/dynamic';

const CreatePropertySidebar = dynamic(
  () => import('@/components/properties/CreatePropertySidebar'),
  { ssr: false }
);

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const OBJECT_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'company', label: 'Company' },
  { value: 'contact', label: 'Contact' },
  { value: 'deal', label: 'Deal' },
  { value: 'order', label: 'Order' },
  { value: 'product', label: 'Product' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'ticket', label: 'Ticket' },
];

const ACCESS_OPTIONS = [
  { value: 'all', label: 'All access' },
  { value: 'assigned', label: 'Assigned to users and teams' },
  { value: 'everyone_view', label: 'Everyone can view' },
  { value: 'everyone_edit', label: 'Everyone can view and edit' },
  { value: 'super_admins', label: 'Limited to super admins' },
];

interface FieldType {
  name: string;
  label: string;
  category: string;
}

interface Property {
  id: string;
  object_type: string;
  name: string;
  label: string;
  field_type: string;
  group_name: string;
  description: string;
  is_required: boolean;
  is_archived: boolean;
  created_by: string;
  access_level: string;
  options: any[];
  created_at: string;
  updated_at: string;
}

interface PropertyGroup {
  id: string;
  object_type: string;
  name: string;
  display_order: number;
  created_at: string;
}

export default function PropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const objectType = searchParams.get('object_type') || 'contact';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const { workspaceId } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [groups, setGroups] = useState<PropertyGroup[]>([]);
  const [isCreateSidebarOpen, setIsCreateSidebarOpen] = useState(false);
  const [propertyToArchive, setPropertyToArchive] = useState<Property | null>(null);
  const [filters, setFilters] = useState({
    group: 'all',
    fieldType: 'all',
    search: '',
  });
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [dataQualityOn, setDataQualityOn] = useState(false);
  const [objectLabel, setObjectLabel] = useState('');
  const [fieldTypes, setFieldTypes] = useState<FieldType[]>([]);
  const [fieldTypesLoading, setFieldTypesLoading] = useState(true);
  const [fieldTypeLabels, setFieldTypeLabels] = useState<Record<string, string>>({});
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [userFilter, setUserFilter] = useState<string>('all');
  const [accessFilter, setAccessFilter] = useState<string>('all');
  const [userFilterOpen, setUserFilterOpen] = useState(false);
  const [accessFilterOpen, setAccessFilterOpen] = useState(false);
  const [workspaceUsers, setWorkspaceUsers] = useState<{id: string, name: string}[]>([]);
  const userFilterRef = useRef<HTMLDivElement>(null);
  const accessFilterRef = useRef<HTMLDivElement>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    checkbox: 40,
    name: 150,
    group: 220,
    createdBy: 160,
    usedIn: 100,
    fillRate: 100,
    actions: 120,
  });
  const resizingRef = useRef<string | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const handleResizeStart = (column: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = column;
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[column];

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const diff = e.clientX - startXRef.current;
      const newWidth = Math.max(60, startWidthRef.current + diff);
      setColumnWidths(prev => ({ ...prev, [resizingRef.current!]: newWidth }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        object_type: objectType,
        page: page.toString(),
        limit: limit.toString(),
      };
      if (filters.group !== 'all') params.group = filters.group;
      if (filters.fieldType !== 'all') params.field_type = filters.fieldType;
      if (filters.search) params.search = filters.search;
      if (userFilter !== 'all') params.user_filter = userFilter;
      if (accessFilter !== 'all') params.access_filter = accessFilter;

      const response = await laravelApi.get<{ data: { properties: any[]; meta: any } }>('/properties', params);
      if (!response.error && response.data) {
        const inner = response.data.data;
        setProperties(inner?.properties || []);
        setTotalPages(inner?.meta?.totalPages || 1);
        setTotalCount(inner?.meta?.total || 0);
        if (inner?.meta) {
          window.dispatchEvent(new CustomEvent('properties-counts', {
            detail: {
              activeCount: inner.meta.activeCount || 0,
              archivedCount: inner.meta.archivedCount || 0
            }
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await laravelApi.get<{ properties: any[]; meta: any }>('/properties', { object_type: objectType, limit: 500 });
      if (!error && data) {
        const raw = (data as any)?.data?.properties || data.properties || [];
        const groupNames: string[] = [...new Set(raw.map((p: any) => p.group_name).filter(Boolean))] as string[];
        setGroups(groupNames.map((name: string) => ({ id: name, object_type: objectType, name, display_order: 0, created_at: '' })));
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchGroups();
    fetchFieldTypes();
    const obj = OBJECT_TYPES.find(o => o.value === objectType);
    setObjectLabel(obj?.label || 'Contact properties');
    setSelectedIds([]);
  }, [objectType, page, limit, filters.group, filters.fieldType, filters.search]);

  useEffect(() => {
    fetchProperties();
  }, [userFilter, accessFilter]);

  useEffect(() => {
    if (!workspaceId) return;
    laravelApi.get<{ data: any[] }>('/workspace/members')
      .then(({ data }) => {
        const members = (data as any)?.data || [];
        setWorkspaceUsers(members.map((m: any) => ({ id: m.id, name: m.name || m.email || m.id })));
      })
      .catch(() => {});
  }, [workspaceId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userFilterRef.current && !userFilterRef.current.contains(e.target as Node)) {
        setUserFilterOpen(false);
      }
      if (accessFilterRef.current && !accessFilterRef.current.contains(e.target as Node)) {
        setAccessFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchFieldTypes = async () => {
    try {
      const fallbackTypes = [
        { name: 'single_line_text', label: 'Single-line text', category: 'Text' },
        { name: 'multi_line_text', label: 'Multi-line text', category: 'Text' },
        { name: 'rich_text', label: 'Rich text', category: 'Text' },
        { name: 'phone_number', label: 'Phone number', category: 'Contact' },
        { name: 'email', label: 'Email', category: 'Contact' },
        { name: 'url', label: 'URL', category: 'Contact' },
        { name: 'number', label: 'Number', category: 'Numeric' },
        { name: 'currency', label: 'Currency', category: 'Numeric' },
        { name: 'percent', label: 'Percent', category: 'Numeric' },
        { name: 'score', label: 'Score', category: 'Numeric' },
        { name: 'calculation', label: 'Calculation', category: 'Numeric', locked: true },
        { name: 'rollup', label: 'Rollup', category: 'Numeric', locked: true },
        { name: 'property_sync', label: 'Property sync', category: 'Numeric', locked: true },
        { name: 'single_checkbox', label: 'Single checkbox', category: 'Selection' },
        { name: 'multiple_checkboxes', label: 'Multiple checkboxes', category: 'Selection' },
        { name: 'boolean_checkbox', label: 'Boolean checkbox', category: 'Selection' },
        { name: 'dropdown_select', label: 'Dropdown select', category: 'Selection' },
        { name: 'radio_select', label: 'Radio select', category: 'Selection' },
        { name: 'date_picker', label: 'Date picker', category: 'Date/Time' },
        { name: 'date_time_picker', label: 'Date & time picker', category: 'Date/Time' },
        { name: 'file', label: 'File', category: 'Other' },
        { name: 'hubspot_user', label: 'HubSpot user', category: 'Other' },
        { name: 'owner', label: 'Owner', category: 'Other' },
        { name: 'color_picker', label: 'Color picker', category: 'Other' },
      ];

      setFieldTypes(fallbackTypes);

      const labels: Record<string, string> = {};
      fallbackTypes.forEach(ft => {
        labels[ft.name] = ft.label;
      });
      Object.assign(labels, {
        dropdown: 'Dropdown select',
        radio: 'Radio select',
        checkbox: 'Checkbox',
        multi_select: 'Multiple checkboxes',
        boolean: 'Boolean (yes/no)',
        date: 'Date picker',
        date_time: 'Date and time picker',
        phone: 'Phone number',
      });
      setFieldTypeLabels(labels);
    } catch (error) {
      console.error('Failed to set field types:', error);
    } finally {
      setFieldTypesLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const toastId = toast.loading('Archiving property...');
    try {
      const { error } = await laravelApi.delete(`/properties/${id}`);
      if (!error) {
        toast.success('Property archived successfully', { id: toastId });
        fetchProperties();
        clearPropertiesCache();
        window.dispatchEvent(new Event('properties-count-changed'));
      } else {
        toast.error(error || 'Failed to archive property', { id: toastId });
      }
    } catch (err: unknown) {
      console.error('Failed to delete property:', err);
      toast.error('An error occurred while archiving property', { id: toastId });
    }
  };

  const handleToggleRequired = async (id: string, current: boolean) => {
    const toastId = toast.loading(current ? 'Marking as optional...' : 'Marking as required...');
    try {
      const { error } = await laravelApi.patch(`/properties/${id}`, {
        is_required: !current,
      });
      if (!error) {
        toast.success(current ? 'Property marked as optional' : 'Property marked as required', { id: toastId });
        fetchProperties();
        clearPropertiesCache();
      } else {
        toast.error(error || 'Failed to update property', { id: toastId });
      }
    } catch (err: unknown) {
      console.error('Failed to update property:', err);
      toast.error('An error occurred while updating property', { id: toastId });
    }
  };

  const handleRestore = async (id: string) => {
    const toastId = toast.loading('Restoring property...');
    try {
      const { error } = await laravelApi.patch(`/properties/${id}`, { restore: true });
      if (!error) {
        toast.success('Property restored successfully', { id: toastId });
        fetchProperties();
        clearPropertiesCache();
        window.dispatchEvent(new Event('properties-count-changed'));
      } else {
        toast.error(error || 'Failed to restore property', { id: toastId });
      }
    } catch (err: unknown) {
      console.error('Failed to restore property:', err);
      toast.error('An error occurred while restoring property', { id: toastId });
    }
  };


  const getRouteForObject = (objType: string) => {
    const routes: Record<string, string> = {
      contact: '/settings/contacts',
      company: '/settings/companies',
      deal: '/settings/deals',
      ticket: '/settings/tickets',
      product: '/settings/products',
    };
    return routes[objType] || '/settings/contacts';
  };

  const allSelected = properties.length > 0 && properties.every(p => selectedIds.includes(p.id));
  const propertyFieldTypes = [...new Set(properties.map(p => p.field_type))];

  return (
    <div className="space-y-6">
      {/* Object Type Selector */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-[var(--color-hs-border)]" />
              <span className="text-[13px] text-muted-foreground">Select an object:</span>
              <Select value={objectType} onValueChange={(val) => {
                setFilters(prev => ({ ...prev, group: 'all', fieldType: 'all', search: '' }));
                const searchParams = new URLSearchParams(window.location.search);
                searchParams.set('object_type', val);
                searchParams.set('page', '1');
                router.push(`${window.location.pathname}?${searchParams}`);
              }}>
                <SelectTrigger className="border-border focus:ring-[var(--color-hs-blue)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OBJECT_TYPES.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="link" className="text-[13px] text-primary">
              Go to {objectLabel.split(' ')[0]} settings →
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-6 items-start">
      {/* Properties Table */}
      <Card className="border-border shadow-sm flex-1 min-w-0">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-border bg-background">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-muted-foreground/60" />
              <Select value={filters.group} onValueChange={(val) => setFilters(prev => ({ ...prev, group: val }))}>
                <SelectTrigger className="h-9 border-border text-[13px]">
                  <SelectValue placeholder="All groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All groups</SelectItem>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground/60" />
              <Select value={filters.fieldType} onValueChange={(val) => setFilters(prev => ({ ...prev, fieldType: val }))}>
                <SelectTrigger className="h-9 border-border text-[13px]">
                  <SelectValue placeholder="All field types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All field types</SelectItem>
                  {fieldTypes.map(ft => (
                    <SelectItem key={ft.name} value={ft.name}>{fieldTypeLabels[ft.name] || ft.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative" ref={userFilterRef}>
              <button onClick={() => { setUserFilterOpen(!userFilterOpen); setAccessFilterOpen(false); }}
                className="flex items-center gap-1.5 h-9 text-[13px] text-foreground px-3 border border-border rounded-md hover:bg-accent">
                {userFilter === 'all' ? 'All users' : workspaceUsers.find(u => u.id === userFilter)?.name || 'All users'}
                <ChevronDown className="w-3 h-3 text-muted-foreground/60" />
              </button>
              {userFilterOpen && (
                <div className="absolute z-50 w-52 border border-border rounded-md bg-primary-foreground shadow-md mt-1">
                  <div onClick={() => { setUserFilter('all'); setUserFilterOpen(false); }}
                    className="px-3 py-2 text-[13px] text-foreground hover:bg-accent cursor-pointer flex items-center gap-2">
                    <input type="checkbox" checked={userFilter === 'all'} readOnly className="pointer-events-none accent-[var(--color-hs-blue)]" />
                    All users
                  </div>
                  {workspaceUsers.map(u => (
                    <div key={u.id} onClick={() => { setUserFilter(u.id); setUserFilterOpen(false); }}
                      className="px-3 py-2 text-[13px] text-foreground hover:bg-accent cursor-pointer flex items-center gap-2">
                      <input type="checkbox" checked={userFilter === u.id} readOnly className="pointer-events-none accent-[var(--color-hs-blue)]" />
                      {u.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative" ref={accessFilterRef}>
              <button onClick={() => { setAccessFilterOpen(!accessFilterOpen); setUserFilterOpen(false); }}
                className="flex items-center gap-1.5 h-9 text-[13px] text-foreground px-3 border border-border rounded-md hover:bg-accent">
                {ACCESS_OPTIONS.find(o => o.value === accessFilter)?.label || 'All access'}
                <ChevronDown className="w-3 h-3 text-muted-foreground/60" />
              </button>
              {accessFilterOpen && (
                <div className="absolute z-50 w-60 border border-border rounded-md bg-primary-foreground shadow-md mt-1">
                  {ACCESS_OPTIONS.map(opt => (
                    <div key={opt.value} onClick={() => { setAccessFilter(opt.value); setAccessFilterOpen(false); }}
                      className={`px-3 py-2 text-[13px] text-foreground hover:bg-accent cursor-pointer ${accessFilter === opt.value ? 'bg-accent' : ''}`}>
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input
                placeholder="Search properties..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9 pr-3 py-2 h-9 border-border focus-visible:ring-[var(--color-hs-blue)] text-[13px] w-60"
              />
            </div>
            <div className="flex items-center gap-2">
              <Lock className={`w-4 h-4 ${dataQualityOn ? 'text-primary' : 'text-muted-foreground/60'}`} />
              <span className={`text-[13px] ${dataQualityOn ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                {dataQualityOn ? 'Data quality monitoring is on' : 'Data quality monitoring is off'}
              </span>
            </div>
            <CreatePropertyButton onClick={() => setIsCreateSidebarOpen(true)} />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table style={{ tableLayout: 'fixed' }}>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="px-4 relative" style={{ width: columnWidths.checkbox }}>
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => {
                      setSelectedIds(checked ? properties.map(p => p.id) : []);
                    }}
                  />
                </TableHead>
                <TableHead className="px-4 cursor-pointer hover:bg-accent relative" style={{ width: 150, maxWidth: 150 }}>
                  Name ↑
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary opacity-0 hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => handleResizeStart('name', e)}
                  />
                </TableHead>
                <TableHead className="px-4 cursor-pointer hover:bg-accent relative" style={{ width: columnWidths.group }}>
                  Group ↕
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary opacity-0 hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => handleResizeStart('group', e)}
                  />
                </TableHead>
                <TableHead className="px-4 cursor-pointer hover:bg-accent relative" style={{ width: columnWidths.createdBy }}>
                  Created by ↕
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary opacity-0 hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => handleResizeStart('createdBy', e)}
                  />
                </TableHead>
                <TableHead className="px-4 cursor-pointer hover:bg-accent relative" style={{ width: columnWidths.usedIn }}>
                  Used In ↕
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary opacity-0 hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => handleResizeStart('usedIn', e)}
                  />
                </TableHead>
                <TableHead className="px-4 relative" style={{ width: columnWidths.fillRate }}>
                  Fill Rate
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary opacity-0 hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => handleResizeStart('fillRate', e)}
                  />
                </TableHead>
                <TableHead className="px-4 text-right relative" style={{ width: columnWidths.actions }}>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-hs-blue)] mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    No properties found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                properties.map((prop) => (
                  <TableRow
                    key={prop.id}
                    className={`group hover:bg-accent transition-colors cursor-pointer ${selectedProperty?.id === prop.id ? 'bg-accent' : ''}`}
                    onClick={() => setSelectedProperty(selectedProperty?.id === prop.id ? null : prop)}
                  >
                    <TableCell className="px-4" style={{ width: columnWidths.checkbox }} onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(prop.id)}
                        onCheckedChange={(checked) => {
                          setSelectedIds(prev =>
                            checked ? [...prev, prop.id] : prev.filter(id => id !== prop.id)
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell className="px-4 overflow-hidden" style={{ width: columnWidths.name, maxWidth: columnWidths.name }} onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/settings/properties/${prop.id}/edit`}
                          className="text-[14px] font-bold text-primary truncate hover:underline"
                        >
                          {prop.label}
                        </Link>
                        <span className="text-[12px] text-muted-foreground">
                          {fieldTypeLabels[prop.field_type] || prop.field_type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4" style={{ width: columnWidths.group }}>
                      <span className="text-[13px] text-foreground">
                        {prop.group_name || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="px-4" style={{ width: columnWidths.createdBy }}>
                      <span className="text-[13px] text-foreground">
                        {prop.created_by}
                      </span>
                    </TableCell>
                    <TableCell className="px-4" style={{ width: columnWidths.usedIn }} onClick={(e) => e.stopPropagation()}>
                      <span className="text-[13px] text-primary cursor-pointer hover:underline font-medium">
                        0
                      </span>
                    </TableCell>
                    <TableCell className="px-4" style={{ width: columnWidths.fillRate }}>
                      <span className="text-[13px] text-muted-foreground">
                        —
                      </span>
                    </TableCell>
                    <TableCell className="px-4" style={{ width: columnWidths.actions }} onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {prop.is_required ? (
                          <Badge variant="default" className="text-[10px] h-5 px-1.5 bg-foreground text-primary-foreground">Required</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5">Optional</Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 border-border">
                            <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              className="text-[13px] text-foreground focus:bg-accent focus:text-primary cursor-pointer px-3 py-2"
                              onClick={() => router.push(`/settings/properties/${prop.id}/edit`)}
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[13px] text-foreground focus:bg-accent focus:text-primary cursor-pointer px-3 py-2"
                              onClick={() => handleToggleRequired(prop.id, prop.is_required)}
                            >
                              {prop.is_required ? 'Mark as optional' : 'Mark as required'}
                            </DropdownMenuItem>
                            {prop.is_archived ? (
                              <DropdownMenuItem className="text-[13px] text-primary focus:bg-accent cursor-pointer px-3 py-2">
                                <ExternalLink className="w-3.5 h-3.5 mr-2" />
                                Restore
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-[13px] text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer px-3 py-2"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setPropertyToArchive(prop);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-[13px] text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Showing {properties.length} of {totalCount} properties</span>
            <div className="flex items-center gap-2">
              <span className="text-[12px]">Show:</span>
              <Select value={limit.toString()} onValueChange={(val) => {
                const sp = new URLSearchParams(window.location.search);
                sp.set('limit', val);
                sp.set('page', '1');
                router.push(`${window.location.pathname}?${sp}`);
              }}>
                <SelectTrigger className="h-8 border-border text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    if (page > 1) {
                      const sp = new URLSearchParams(window.location.search);
                      sp.set('page', (page - 1).toString());
                      router.push(`${window.location.pathname}?${sp}`);
                    }
                  }}
                  className={page <= 1 ? 'cursor-not-allowed opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={() => {
                        const sp = new URLSearchParams(window.location.search);
                        sp.set('page', p.toString());
                        router.push(`${window.location.pathname}?${sp}`);
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              {totalPages > 5 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationNext
                  onClick={() => {
                    if (page < totalPages) {
                      const sp = new URLSearchParams(window.location.search);
                      sp.set('page', (page + 1).toString());
                      router.push(`${window.location.pathname}?${sp}`);
                    }
                  }}
                  className={page >= totalPages ? 'cursor-not-allowed opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>

      {/* Right Panel - Property Details */}
      <div className="w-[340px] shrink-0 space-y-4">
        {selectedProperty ? (
          <>
            <div className="rounded-[8px] border border-border bg-primary-foreground shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Property info</h3>
                <button
                  onClick={() => setSelectedProperty(null)}
                  className="text-muted-foreground/60 hover:text-foreground text-[18px] leading-none cursor-pointer"
                >
                  ×
                </button>
              </div>
              <div className="px-4 py-4 space-y-4">
                <div>
                  <p className="text-[16px] font-bold text-foreground">{selectedProperty.label}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{fieldTypeLabels[selectedProperty.field_type] || selectedProperty.field_type}</p>
                </div>
                <div className="h-px bg-border" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">Group</p>
                    <p className="text-[13px] text-foreground">{selectedProperty.group_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">Created by</p>
                    <p className="text-[13px] text-foreground">{selectedProperty.created_by}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">Created</p>
                    <p className="text-[13px] text-foreground">{selectedProperty.created_at ? new Date(selectedProperty.created_at).toLocaleDateString() : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">Updated</p>
                    <p className="text-[13px] text-foreground">{selectedProperty.updated_at ? new Date(selectedProperty.updated_at).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
                {selectedProperty.description && (
                  <>
                    <div className="h-px bg-border" />
                    <div>
                      <p className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">Description</p>
                      <p className="text-[13px] text-foreground">{selectedProperty.description}</p>
                    </div>
                  </>
                )}
                <div className="h-px bg-border" />
                <div className="flex items-center gap-2">
                  {selectedProperty.is_required ? (
                    <Badge className="text-[11px] h-5 px-2 bg-foreground text-primary-foreground">Required</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[11px] h-5 px-2">Optional</Badge>
                  )}
                  {selectedProperty.is_archived && (
                    <Badge variant="outline" className="text-[11px] h-5 px-2 text-status-warning border-status-warning/30">Archived</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[8px] border border-border bg-primary-foreground shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Actions</h3>
              </div>
              <div className="px-4 py-3 space-y-1">
                <button
                  onClick={() => router.push(`/settings/properties/${selectedProperty.id}/edit`)}
                  className="w-full text-left px-3 py-2 rounded text-[13px] text-foreground hover:bg-accent flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit property
                </button>
                <button
                  onClick={() => handleToggleRequired(selectedProperty.id, selectedProperty.is_required)}
                  className="w-full text-left px-3 py-2 rounded text-[13px] text-foreground hover:bg-accent flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {selectedProperty.is_required ? 'Mark as optional' : 'Mark as required'}
                </button>
                {selectedProperty.is_archived ? (
                  <button
                    onClick={() => handleRestore(selectedProperty.id)}
                    className="w-full text-left px-3 py-2 rounded text-[13px] text-primary hover:bg-accent flex items-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Restore
                  </button>
                ) : (
                  <button
                    onClick={() => setPropertyToArchive(selectedProperty)}
                    className="w-full text-left px-3 py-2 rounded text-[13px] text-destructive hover:bg-destructive/10 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Archive
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-[8px] border border-border bg-primary-foreground shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Property info</h3>
            </div>
            <div className="px-4 py-8 text-center">
              <p className="text-[13px] text-muted-foreground/60">Select a property to view details</p>
            </div>
          </div>
        )}
      </div>
      </div>

      <CreatePropertySidebar
        isOpen={isCreateSidebarOpen}
        onClose={() => setIsCreateSidebarOpen(false)}
        objectType={objectType}
        onCreated={() => {
          fetchProperties();
          fetchGroups();
          clearPropertiesCache();
          window.dispatchEvent(new Event('properties-count-changed'));
        }}
      />

      <ConfirmDialog
        open={propertyToArchive !== null}
        onOpenChange={(open) => { if (!open) setPropertyToArchive(null); }}
        title="Archive Property"
        description={`Are you sure you want to archive "${propertyToArchive?.label}"?`}
        confirmText="Archive"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (propertyToArchive) {
            handleDelete(propertyToArchive.id);
            setPropertyToArchive(null);
          }
        }}
      />
    </div>
  );
}

// Create Property Button - Opens the create property sidebar
function CreatePropertyButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      className="bg-primary hover:bg-[var(--color-hs-blue-hover)] text-primary-foreground gap-2 font-bold"
      onClick={onClick}
    >
      <Plus className="w-4 h-4" />
      Create property
    </Button>
  );
}