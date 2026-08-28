"use client";

import React, { useState, useEffect } from 'react';
import { Trash2, MoreHorizontal, ExternalLink, RotateCcw } from 'lucide-react';
import { clearPropertiesCache } from '@/hooks/use-properties';
import { Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
} from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { laravelApi } from '@/lib/laravel-api';

interface Property {
  id: string;
  label: string;
  field_type: string;
  group_name: string;
  created_by: string;
  is_archived: boolean;
}

interface ApiResponse {
  properties: Property[];
}

export default function ArchivedPage() {
  const searchParams = useSearchParams();
  const objectType = searchParams.get('object_type') || 'contact';

  const [archivedProperties, setArchivedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadArchivedProperties();
  }, [objectType]);

  const loadArchivedProperties = async () => {
    setLoading(true);
    const { data, error } = await laravelApi.get<{ data: ApiResponse }>('/properties', {
      object_type: objectType,
      archived: 1,
      limit: 100,
    });
    if (data && !error) {
      setArchivedProperties(data.data.properties);
      setSelectedIds([]);
    } else {
      toast.error(error || 'Failed to load archived properties');
    }
    setLoading(false);
  };

  const success = () => {
    clearPropertiesCache();
    window.dispatchEvent(new Event('properties-count-changed'));
    loadArchivedProperties();
  };

  const handleRestore = async (id: string) => {
    const { error } = await laravelApi.patch(`/properties/${id}`, { restore: true });
    if (!error) success();
    else toast.error(error || 'Failed to restore property');
  };

  const handlePermanentlyDelete = async (id: string) => {
    if (!confirm('This will permanently delete the property. This action cannot be undone.')) return;
    const { error } = await laravelApi.delete(`/properties/${id}?force=1`);
    if (!error) success();
    else toast.error(error || 'Failed to delete property');
  };

  const word = (n: number) => (n === 1 ? 'property' : 'properties');

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0 || busy) return;
    setBusy(true);
    const n = selectedIds.length;
    const toastId = toast.loading(`Restoring ${n} ${word(n)}...`);
    const results = await Promise.all(
      selectedIds.map(id => laravelApi.patch(`/properties/${id}`, { restore: true }))
    );
    const failed = results.filter(r => r.error).length;
    setBusy(false);
    if (failed === 0) {
      toast.success(`${n} ${word(n)} restored`, { id: toastId });
    } else {
      toast.error(`${failed} ${word(failed)} failed to restore`, { id: toastId });
    }
    success();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0 || busy) return;
    const n = selectedIds.length;
    if (!confirm(`Permanently delete ${n} archived ${word(n)}? This cannot be undone.`)) return;
    setBusy(true);
    const toastId = toast.loading(`Deleting ${n} ${word(n)}...`);
    const results = await Promise.all(
      selectedIds.map(id => laravelApi.delete(`/properties/${id}?force=1`))
    );
    const failed = results.filter(r => r.error).length;
    setBusy(false);
    if (failed === 0) {
      toast.success(`${n} ${word(n)} permanently deleted`, { id: toastId });
    } else {
      toast.error(`${failed} ${word(failed)} failed to delete`, { id: toastId });
    }
    success();
  };

  const FIELD_TYPE_LABELS: Record<string, string> = {
    single_line_text: 'Single-line text',
    multi_line_text: 'Multi-line text',
    rich_text: 'Rich text',
    number: 'Number',
    currency: 'Currency',
    percent: 'Percent',
    score: 'Score',
    phone_number: 'Phone number',
    phone: 'Phone number',
    email: 'Email',
    url: 'URL',
    dropdown_select: 'Dropdown select',
    dropdown: 'Dropdown select',
    radio_select: 'Radio select',
    radio: 'Radio select',
    single_checkbox: 'Single checkbox',
    multiple_checkboxes: 'Multiple checkboxes',
    multi_select: 'Multiple checkboxes',
    boolean_checkbox: 'Boolean (yes/no)',
    boolean: 'Boolean (yes/no)',
    date_picker: 'Date picker',
    date: 'Date picker',
    date_time_picker: 'Date and time picker',
    date_time: 'Date and time picker',
    file: 'File',
    calculation: 'Calculation',
    rollup: 'Rollup',
    property_sync: 'Property sync',
    hubspot_user: 'HubSpot user',
    owner: 'Owner',
    color_picker: 'Color picker',
  };

  const filtered = archivedProperties.filter(p =>
    p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.field_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every(p => selectedIds.includes(p.id));

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? filtered.map(p => p.id) : []);
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
  };

  return (
    <div className="space-y-6">
      <p className="text-[14px] text-foreground">
        Archived properties are hidden from forms and views but can be restored at any time.
      </p>

      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            placeholder="Search archived properties..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 h-9 border-border text-[13px] w-64"
          />
        </div>
        <span className="text-[13px] text-muted-foreground">
          {filtered.length} archived properties
        </span>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/50">
          <span className="text-[13px] font-medium text-foreground">
            {selectedIds.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-border text-[13px]"
              onClick={handleBulkRestore}
              disabled={busy}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Restore selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-border text-[13px] text-destructive hover:text-destructive"
              onClick={handleBulkDelete}
              disabled={busy}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete permanently
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-[13px]"
              onClick={() => setSelectedIds([])}
              disabled={busy}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <Card className="border-border shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => toggleAll(!!checked)}
                    aria-label="Select all archived properties"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Field type</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Archived by</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Loading archived properties...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    No archived properties found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((prop) => (
                  <TableRow key={prop.id} className="hover:bg-[var(--color-hs-light-bg)] transition-colors border-b border-border last:border-b-0">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(prop.id)}
                        onCheckedChange={(checked) => toggleOne(prop.id, !!checked)}
                        aria-label={`Select ${prop.label}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-foreground">{prop.label}</span>
                        <span className="text-[12px] text-muted-foreground">
                          {FIELD_TYPE_LABELS[prop.field_type] || prop.field_type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[13px] text-foreground">{FIELD_TYPE_LABELS[prop.field_type] || prop.field_type}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[13px] text-muted-foreground">{prop.group_name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[13px] text-foreground">{prop.created_by}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-[var(--color-hs-border-light)]">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 border-border">
                            <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-[var(--color-hs-border)]" />
                            <DropdownMenuItem
                              className="text-[13px] text-[var(--color-hs-blue)] focus:bg-[var(--color-hs-light-bg)] cursor-pointer px-3 py-2"
                              onClick={() => handleRestore(prop.id)}
                            >
                              <ExternalLink className="w-3.5 h-3.5 mr-2" />
                              Restore
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-[13px] text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer px-3 py-2"
                              onClick={() => handlePermanentlyDelete(prop.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Permanently delete
                            </DropdownMenuItem>
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
      </Card>
    </div>
  );
}