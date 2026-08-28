"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ExternalLink, GripVertical, Info, Trash2, Loader2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
import { ColorPickerPopover } from '@/components/ui/color-picker-popover';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useObjectConfig } from '@/hooks/use-object-config';
import { ObjectType } from '@/lib/default-object-configs';
import { toast } from 'sonner';

const OBJECT_TYPES = [
  { value: 'contact', label: 'Contacts', icon: '👤', description: 'Any person who interacts with a business.', singular: 'Contact' },
  { value: 'company', label: 'Companies', icon: '', description: 'Any organization that interacts with a business.', singular: 'Company' },
  { value: 'deal', label: 'Deals', icon: '💰', description: 'A deal represents a potential sale or transaction.', singular: 'Deal' },
  { value: 'ticket', label: 'Tickets', icon: '🎫', description: 'A ticket represents a customer service request or issue.', singular: 'Ticket' },
  { value: 'product', label: 'Products', icon: '📦', description: 'A product represents an item or service you sell.', singular: 'Product' },
  { value: 'order', label: 'Orders', icon: '', description: 'An order represents a confirmed purchase request.', singular: 'Order' },
  { value: 'document', label: 'Documents', icon: '📄', description: 'A document represents a file or attachment stored in the CRM.', singular: 'Document' },
  { value: 'call', label: 'Calls', icon: '📞', description: 'A call represents a phone conversation logged in the CRM.', singular: 'Call' },
  { value: 'note', label: 'Notes', icon: '📝', description: 'A note represents a free-form text entry about a record.', singular: 'Note' },
  { value: 'task', label: 'Tasks', icon: '✅', description: 'A task represents an action item to be completed.', singular: 'Task' },
];

interface StageItem {
  id: string
  name: string
  color: string
  order: number
  is_active: boolean
  calculated_props: boolean
  used_in: number
}

function SortableStageRow({
  stage,
  displayStyle,
  updateStage,
  deleteStage,
}: {
  stage: StageItem
  displayStyle: string
  updateStage: (id: string, updates: Partial<StageItem>) => void
  deleteStage: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <tr ref={setNodeRef} style={style} className={cn("hover:bg-muted/10", isDragging && "z-50 opacity-50 bg-muted")}>
      <td className="px-3 py-2.5">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </td>
      <td className="px-3 py-2.5">
        <input
          value={stage.name}
          onChange={e => updateStage(stage.id, { name: e.target.value })}
          className="w-full px-3 py-1.5 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-background"
        />
      </td>
      {displayStyle !== 'no_color' && (
        <td className="px-3 py-2.5">
          <ColorPickerPopover
            currentColor={stage.color}
            onSelect={(hex) => updateStage(stage.id, { color: hex })}
            onReset={() => updateStage(stage.id, { color: '#3b82f6' })}
          >
            <div
              className="w-8 h-8 rounded-full border-2 border-border shadow-md cursor-pointer"
              style={{ backgroundColor: stage.color }}
            />
          </ColorPickerPopover>
        </td>
      )}
      <td className="px-3 py-2.5">
        <button
          type="button"
          role="switch"
          aria-checked={stage.calculated_props}
          onClick={() => updateStage(stage.id, { calculated_props: !stage.calculated_props })}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            stage.calculated_props
              ? "bg-primary"
              : "bg-input"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out",
              stage.calculated_props
                ? "translate-x-5"
                : "translate-x-0"
            )}
          />
        </button>
      </td>
      <td className="px-3 py-2.5 text-sm">
        <span className="text-muted-foreground">{stage.used_in}</span>
      </td>
      <td className="px-3 py-2.5 text-sm text-muted-foreground font-mono truncate">
        {stage.name.toLowerCase().replace(/\s+/g, '')}
      </td>
      <td className="px-3 py-2.5 text-center">
        <button
          onClick={() => deleteStage(stage.id)}
          className="text-destructive hover:text-destructive dark:hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  )
}

export default function ObjectsPage() {
  const searchParams = useSearchParams();
  const requestedObject = searchParams.get('object_type') as ObjectType | null;
  const initialObject = requestedObject && OBJECT_TYPES.some(o => o.value === requestedObject)
    ? requestedObject
    : 'contact';

  const [selectedObject, setSelectedObject] = useState<ObjectType>(initialObject);
  const [activeTab, setActiveTab] = useState('lifecycle');

  const {
    stages, displayStyle, loading, saving, hasChanges,
    save, addStage, updateStage, deleteStage, reorderStages,
    resetToDefaults, updateDisplayStyle
  } = useObjectConfig(selectedObject);

  const currentObject = OBJECT_TYPES.find(o => o.value === selectedObject) || OBJECT_TYPES[0];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleStageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeStage = stages.find(s => s.id === active.id)
    const overStage = stages.find(s => s.id === over.id)
    if (!activeStage || !overStage) return
    const activeStages = stages.filter(s => s.is_active && s.id).sort((a, b) => a.order - b.order)
    const oldIndex = activeStages.findIndex(s => s.id === active.id)
    const newIndex = activeStages.findIndex(s => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(activeStages, oldIndex, newIndex)
    const nonActive = stages.filter(s => !s.is_active)
    reorderStages([...reordered, ...nonActive])
  };

  const handleSave = async () => {
    const success = await save();
    if (success) toast.success(`${currentObject.label} lifecycle stages saved`);
    else toast.error("Failed to save");
  };

  const tabs = [
    { value: 'lifecycle', label: 'Lifecycle Stage' },
  ];

  return (
    <div className="space-y-0 pb-32">
      {/* Page Header */}
      <h1 className="text-[18px] font-bold text-foreground mb-4">Objects</h1>

      {/* Object Selector */}
      <div className="border border-border rounded-md p-3 bg-background mb-0">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-foreground">Select an object:</span>
          <Select value={selectedObject} onValueChange={(val) => {
            setSelectedObject(val as ObjectType);
          }}>
            <SelectTrigger className="w-[180px] border-border focus:ring-primary h-8 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OBJECT_TYPES.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <span>{opt.icon}</span>
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-border mt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent rounded-none border-b-0 p-0 h-auto -mb-px">
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border border-border border-b-0 bg-muted/50 data-[state=active]:bg-primary-foreground data-[state=active]:border-b-card data-[state=active]:text-foreground data-[state=active]:font-bold text-[12px] font-medium px-3 py-2 text-muted-foreground hover:text-foreground transition-colors -mb-px relative top-[1px]"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Link
          href={`/settings/properties?object_type=${selectedObject}`}
          className="text-[12px] text-primary font-bold hover:underline whitespace-nowrap ml-4"
        >
          View {currentObject.label} in the data model <ExternalLink className="w-3 h-3 inline ml-0.5" />
        </Link>
      </div>

      {/* Tab Content Area */}
      <div className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* ── Lifecycle Stage Tab ── */}
          <TabsContent value="lifecycle" className="mt-0 outline-none">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Track contacts as they move through your marketing and sales processes.
              </p>

              <h3 className="text-sm font-bold text-foreground">Customize lifecycle stages</h3>

              {/* Display Color Style Selector */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Set lifecycle stage display colors</span>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateDisplayStyle('no_color')}
                    className={cn(
                      "px-4 py-2 text-sm border rounded-md transition-all",
                      displayStyle === 'no_color'
                        ? "border-primary bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary font-semibold shadow-sm"
                        : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted"
                    )}
                  >
                    Text (no color)
                  </button>
                  <button
                    onClick={() => updateDisplayStyle('colored_dot')}
                    className={cn(
                      "px-4 py-2 text-sm border rounded-md transition-all flex items-center gap-2",
                      displayStyle === 'colored_dot'
                        ? "border-primary bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary font-semibold shadow-sm"
                        : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "w-3 h-3 rounded-full transition-colors",
                      displayStyle === 'colored_dot' ? "bg-primary/50" : "bg-muted-foreground"
                    )} />
                    Text with colored dot
                  </button>
                  <button
                    onClick={() => updateDisplayStyle('colored_badge')}
                    className={cn(
                      "px-4 py-2 text-sm border rounded-md transition-all",
                      displayStyle === 'colored_badge'
                        ? "border-primary bg-primary/50 text-white font-semibold shadow-sm"
                        : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted"
                    )}
                  >
                    Text in colored badge
                  </button>
                </div>
              </div>

              {/* Shared Settings Info Box */}
              {(selectedObject === 'contact' || selectedObject === 'company') && (
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/30 dark:border-primary/30 rounded-lg p-4 mb-4 text-sm">
                  <span className="font-semibold">Contacts and Companies share some Configure settings.</span>
                  {' '}Changing stage name or color, or toggling stage calculated properties on Contacts will also change them on Companies. Conditional logic rules are separate for Contacts and Companies.
                </div>
              )}

              {/* Stages Table */}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleStageDragEnd}>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full table-fixed min-w-[720px]">
                    <thead>
                      <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                        <th scope="col" className="w-10 p-3"></th>
                        <th scope="col" className="text-left p-3 font-medium w-[280px]">Stage name</th>
                        {displayStyle !== 'no_color' && (
                          <th scope="col" className="text-left p-3 font-medium w-16">Color</th>
                        )}
                        <th scope="col" className="text-left p-3 font-medium w-[200px]">Calculated properties</th>
                        <th scope="col" className="text-left p-3 font-medium w-20">Used in</th>
                        <th scope="col" className="text-left p-3 font-medium w-[180px]">Stage ID</th>
                        <th scope="col" className="text-center p-3 font-medium w-16">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loading ? (
                        <tr>
                          <td colSpan={displayStyle !== 'no_color' ? 7 : 6} className="p-4">
                            <div className="space-y-3">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-4 py-2">
                                  <Skeleton className="w-5 h-5 rounded" />
                                  <Skeleton className="w-4 h-4 rounded-full" />
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-4 w-20" />
                                  <div className="flex-1" />
                                  <Skeleton className="h-8 w-8 rounded-md" />
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        (() => {
                          const activeStages = stages.filter(s => s.is_active && s.id).sort((a, b) => a.order - b.order)
                          return (
                            <SortableContext items={activeStages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                              {activeStages.map((stage) => (
                                <SortableStageRow
                                  key={stage.id}
                                  stage={stage}
                                  displayStyle={displayStyle}
                                  updateStage={updateStage}
                                  deleteStage={deleteStage}
                                />
                              ))}
                            </SortableContext>
                          )
                        })()
                      )}
                    </tbody>
                  </table>
                  <div className="p-3 border-t">
                    <button
                      onClick={() => addStage('New Stage', '#71717A')}
                      className="text-sm text-primary dark:text-primary hover:underline flex items-center gap-1"
                    >
                       Add stage
                    </button>
                  </div>
                </div>
              </DndContext>
            </div>
          </TabsContent>

        </Tabs>
      </div>

      {/* Floating Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 bg-background shadow-xl border border-border rounded-lg p-3 z-50">
          <Button variant="outline" size="sm" onClick={resetToDefaults} className="h-8 text-[12px] border-border font-bold">
            Reset to defaults
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 text-[12px] font-bold bg-primary hover:bg-primary/90 text-primary-foreground">
            {saving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving...</> : "Save changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
