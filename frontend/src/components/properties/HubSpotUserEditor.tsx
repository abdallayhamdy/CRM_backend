"use client";

import React from "react";
import { Search } from "lucide-react";
import { PropertyFormState } from "./CreatePropertyFormState";

interface HubSpotUserEditorProps {
  form: PropertyFormState;
  setForm: React.Dispatch<React.SetStateAction<PropertyFormState>>;
  workspaceMembers: { id: string; label: string; internal_name: string; with_value: number }[];
}

export function HubSpotUserEditor({ form, setForm, workspaceMembers }: HubSpotUserEditorProps) {
  return (
    <div className="space-y-4">
      {/* How many users */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">How many users can be selected? *</p>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="user_selection_type"
            value="single"
            checked={form.user_selection_type === 'single'}
            onChange={() => setForm(p => ({ ...p, user_selection_type: 'single', show_multiple_users_confirm: false }))}
            className="mt-0.5"
          />
          <span className="text-sm">Only one user can be selected</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="user_selection_type"
            value="multiple"
            checked={form.user_selection_type === 'multiple' || form.show_multiple_users_confirm}
            onChange={() => setForm(p => ({ ...p, show_multiple_users_confirm: true }))}
            className="mt-0.5"
          />
          <span className="text-sm">Multiple users can be selected</span>
        </label>
      </div>

      {/* Inline confirmation for multiple users */}
      {form.show_multiple_users_confirm && (
        <div className="border border-destructive/30 bg-destructive/10 dark:bg-destructive/20 rounded-md p-4 space-y-3">
          <p className="text-sm font-semibold">Allow multiple users?</p>
          <p className="text-sm text-muted-foreground">
            Once you create or update this property to allow multiple users to be selected, it cannot be changed back to only one user.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setForm(p => ({ ...p, user_selection_type: 'multiple', show_multiple_users_confirm: false }))}
              className="flex-1 bg-destructive text-white rounded-md px-3 py-1.5 text-sm font-medium hover:bg-destructive/90">
              Allow multiple users
            </button>
            <button
              onClick={() => setForm(p => ({ ...p, user_selection_type: 'single', show_multiple_users_confirm: false }))}
              className="flex-1 border rounded-md px-3 py-1.5 text-sm font-medium hover:bg-muted">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Info text */}
      <p className="text-sm text-muted-foreground">
        Manage your SalesHub users and teams{' '}
        <a href="#" className="font-semibold underline">here.</a>
        {' '}Users selected for this property will be treated as record owners, and will have the same edit permissions to the record that an owner would have. Other users on their teams may also be able to edit the record based on their permissions.
      </p>

      {/* Search options */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Search options</p>
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={form.user_search}
            onChange={e => setForm(p => ({ ...p, user_search: e.target.value }))}
            className="w-full border rounded-full px-4 py-2 text-sm outline-none pr-10"
          />
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
        </div>

        {/* Users table */}
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="text-left px-4 py-2 font-medium">Label</th>
                <th scope="col" className="text-left px-4 py-2 font-medium">Internal name</th>
                <th scope="col" className="text-left px-4 py-2 font-medium">With value</th>
              </tr>
            </thead>
            <tbody>
              {workspaceMembers
                .filter(m => m.label.toLowerCase().includes(form.user_search.toLowerCase()))
                .map(m => (
                  <tr key={m.id} className="border-t">
                    <td className="px-4 py-2">{m.label}</td>
                    <td className="px-4 py-2 text-muted-foreground">{m.internal_name}</td>
                    <td className="px-4 py-2">{m.with_value}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 text-sm">
          <button type="button" className="text-muted-foreground hover:text-foreground">‹ Prev</button>
          <button type="button" className="text-muted-foreground hover:text-foreground">Next ›</button>
        </div>
      </div>
    </div>
  );
}
