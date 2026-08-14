'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { 
  Loader2, 
  Check,
  Type, 
  AlignLeft, 
  Phone, 
  Mail, 
  Link as LinkIcon, 
  FileText,
  Lock,
  CheckSquare, 
  ListChecks, 
  ToggleLeft,
  Calendar,
  Clock, 
  ChevronDownSquare, 
  CircleDot,
  Hash, 
  DollarSign, 
  Percent, 
  Star, 
  Calculator,
  RefreshCw, 
  Paperclip, 
  User, 
  UserCircle,
  Palette,
  FileBox
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldType {
  name: string;
  label: string;
  category: string;
  icon?: string;
  description?: string;
  display_order?: number;
}

const STATIC_FIELD_TYPES: FieldType[] = [
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
  { name: 'calculation', label: 'Calculation', category: 'Numeric' },
  { name: 'rollup', label: 'Rollup', category: 'Numeric' },
  { name: 'property_sync', label: 'Property sync', category: 'Numeric' },
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

interface FieldTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const getFieldTypeIcon = (type: string, className: string = "w-4 h-4") => {
  switch (type) {
    case 'single_line_text': return <Type className={className} />;
    case 'multi_line_text': return <AlignLeft className={className} />;
    case 'phone_number': return <Phone className={className} />;
    case 'email': return <Mail className={className} />;
    case 'url': return <LinkIcon className={className} />;
    case 'rich_text': return <FileText className={className} />;
    case 'single_checkbox': return <CheckSquare className={className} />;
    case 'multiple_checkboxes': return <ListChecks className={className} />;
    case 'boolean_checkbox': return <ToggleLeft className={className} />;
    case 'date_picker': return <Calendar className={className} />;
    case 'date_time_picker': return <Clock className={className} />;
    case 'dropdown_select': return <ChevronDownSquare className={className} />;
    case 'radio_select': return <CircleDot className={className} />;
    case 'number': return <Hash className={className} />;
    case 'currency': return <DollarSign className={className} />;
    case 'percent': return <Percent className={className} />;
    case 'score': return <Star className={className} />;
    case 'calculation': return <Calculator className={className} />;
    case 'rollup': return <RefreshCw className={className} />;
    case 'property_sync': return <RefreshCw className={className} />;
    case 'file': return <Paperclip className={className} />;
    case 'hubspot_user': return <User className={className} />;
    case 'owner': return <UserCircle className={className} />;
    case 'color_picker': return <Palette className={className} />;
    default: return <FileBox className={className} />;
  }
};

export default function FieldTypeSelector({
  value,
  onChange,
  placeholder = 'Select field type',
}: FieldTypeSelectorProps) {
  const [fieldTypes, setFieldTypes] = useState<FieldType[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setFieldTypes(STATIC_FIELD_TYPES);
    setLoading(false);
  }, []);

  const filteredFieldTypes = fieldTypes.filter(
    (type) =>
      type.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Group by category
  const grouped = React.useMemo(() => {
    const map: Record<string, FieldType[]> = {};
    filteredFieldTypes.forEach((type) => {
      if (!map[type.category]) map[type.category] = [];
      map[type.category].push(type);
    });
    return map;
  }, [filteredFieldTypes]);

  const selected = fieldTypes.find((t) => t.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-secondary border-border hover:bg-accent font-normal"
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5">{getFieldTypeIcon(selected.name, "w-4 h-4 text-muted-foreground/60")}</span>
              {selected.label}
            </span>
          ) : (
            <span className="text-muted-foreground/60">{placeholder}</span>
          )}
          <svg className="ml-2 h-4 w-4 shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4M8 15l4 4 4-4" />
          </svg>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0 z-[9999]" align="start">
        {loading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
          </div>
        ) : (
          <Command className="overflow-visible">
            <CommandInput
              placeholder="Search field types…"
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList
              onWheel={(e) => e.stopPropagation()}
              className="max-h-[320px] overflow-y-auto overscroll-contain"
            >
              <CommandEmpty>No field type found.</CommandEmpty>
              {Object.entries(grouped).map(([category, types]) => (
                <CommandGroup key={category} heading={category}>
                  {types.map((type) => (
                    <CommandItem
                      key={type.name}
                      value={type.name}
                      onSelect={() => {
                        onChange(type.name);
                        setOpen(false);
                        setSearchTerm('');
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className="flex items-center justify-center w-5 shrink-0">
                        {getFieldTypeIcon(type.name, "w-4 h-4 text-muted-foreground/60")}
                      </span>
                      <span className="flex-1">{type.label}</span>
                      {value === type.name && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}