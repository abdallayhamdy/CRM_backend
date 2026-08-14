"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Search, Trash2, CheckCircle2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { laravelApi } from "@/lib/laravel-api";

interface ManageAccessTabProps {
  propertyId: string;
}

type GlobalAccessType = "private_admins" | "everyone_edit" | "everyone_view" | "assign_teams_users";
type AccessLevel = "view_and_edit" | "view_only" | "no_access";

interface Assignment {
  id?: string;
  entity_type: "team" | "user";
  entity_id: string;
  access_level: AccessLevel;
}

export default function ManageAccessTab({ propertyId }: ManageAccessTabProps) {
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [globalAccess, setGlobalAccess] = useState<GlobalAccessType>("everyone_edit");

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"teams" | "users">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverSearchQuery, setPopoverSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [accessRes, teamsRes, usersRes] = await Promise.all([
        laravelApi.get<{ data: { access: any; assignments: any[] } }>(`/properties/${propertyId}/access`),
        laravelApi.get<{ data: any[] }>(`/teams`),
        laravelApi.get<any>(`/workspace/members`)
      ]);

      if (!accessRes.error && accessRes.data?.data) {
        setGlobalAccess(accessRes.data.data.access?.type || "everyone_edit");
        setAssignments(accessRes.data.data.assignments || []);
      }
      if (!teamsRes.error && Array.isArray(teamsRes.data?.data)) {
        setTeams(teamsRes.data.data.map((t: any) => ({ ...t, id: t.id, name: t.name })));
      }
      if (!usersRes.error) {
        const rawUsers = Array.isArray(usersRes.data?.data) ? usersRes.data.data : [];
        setUsers(rawUsers.map((u: any) => ({
          id: u.id,
          first_name: u.name || '',
          last_name: '',
          identifier: u.email || '',
          image_url: u.image_url || '',
        })));
      }
    } catch (error) {
      toast.error("Failed to load access data");
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGlobalAccessChange = async (value: GlobalAccessType) => {
    const previousValue = globalAccess;
    setGlobalAccess(value);
    try {
      setUpdatingStatus("saving");
      const { error } = await laravelApi.patch(`/properties/${propertyId}/access`, {
        access: { type: value },
      });
      if (error) throw new Error(error);
      
      setUpdatingStatus("saved");
      setTimeout(() => setUpdatingStatus("idle"), 2000);
    } catch (error) {
      toast.error("Could not save access settings. Reverting changes...");
      setGlobalAccess(previousValue);
      setUpdatingStatus("idle");
    }
  };

  const handleAddAssignment = async (entity_type: "team" | "user", entity_id: string) => {
    const previousAssignments = [...assignments];
    try {
      setUpdatingStatus("saving");
      const { data, error } = await laravelApi.post<{ data: { assignment: Assignment } }>(`/properties/${propertyId}/access/assignments`, {
        entity_type,
        entity_id,
        access_level: "view_and_edit",
      });
      if (error) {
        throw new Error(error);
      }
      if (data?.data?.assignment) {
        setAssignments((prev) => [...prev, data.data.assignment]);
      }
      
      setUpdatingStatus("saved");
      setTimeout(() => setUpdatingStatus("idle"), 2000);
      toast.success("Access assigned successfully");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not add assignment");
      setAssignments(previousAssignments);
      setUpdatingStatus("idle");
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    const previousAssignments = [...assignments];
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    
    try {
      setUpdatingStatus("saving");
      const { error } = await laravelApi.delete(`/properties/${propertyId}/access/assignments/${assignmentId}`);
      if (error) throw new Error(error);
      
      setUpdatingStatus("saved");
      setTimeout(() => setUpdatingStatus("idle"), 2000);
      toast.success("Assignment removed successfully");
    } catch (error) {
      toast.error("Could not remove assignment. Reverting changes...");
      setAssignments(previousAssignments);
      setUpdatingStatus("idle");
    }
  };

  const handleUpdateAssignmentLevel = async (assignmentId: string, access_level: AccessLevel) => {
    const previousAssignments = [...assignments];
    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, access_level } : a))
    );
    
    try {
      setUpdatingStatus("saving");
      const { error } = await laravelApi.patch(`/properties/${propertyId}/access/assignments/${assignmentId}`, {
        access_level,
      });
      if (error) throw new Error(error);
      
      setUpdatingStatus("saved");
      setTimeout(() => setUpdatingStatus("idle"), 2000);
    } catch (error) {
      toast.error("Could not update access level. Reverting changes...");
      setAssignments(previousAssignments);
      setUpdatingStatus("idle");
    }
  };

  const getTeamInitials = (name: string) => {
    if (!name) return "";
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getUserInitials = (firstName: string, lastName: string, identifier: string) => {
    if (firstName || lastName) {
      return ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase();
    }
    return identifier?.slice(0, 2).toUpperCase() || "US";
  };

  const getInitialsBgColor = (name: string) => {
    const colors = [
      "bg-status-info-light text-status-info dark:bg-status-info/20 dark:text-status-info border border-status-info/20 dark:border-status-info/30",
      "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border border-primary/20 dark:border-primary/30",
      "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-100 dark:border-sky-900/20",
      "bg-status-info-light text-status-info dark:bg-status-info/20 dark:text-status-info border border-status-info/20 dark:border-status-info/30",
      "bg-status-purple-light text-status-purple dark:bg-status-purple/20 dark:text-status-purple border border-status-purple/20 dark:border-status-purple/30",
      "bg-muted text-foreground dark:bg-muted dark:text-muted-foreground border border-border dark:border-border",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Loading property access settings...</span>
      </div>
    );
  }

  const unassignedTeams = teams.filter((t) => !assignments.some((a) => a.entity_type === "team" && a.entity_id === t.id));
  const unassignedUsers = users.filter((u) => !assignments.some((a) => a.entity_type === "user" && a.entity_id === u.id));

  const filteredUnassignedItems = activeTab === "teams"
    ? unassignedTeams.filter((t) => t.name.toLowerCase().includes(popoverSearchQuery.toLowerCase()))
    : unassignedUsers.filter((u) =>
        `${u.first_name || ""} ${u.last_name || ""} ${u.identifier || ""}`.toLowerCase().includes(popoverSearchQuery.toLowerCase())
      );

  const teamAssignments = assignments.filter((a) => a.entity_type === "team");
  const userAssignments = assignments.filter((a) => a.entity_type === "user");

  const filteredTeamAssignments = teamAssignments.filter((a) => {
    const team = teams.find((t) => t.id === a.entity_id);
    return (team?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredUserAssignments = userAssignments.filter((a) => {
    const user = users.find((u) => u.id === a.entity_id);
    const fullName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.identifier : "";
    return fullName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const renderTeamsContent = () => {
    if (teamAssignments.length === 0) {
      return (
        <div className="text-center py-12 px-4 text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-muted/50 mt-4 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-primary-foreground flex items-center justify-center mb-3 shadow-sm">
            <Search className="w-5 h-5 text-muted-foreground/60" />
          </div>
          <p className="font-semibold text-foreground">No teams assigned</p>
          <p className="text-[11px] text-muted-foreground mt-1">Use the "+ Add team" button to assign specific permissions.</p>
        </div>
      );
    }

    if (filteredTeamAssignments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-lg bg-muted/50 mt-4">
          <Search className="w-8 h-8 text-muted-foreground/60 mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-foreground">No results found</h3>
          <p className="text-xs text-muted-foreground mt-1">Try checking your spelling or search for something else.</p>
        </div>
      );
    }

    return (
      <div className="border border-border rounded-lg overflow-hidden bg-primary-foreground mt-4">
        <Table>
          <TableHeader className="bg-muted/50 border-b border-border">
            <TableRow>
              <TableHead className="w-1/2 text-xs font-bold text-foreground">Team</TableHead>
              <TableHead className="w-5/12 text-xs font-bold text-foreground">Access level</TableHead>
              <TableHead className="w-1/12 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {filteredTeamAssignments.map((a) => {
              const team = teams.find((t) => t.id === a.entity_id);
              const teamName = team?.name || a.entity_id;
              return (
                <TableRow key={a.id} className="hover:bg-black/5 dark:hover:bg-white/5 border-b border-muted">
                  <TableCell className="py-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getInitialsBgColor(teamName)}`}>
                      {getTeamInitials(teamName)}
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      {teamName}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <Select
                      value={a.access_level}
                      onValueChange={(val: AccessLevel) => handleUpdateAssignmentLevel(a.id!, val)}
                    >
                      <SelectTrigger className="w-[180px] h-9 border-border text-xs font-medium focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view_and_edit">View and edit</SelectItem>
                        <SelectItem value="view_only">View only</SelectItem>
                        <SelectItem value="no_access">No access</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right py-3 pr-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 p-2 h-auto rounded-md animate-in fade-in"
                      onClick={() => handleRemoveAssignment(a.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderUsersContent = () => {
    if (userAssignments.length === 0) {
      return (
        <div className="text-center py-12 px-4 text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-muted/50 mt-4 flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-primary-foreground flex items-center justify-center mb-3 shadow-sm">
            <Search className="w-5 h-5 text-muted-foreground/60" />
          </div>
          <p className="font-semibold text-foreground">No users assigned</p>
          <p className="text-[11px] text-muted-foreground mt-1">Use the "+ Add user" button to assign specific permissions.</p>
        </div>
      );
    }

    if (filteredUserAssignments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-lg bg-muted/50 mt-4">
          <Search className="w-8 h-8 text-muted-foreground/60 mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-foreground">No results found</h3>
          <p className="text-xs text-muted-foreground mt-1">Try checking your spelling or search for something else.</p>
        </div>
      );
    }

    return (
      <div className="border border-border rounded-lg overflow-hidden bg-primary-foreground mt-4">
        <Table>
          <TableHeader className="bg-muted/50 border-b border-border">
            <TableRow>
              <TableHead className="w-1/2 text-xs font-bold text-foreground">User</TableHead>
              <TableHead className="w-5/12 text-xs font-bold text-foreground">Access level</TableHead>
              <TableHead className="w-1/12 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {filteredUserAssignments.map((a) => {
              const user = users.find((u) => u.id === a.entity_id);
              const fullName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.identifier : a.entity_id;
              return (
                <TableRow key={a.id} className="hover:bg-black/5 dark:hover:bg-white/5 border-b border-muted">
                  <TableCell className="py-3 flex items-center gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={user?.image_url} />
                      <AvatarFallback className={`text-xs font-bold ${getInitialsBgColor(fullName)}`}>
                        {getUserInitials(user?.first_name || "", user?.last_name || "", user?.identifier || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {fullName}
                      </span>
                      {user?.identifier && fullName !== user.identifier && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {user.identifier}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Select
                      value={a.access_level}
                      onValueChange={(val: AccessLevel) => handleUpdateAssignmentLevel(a.id!, val)}
                    >
                      <SelectTrigger className="w-[180px] h-9 border-border text-xs font-medium focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view_and_edit">View and edit</SelectItem>
                        <SelectItem value="view_only">View only</SelectItem>
                        <SelectItem value="no_access">No access</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right py-3 pr-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 p-2 h-auto rounded-md animate-in fade-in"
                      onClick={() => handleRemoveAssignment(a.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">Manage property access</h2>
          <p className="text-sm text-muted-foreground">
            Customize the level of access users and teams have to this property.
          </p>
        </div>
        
        {/* Subtle, premium auto-save feedback indicator */}
        {updatingStatus === "saving" && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border border-border animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground/60" />
            <span>Saving...</span>
          </div>
        )}
        {updatingStatus === "saved" && (
          <div className="flex items-center gap-1.5 text-xs text-status-success dark:text-status-success bg-status-success/10 dark:bg-status-success/20 px-2 py-1 rounded-md border border-status-success/20 dark:border-status-success/30 animate-in fade-in zoom-in duration-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Saved</span>
          </div>
        )}
      </div>

      <hr className="border-border my-4" />

      {/* Radio options group (plain style - no cards, no borders, no icons) */}
      <RadioGroup
        value={globalAccess}
        onValueChange={(val: GlobalAccessType) => handleGlobalAccessChange(val)}
        className="space-y-3"
      >
        <div className="flex items-center gap-2.5">
          <RadioGroupItem value="private_admins" id="private_admins" className="data-[state=checked]:bg-primary data-[state=checked]:border-primary text-primary border-border focus:ring-primary" />
          <Label htmlFor="private_admins" className="text-sm font-normal text-foreground cursor-pointer select-none">
            Private to super admins only
          </Label>
        </div>

        <div className="flex items-center gap-2.5">
          <RadioGroupItem value="everyone_edit" id="everyone_edit" className="data-[state=checked]:bg-primary data-[state=checked]:border-primary text-primary border-border focus:ring-primary" />
          <Label htmlFor="everyone_edit" className="text-sm font-normal text-foreground cursor-pointer select-none">
            Allow everyone to view and edit
          </Label>
        </div>

        <div className="flex items-center gap-2.5">
          <RadioGroupItem value="everyone_view" id="everyone_view" className="data-[state=checked]:bg-primary data-[state=checked]:border-primary text-primary border-border focus:ring-primary" />
          <Label htmlFor="everyone_view" className="text-sm font-normal text-foreground cursor-pointer select-none">
            Allow everyone to view
          </Label>
        </div>

        <div className="flex items-center gap-2.5">
          <RadioGroupItem value="assign_teams_users" id="assign_teams_users" className="data-[state=checked]:bg-primary data-[state=checked]:border-primary text-primary border-border focus:ring-primary" />
          <Label htmlFor="assign_teams_users" className="text-sm font-normal text-foreground cursor-pointer select-none">
            Assign to users and teams
          </Label>
        </div>
      </RadioGroup>

      {/* Specific assignments section (only visible when 'Assign to users and teams' is selected) */}
      {globalAccess === "assign_teams_users" && (
        <div className="space-y-6 pl-6 border-l-2 border-border py-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* Sub-tabs switcher (underline style, not pills) */}
          <div className="border-b border-border flex gap-6">
            <button
              type="button"
              onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
              className={`pb-3 text-sm font-semibold relative transition-colors ${
                activeTab === "users"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Users
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab("teams"); setSearchQuery(""); }}
              className={`pb-3 text-sm font-semibold relative transition-colors ${
                activeTab === "teams"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Teams
            </button>
          </div>

          {/* Search & Add Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-sm border-border focus-visible:ring-primary"
              />
            </div>

            <Popover open={popoverOpen} onOpenChange={(open) => { setPopoverOpen(open); if (!open) setPopoverSearchQuery(""); }}>
              <PopoverTrigger asChild>
                <Button
                  className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-md px-4 py-2 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>+ Add {activeTab === "teams" ? "team" : "user"}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 border border-border shadow-xl rounded-lg overflow-hidden bg-primary-foreground" align="end">
                <div className="p-3 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                    <Input
                      type="text"
                      placeholder={activeTab === "teams" ? "Search teams to add..." : "Search users to add..."}
                      value={popoverSearchQuery}
                      onChange={(e) => setPopoverSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 h-8 text-xs border-border focus-visible:ring-primary"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto p-1 divide-y divide-muted">
                  {filteredUnassignedItems.length > 0 ? (
                    filteredUnassignedItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          handleAddAssignment(activeTab === "teams" ? "team" : "user", item.id);
                          setPopoverSearchQuery("");
                          setPopoverOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {activeTab === "teams" ? (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${getInitialsBgColor(item.name)}`}>
                              {getTeamInitials(item.name)}
                            </div>
                          ) : (
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage src={item.image_url} />
                              <AvatarFallback className={`text-[10px] font-bold ${getInitialsBgColor(`${item.first_name || ""} ${item.last_name || ""}`.trim() || item.identifier)}`}>
                                {getUserInitials(item.first_name || "", item.last_name || "", item.identifier || "")}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className="text-xs font-medium text-foreground truncate">
                            {activeTab === "teams"
                              ? item.name
                              : `${item.first_name || ""} ${item.last_name || ""}`.trim() || item.identifier
                            }
                          </span>
                        </div>
                        <span className="text-[11px] text-primary font-semibold shrink-0 ml-2 hover:underline">+ Add</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground/60">
                      No unassigned {activeTab === "teams" ? "teams" : "users"} found.
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Assignments Tables */}
          <div className="animate-in fade-in duration-300">
            {activeTab === "teams" ? renderTeamsContent() : renderUsersContent()}
          </div>
        </div>
      )}
    </div>
  );
}
