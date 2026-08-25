"use client";

import React, { useState, useEffect } from 'react';
import { Trash2, Edit3, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { laravelApi } from '@/lib/laravel-api';
import { clearPropertiesCache } from '@/hooks/use-properties';

interface PropertyGroup {
  id: string;
  object_type: string;
  name: string;
  display_order: number;
  created_at: string;
  property_count?: number;
}

const OBJECT_TYPES = [
  { value: 'call',         label: 'Call' },
  { value: 'company',      label: 'Company' },
  { value: 'contact',      label: 'Contact' },
  { value: 'deal',         label: 'Deal' },
  { value: 'order',        label: 'Order' },
  { value: 'product',      label: 'Product' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'ticket',       label: 'Ticket' },
];

export default function GroupsPage() {
  const [groups, setGroups]                   = useState<PropertyGroup[]>([]);
  const [loading, setLoading]                 = useState(true);

  const [dialogOpen, setDialogOpen]           = useState(false);
  const [newGroupName, setNewGroupName]        = useState('');
  const [selectedObjectType, setSelectedObjectType] = useState('contact');
  const [creating, setCreating]               = useState(false);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingGroup, setRenamingGroup]       = useState<PropertyGroup | null>(null);
  const [renameValue, setRenameValue]           = useState('');
  const [renaming, setRenaming]                 = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    setLoading(true);
    try {
      const { data, error } = await laravelApi.get<{ data: PropertyGroup[] }>('/property-groups');
      if (error) throw new Error(error);
      const items = (data as any)?.data ?? [];
      setGroups(items);
    } catch {
      toast.error('Could not load property groups');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await laravelApi.post<{ data: PropertyGroup }>('/property-groups', {
        object_type: selectedObjectType,
        name: newGroupName.trim(),
      });
      if (error) {
        throw new Error(error);
      }
      const created = (data as any)?.data;
      if (created) {
        setGroups(prev => [...prev, { ...created, property_count: 0 }]);
      }
      toast.success('Group created');
      setDialogOpen(false);
      setNewGroupName('');
      setSelectedObjectType('contact');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setCreating(false);
    }
  }

  function openRename(group: PropertyGroup) {
    setRenamingGroup(group);
    setRenameValue(group.name);
    setRenameDialogOpen(true);
  }

  async function handleRename() {
    if (!renamingGroup || !renameValue.trim()) return;
    setRenaming(true);
    try {
      const { error } = await laravelApi.patch('/property-groups/rename', {
        from: renamingGroup.name,
        to: renameValue.trim(),
        object_type: renamingGroup.object_type,
      });
      if (error) {
        throw new Error(error);
      }
      setGroups(prev =>
        prev.map(g => g.name === renamingGroup.name && g.object_type === renamingGroup.object_type
          ? { ...g, name: renameValue.trim() } : g)
      );
      toast.success('Group renamed');
      clearPropertiesCache();
      setRenameDialogOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setRenaming(false);
    }
  }

  async function handleDeleteGroup(id: string) {
    const group = groups.find(g => g.id === id);
    if (!group) return;
    if (!confirm(`Delete group "${group.name}"? Properties inside will be ungrouped.`)) return;
    try {
      const { error } = await laravelApi.delete(`/property-groups/${encodeURIComponent(group.name)}?object_type=${encodeURIComponent(group.object_type)}`);
      if (error) {
        throw new Error(error);
      }
      setGroups(prev => prev.filter(g => g.id !== id));
      toast.success('Group deleted');
      clearPropertiesCache();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Unknown error');
    }
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <p className="text-[14px] text-foreground">
          Organize your properties into groups to keep them manageable.
        </p>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[var(--color-hs-blue)] hover:bg-[var(--color-hs-blue-hover)] text-[var(--color-hs-card-bg)] gap-2 font-bold">
               Create group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">Create property group</DialogTitle>
              <DialogDescription className="text-[13px] text-muted-foreground">
                Add a new group to organize your properties.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-foreground">Object type</Label>
                <Select value={selectedObjectType} onValueChange={setSelectedObjectType}>
                  <SelectTrigger className="border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OBJECT_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-foreground">
                  Group name <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g. Contact information"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
                  className="border-border focus-visible:ring-[var(--color-hs-blue)]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">
                Cancel
              </Button>
              <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || creating}
                className="bg-[var(--color-hs-blue)] hover:bg-[var(--color-hs-blue-hover)] text-[var(--color-hs-card-bg)] font-bold">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Rename group</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-[13px] font-bold text-foreground">Group name</Label>
            <Input
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              className="mt-2 border-border focus-visible:ring-[var(--color-hs-blue)]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRename} disabled={!renameValue.trim() || renaming}
              className="bg-[var(--color-hs-blue)] hover:bg-[var(--color-hs-blue-hover)] text-[var(--color-hs-card-bg)] font-bold">
              {renaming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : groups.length === 0 ? (
        <p className="text-center text-[13px] text-muted-foreground py-12">
          No groups yet. Create your first group above.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map(group => (
            <Card key={group.id} className="border-border shadow-sm">
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-hs-blue)]/10 flex items-center justify-center flex-none">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-[var(--color-hs-blue)]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-foreground">{group.name}</h3>
                    <p className="text-[12px] text-muted-foreground">
                      {OBJECT_TYPES.find(o => o.value === group.object_type)?.label ?? group.object_type}
                      {' · '}
                      {group.property_count ?? 0} {group.property_count === 1 ? 'property' : 'properties'}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 border-border">
                    <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3">
                      Actions
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[var(--color-hs-border)]" />
                    <DropdownMenuItem
                      onClick={() => openRename(group)}
                      className="text-[13px] text-foreground focus:bg-[var(--color-hs-light-bg)] focus:text-[var(--color-hs-blue)] cursor-pointer px-3 py-2"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-[13px] text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer px-3 py-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
