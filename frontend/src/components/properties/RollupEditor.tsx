"use client";

import React, { useState, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { PropertyFormState } from "./CreatePropertyFormState";

interface RollupEditorProps {
  form: PropertyFormState;
  setForm: React.Dispatch<React.SetStateAction<PropertyFormState>>;
}

const RECORD_TYPES = [
  'Call', 'Campaign', 'Cart', 'Company', 'Contact',
  'Credit memo', 'Deal', 'Invoice', 'Meeting', 'Order',
  'Payment', 'Quote', 'Subscription', 'Ticket'
];

const ROLLUP_DESCRIPTIONS: Record<string, string> = {
  min: 'The lowest value of this property for your object type.',
  max: 'The highest value of this property for your object type.',
  count: 'A count of object type records with a value in the property you choose.',
  sum: 'The sum of the values in this property.',
  average: 'The average of the values in this property.',
  earliest_date: 'The earliest date value of this property for your object type.',
  latest_date: 'The latest date value of this property for your object type.',
};

export function RollupEditor({ form, setForm }: RollupEditorProps) {
  const [rollupRecordOpen, setRollupRecordOpen] = useState(false);
  const [rollupNumberFormatOpen, setRollupNumberFormatOpen] = useState(false);
  const rollupNumberFormatRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-6">
      <p className="text-sm">
        <a href="#" className="text-status-success underline font-medium">Learn more</a>
        {' '}about rollup properties and what you can build with them.
      </p>

      {/* Rollup type */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Rollup type</label>
        <p className="text-xs text-muted-foreground">
          {ROLLUP_DESCRIPTIONS[form.rollup_type] || ''}
        </p>
        <select
          value={form.rollup_type}
          onChange={e => setForm(p => ({ ...p, rollup_type: e.target.value as any }))}
          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="min">Min</option>
          <option value="max">Max</option>
          <option value="count">Count</option>
          <option value="sum">Sum</option>
          <option value="average">Average</option>
          <option value="earliest_date">Earliest date</option>
          <option value="latest_date">Latest date</option>
        </select>
      </div>

      {/* Number format — only for numeric rollup types */}
      {['min', 'max', 'count', 'sum', 'average'].includes(form.rollup_type) && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Number format *</label>
          {(() => {
            const ROLLUP_NUMBER_FORMATS = [
              { value: 'formatted', label: 'Formatted number', description: 'Format your property as a number' },
              { value: 'unformatted', label: 'Unformatted number', description: 'Remove formatting from your property' },
              { value: 'currency', label: 'Currency', description: 'Format your property as a currency' },
              { value: 'percentage', label: 'Percentage', description: 'Format your property as a percentage' },
              { value: 'duration', label: 'Duration', description: 'Format your property as a duration' },
            ];
            return (
              <div className="relative" ref={rollupNumberFormatRef}>
                <button
                  type="button"
                  onClick={() => setRollupNumberFormatOpen(!rollupNumberFormatOpen)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <span>{ROLLUP_NUMBER_FORMATS.find(f => f.value === form.rollup_number_format)?.label}</span>
                  <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
                </button>
                {rollupNumberFormatOpen && (
                  <div className="absolute z-[200] w-full border rounded-md bg-background shadow-md mt-1">
                    {ROLLUP_NUMBER_FORMATS.map(opt => (
                      <div
                        key={opt.value}
                        onClick={() => {
                          setForm(p => ({ ...p, rollup_number_format: opt.value }));
                          setRollupNumberFormatOpen(false);
                        }}
                        className={`px-3 py-2 cursor-pointer hover:bg-muted ${form.rollup_number_format === opt.value ? 'bg-muted/50' : ''}`}
                      >
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Date display format — only for date rollup types */}
      {['earliest_date', 'latest_date'].includes(form.rollup_type) && (
        <div className="space-y-3">
          <p className="font-medium text-sm">How should this date appear on records?</p>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="rollup_date_format"
              value="date_only"
              checked={form.rollup_date_format === 'date_only'}
              onChange={() => setForm(p => ({ ...p, rollup_date_format: 'date_only' }))}
              className="mt-1"
            />
            <div>
              <p className="text-sm font-medium">Show date only</p>
              <p className="text-xs text-muted-foreground">
                Example: {new Date().toLocaleDateString('en-US', { month:'2-digit', day:'2-digit', year:'numeric' }).replace(/\//g, '-')}
              </p>
            </div>
          </label>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="rollup_date_format"
              value="date_relative"
              checked={form.rollup_date_format === 'date_relative'}
              onChange={() => setForm(p => ({ ...p, rollup_date_format: 'date_relative' }))}
              className="mt-1"
            />
            <div>
              <p className="text-sm font-medium">Show date with relative time</p>
              <p className="text-xs text-muted-foreground">
                Example: {new Date().toLocaleDateString('en-US', { month:'2-digit', day:'2-digit', year:'numeric' }).replace(/\//g, '-')} (15 days ago)
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Associated record type — always shown */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Choose the associated record type *</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setRollupRecordOpen(o => !o)}
            className="w-full border rounded-md px-3 py-2 flex justify-between items-center text-sm bg-background"
          >
            {form.rollup_associated_record_type || <span className="text-muted-foreground">Search</span>}
            <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
          </button>
          {rollupRecordOpen && (
            <div className="absolute z-50 w-full border rounded-md bg-background shadow-md mt-1">
              <div className="p-2 border-b">
                <input
                  autoFocus
                  placeholder="Search"
                  value={form.rollup_record_search}
                  onChange={e => setForm(p => ({ ...p, rollup_record_search: e.target.value }))}
                  className="w-full outline-none text-sm px-2 py-1 border rounded-full"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {RECORD_TYPES
                  .filter(r => r.toLowerCase().includes(form.rollup_record_search.toLowerCase()))
                  .map(r => (
                    <div
                      key={r}
                      onClick={() => {
                        setForm(p => ({ ...p, rollup_associated_record_type: r, rollup_record_search: '' }));
                        setRollupRecordOpen(false);
                      }}
                      className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                    >
                      {r}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
