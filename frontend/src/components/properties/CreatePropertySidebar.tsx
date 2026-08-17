"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  Search,
  ChevronDown,
  Plus,
  Lock,
  ExternalLink,
  Filter,
  SlidersHorizontal,
  Database,
  Trash2,
  Edit3,
  Eye,
  MoreHorizontal,
  CheckCircle,
  Info,
  CheckCircle2,
  List,
  Loader2,
  Shield,
  ShieldCheck,
  Settings2,
  Zap,
  Activity,
  Layout,
  RefreshCw,
  TextCursor,
  Folder,
  FileText,
  Type,
  CircleHelp,
  Square,
  Space,
  Circle,
  MapPin,
  CircleDashed,
  AlertTriangle,
  Phone,
  Mail,
  Link2,
  CheckSquare,
  Check,
  Calendar,
  Clock,
  Paperclip,
  Calculator,
  ToggleLeft,
  DollarSign,
  Percent,
  Star,
  Palette,
  CircleDot,
  User,
  GripVertical,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator, Separator as SeparatorUI } from "@/components/ui/separator";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, VisuallyHidden } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import FieldTypeSelector from "@/components/properties/FieldTypeSelector";

import { OBJECT_TYPES, OBJECT_TYPE_GROUPS } from "@/lib/crm-constants";
import { laravelApi } from "@/lib/laravel-api";

import { PropertyFormState } from "./CreatePropertyFormState";
import { STEPS, CALC_DATE_PROPERTIES, FORMULA_FUNCTIONS } from "./CreatePropertyConstants";
import { PropertyRichTextEditor } from "./PropertyRichTextEditor";
import { PropertySearchDropdown } from "./PropertySearchDropdown";

import { DetailsStep } from "./DetailsStep";
import { RulesStep } from "./RulesStep";
import { ManageAccessStep } from "./ManageAccessStep";
import { PreviewStep } from "./PreviewStep";
import { CalculationEditor } from "./CalculationEditor";
import { RollupEditor } from "./RollupEditor";
import { HubSpotUserEditor } from "./HubSpotUserEditor";
import { FileFieldEditor } from "./FileFieldEditor";
// ──────────────────────────────────────────────────────────────────────────────

export interface CreatePropertySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  objectType: string;
  onCreated: () => void;
}

export default function CreatePropertySidebar({
  isOpen,
  onClose,
  objectType,
  onCreated,
}: CreatePropertySidebarProps) {
  const { workspaceId } = useAuth();
  const [fieldTypes, setFieldTypes] = useState<
    Array<{
      value: string;
      label: string;
      icon: React.ReactNode;
      locked?: boolean;
    }>
  >([]);
  const [fieldTypesLoading, setFieldTypesLoading] = useState(true);

  const router = useRouter();
  const [step, setStep] = useState<
    "details" | "field-type" | "rules" | "manage-access" | "preview"
  >("details");
  const [defaultValuesDropdownOpen, setDefaultValuesDropdownOpen] = useState(false);
  const defaultValuesBtnRef = useRef<HTMLButtonElement>(null);
  const defaultValuesDropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // ── Formula toolbar dropdowns ──────────────────────────────────────────────
  const [workspaceMembers, setWorkspaceMembers] = useState<{id: string, label: string, internal_name: string, with_value: number}[]>([]);

  // ── Number format dropdowns ────────────────────────────────────────────────
  const [numberFormatOpen, setNumberFormatOpen] = useState(false);
  const numberFormatRef = useRef<HTMLDivElement>(null);

  // ── Load options popover ────────────────────────────────────────────────────
  const [loadOptionsOpen, setLoadOptionsOpen] = useState(false);
  const [loadOptionsTab, setLoadOptionsTab] = useState<'presets' | 'paste' | 'from_property'>('presets');
  const [pasteOptionsText, setPasteOptionsText] = useState('');
  const [pasteDelimiter, setPasteDelimiter] = useState('');
  const [loadPreset, setLoadPreset] = useState('');
  const [fromPropertyObjectType, setFromPropertyObjectType] = useState('');
  const [fromPropertySelected, setFromPropertySelected] = useState('');
  const loadOptionsRef = useRef<HTMLDivElement>(null);
  const [rollupRecordOpen, setRollupRecordOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (numberFormatRef.current && !numberFormatRef.current.contains(e.target as Node)) {
        setNumberFormatOpen(false);
      }
      if (loadOptionsRef.current && !loadOptionsRef.current.contains(e.target as Node)) {
        setLoadOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────

  const [form, setForm] = useState<PropertyFormState>({
    object_type: objectType,
    label: "",
    description: "",
    group_name: "",
    field_type: "single_line_text",
    default_value: null,
    showInForms: true,
    isRequired: false,
    require_unique: false,
    require_min_chars: false,
    min_chars: null,
    limit_max_chars: false,
    max_chars: null,
    auto_remove_disallowed: false,
    allowed_characters: "all",
    allowed_spaces: "all",
    case_sensitivity: "not_sensitive",
    numberFormat: 'formatted',
    dateDisplayFormat: 'date_only',
    date_display_format: 'date_time_only',
    options: [],
    // multiple_checkboxes specific fields
    checkboxOptions: [],
    checkboxDefaultValue: '',
    checkboxOptionStyle: 'default',
    checkboxSearch: '',
    checkboxSort: 'search',
    option_style: 'default',
    checkbox_options: [],
    checkbox_search: '',
    checkbox_sort: 'custom',
    checkbox_default_values: [],
    datetime_display_format: 'date_time_only',
    datetime_default_date: '',
    datetime_default_time: '',
    dropdown_option_style: 'default',
    dropdown_options: [],
    dropdown_search: '',
    dropdown_sort: 'custom',
    dropdown_default_value: '',
    radio_option_style: 'default',
    radio_options: [],
    radio_search: '',
    radio_sort: 'custom',
    radio_default_value: '',
    calc_property_type: 'custom_equation',
    calc_output_type: 'number',
    calc_number_format: 'formatted',
    calc_start_date_property: '',
    calc_end_date_property: '',
    calc_start_date_search: '',
    calc_end_date_search: '',
    calc_formula: '',
    rollup_type: 'min',
    rollup_number_format: 'formatted',
    rollup_associated_record_type: '',
    rollup_record_search: '',
    rollup_date_format: 'date_only',
    user_selection_type: 'single',
    user_search: '',
    show_multiple_users_confirm: false,
    file_access: 'private',
    internal_name_override: null,
  });

  const [groups, setGroups] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [newOption, setNewOption] = useState({ label: "", value: "" });

  // Fetch workspace members when hubspot_user field type is selected
  useEffect(() => {
    if (form.field_type !== 'hubspot_user' || !workspaceId) return;
    
    const fetchMembers = async () => {
      try {
        const { data, error } = await laravelApi.get<{ data: any[] }>(`/workspace/members`);
        if (error || !data) return;
        const members = (data as any)?.data || [];
        setWorkspaceMembers(members.map((m: any) => ({
          id: m.id,
          label: m.name || m.email,
          internal_name: m.name || m.email,
          with_value: 0
        })));
      } catch (err) {
        console.error('Failed to fetch workspace members:', { message: (err as Error)?.message });
      }
    };
    
    fetchMembers();
  }, [form.field_type, workspaceId]);

  // Close the default-values dropdown when clicking outside
  useEffect(() => {
    if (!defaultValuesDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const btn = defaultValuesBtnRef.current;
      const panel = defaultValuesDropdownRef.current;
      if (btn && btn.contains(e.target as Node)) return;
      if (panel && panel.contains(e.target as Node)) return;
      setDefaultValuesDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [defaultValuesDropdownOpen]);

  const openDefaultValuesDropdown = useCallback(() => {
    if (!defaultValuesBtnRef.current) return;
    const rect = defaultValuesBtnRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    setDefaultValuesDropdownOpen(v => !v);
  }, []);


  useEffect(() => {
    fetchGroups(objectType);
    fetchFieldTypes();
    setForm((prev) => ({
      ...prev,
      object_type: objectType,
      label: "",
      description: "",
      group_name: "",
      field_type: "single_line_text",
      default_value: null,
      showInForms: true,
      isRequired: false,
      require_unique: false,
      require_min_chars: false,
      min_chars: null,
      limit_max_chars: false,
      max_chars: null,
      auto_remove_disallowed: false,
      allowed_characters: "all",
      allowed_spaces: "all",
      case_sensitivity: "not_sensitive",
      numberFormat: 'formatted',
      dateDisplayFormat: 'date_only',
      date_display_format: 'date_time_only',
      options: [],
      // multiple_checkboxes specific fields
      checkboxOptions: [],
      checkboxDefaultValue: '',
      checkboxOptionStyle: 'default',
      checkboxSearch: '',
      checkboxSort: 'search',
      option_style: 'default',
      checkbox_options: [],
      checkbox_search: '',
      checkbox_sort: 'custom',
      checkbox_default_values: [],
      datetime_display_format: 'date_time_only',
      datetime_default_date: '',
      datetime_default_time: '',
      dropdown_option_style: 'default',
      dropdown_options: [],
      dropdown_search: '',
      dropdown_sort: 'custom',
      dropdown_default_value: '',
      radio_option_style: 'default',
      radio_options: [],
      radio_search: '',
      radio_sort: 'custom',
      radio_default_value: '',
      calc_property_type: 'custom_equation',
      calc_output_type: 'number',
      calc_number_format: 'formatted',
        calc_start_date_property: '',
      calc_end_date_property: '',
      calc_start_date_search: '',
      calc_end_date_search: '',
      rollup_type: 'min',
      rollup_number_format: 'formatted',
      rollup_associated_record_type: '',
      rollup_record_search: '',
      rollup_date_format: 'date_only',
      user_selection_type: 'single',
      user_search: '',
      show_multiple_users_confirm: false,
      file_access: 'private',
      manuallyEditedInternalNames: new Set(),
    }));

    // Reset formula tokens when object type changes
  }, [objectType]);

  const fetchFieldTypes = async () => {
    try {
      setFieldTypes([
        { value: "single_line_text", label: "Single-line text", icon: <Type className="w-4 h-4" /> },
        { value: "multi_line_text", label: "Multi-line text", icon: <FileText className="w-4 h-4" /> },
        { value: "rich_text", label: "Rich text", icon: <Layout className="w-4 h-4" /> },
        { value: "number", label: "Number", icon: <Database className="w-4 h-4" /> },
        { value: "phone_number", label: "Phone number", icon: <Phone className="w-4 h-4" /> },
        { value: "email", label: "Email", icon: <Mail className="w-4 h-4" /> },
        { value: "url", label: "URL", icon: <Link2 className="w-4 h-4" /> },
        { value: "dropdown_select", label: "Dropdown select", icon: <List className="w-4 h-4" /> },
        { value: "radio_select", label: "Radio select", icon: <CircleDot className="w-4 h-4" /> },
        { value: "multiple_checkboxes", label: "Multiple checkboxes", icon: <CheckSquare className="w-4 h-4" /> },
        { value: "single_checkbox", label: "Single checkbox", icon: <Check className="w-4 h-4" /> },
        { value: "boolean_checkbox", label: "Boolean checkbox", icon: <ToggleLeft className="w-4 h-4" /> },
        { value: "date_picker", label: "Date picker", icon: <Calendar className="w-4 h-4" /> },
        { value: "date_time_picker", label: "Date and time picker", icon: <Clock className="w-4 h-4" /> },
        { value: "file", label: "File", icon: <Paperclip className="w-4 h-4" /> },
        { value: "property_sync", label: "Property sync", icon: <RefreshCw className="w-4 h-4" />, locked: true },
        { value: "owner", label: "HubSpot owner", icon: <User className="w-4 h-4" /> },
        { value: "calculation", label: "Calculation", icon: <Calculator className="w-4 h-4" />, locked: true },
        { value: "rollup", label: "Rollup", icon: <RefreshCw className="w-4 h-4" /> },
        { value: "currency", label: "Currency", icon: <DollarSign className="w-4 h-4" /> },
        { value: "percent", label: "Percent", icon: <Percent className="w-4 h-4" /> },
        { value: "score", label: "Score", icon: <Star className="w-4 h-4" /> },
        { value: "color_picker", label: "Color picker", icon: <Palette className="w-4 h-4" /> },
      ]);
    } catch (error) {
      console.error("Failed to set field types:", { message: (error as Error)?.message });
    } finally {
      setFieldTypesLoading(false);
    }
  };

  const fetchGroups = async (type: string) => {
    try {
      const { data, error } = await laravelApi.get<{ properties: any[]; meta: any }>(
        '/properties',
        { object_type: type, limit: 500 },
      );
      if (!error && data?.properties && Array.isArray(data.properties)) {
        const groupNames = [...new Set(data.properties
          .map((p: any) => p.group_name)
          .filter(Boolean)
        )];
        setGroups(groupNames);
      } else {
        setGroups(OBJECT_TYPE_GROUPS[type] || []);
      }
    } catch (error) {
      console.error("Failed to fetch groups:", { message: (error as Error)?.message });
      setGroups(OBJECT_TYPE_GROUPS[type] || []);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" && !value ? null : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    if (value !== "calculation") {
      }
    setForm((prev) => ({
      ...prev,
      field_type: value,
      default_value: null,
      numberFormat: value === "number" ? "formatted" : prev.numberFormat,
      date_display_format: ["date", "datetime"].includes(value) ? prev.date_display_format : "date_time_only",
      options: ["dropdown", "dropdown_select", "radio_select", "multiple_checkboxes"].includes(value)
        ? prev.options
        : [],
      option_style: value === "multi_checkbox" || value === "multiple_checkboxes" ? prev.option_style : "default",
      checkbox_options: value === "multi_checkbox" || value === "multiple_checkboxes" ? prev.checkbox_options : [],
      checkbox_search: value === "multi_checkbox" || value === "multiple_checkboxes" ? prev.checkbox_search : "",
      checkbox_sort: value === "multi_checkbox" || value === "multiple_checkboxes" ? prev.checkbox_sort : "custom",
      checkbox_default_values: value === "multi_checkbox" || value === "multiple_checkboxes" ? prev.checkbox_default_values : [],
      datetime_display_format: value === 'date_time_picker' ? prev.datetime_display_format : 'date_time_only',
      datetime_default_date: value === 'date_time_picker' ? prev.datetime_default_date : '',
      datetime_default_time: value === 'date_time_picker' ? prev.datetime_default_time : '',
      dropdown_option_style: value === "dropdown_select" ? prev.dropdown_option_style : "default",
      dropdown_options: value === "dropdown_select" ? prev.dropdown_options : [],
      dropdown_search: value === "dropdown_select" ? prev.dropdown_search : "",
      dropdown_sort: value === "dropdown_select" ? prev.dropdown_sort : "custom",
      dropdown_default_value: value === "dropdown_select" ? prev.dropdown_default_value : "",
      radio_option_style: value === "radio_select" ? prev.radio_option_style : "default",
      radio_options: value === "radio_select" ? prev.radio_options : [],
      radio_search: value === "radio_select" ? prev.radio_search : "",
      radio_sort: value === "radio_select" ? prev.radio_sort : "custom",
      radio_default_value: value === "radio_select" ? prev.radio_default_value : "",
      calc_property_type: value === "calculation" ? prev.calc_property_type : 'custom_equation',
      calc_output_type: value === "calculation" ? prev.calc_output_type : 'number',
      calc_number_format: value === "calculation" ? prev.calc_number_format : 'formatted',
        calc_start_date_property: value === "calculation" ? prev.calc_start_date_property : '',
      calc_end_date_property: value === "calculation" ? prev.calc_end_date_property : '',
      calc_start_date_search: value === "calculation" ? prev.calc_start_date_search : '',
      calc_end_date_search: value === "calculation" ? prev.calc_end_date_search : '',
    }));

    // Handle formula tokens when switching to/from calculation field type
    if (value === "calculation") {
      // Keep existing tokens when switching to calculation
    } else {
      // Clear tokens when switching away from calculation
      }
  };

  const handleObjectTypeChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      object_type: value,
      group_name: "", // reset group name since different object types have different groups
    }));
    fetchGroups(value);
  };

  const handleCheckboxChange = (
    name: string,
    checked: boolean | "indeterminate",
  ) => {
    const isChecked = checked === true;
    setForm((prev) => ({
      ...prev,
      [name]: isChecked,
      ...(name === "require_min_chars" && !isChecked ? { min_chars: null } : {}),
      ...(name === "limit_max_chars" && !isChecked ? { max_chars: null } : {}),
      ...((name === "require_min_chars" || name === "limit_max_chars") &&
        !isChecked && { auto_remove_disallowed: false }),
    }));
  };

  const handleSubmit = async () => {
    if (!form.label.trim() || !form.field_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (
      form.require_min_chars &&
      (form.min_chars === null || form.min_chars < 1)
    ) {
      toast.error("Please enter a valid minimum character count");
      return;
    }

    if (
      form.limit_max_chars &&
      (form.max_chars === null || form.max_chars < 1)
    ) {
      toast.error("Please enter a valid maximum character count");
      return;
    }

    setSaving(true);

    try {
      const internalName = form.label
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");

      const slugifyOptionValue = (label: string) =>
        label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")

      const buildOptionPayload = (
        items: Array<{ label: string; internal_name?: string }>
      ) =>
        items
          .map((o) => ({
            label: o.label,
            value: o.internal_name || slugifyOptionValue(o.label),
          }))
          .filter((o) => o.label.trim() !== "" || o.value.trim() !== "")

      let choiceOptions: Array<{ label: string; value: string }> = form.options
      if (form.field_type === "dropdown_select") {
        choiceOptions = buildOptionPayload(form.dropdown_options)
      } else if (form.field_type === "radio_select") {
        choiceOptions = buildOptionPayload(form.radio_options)
      } else if (
        form.field_type === "multiple_checkboxes" ||
        form.field_type === "multi_checkbox"
      ) {
        choiceOptions = buildOptionPayload(form.checkbox_options)
      }

      const payload: Record<string, any> = {
        name: internalName,
        label: form.label.trim(),
        field_type: form.field_type,
        object_type: form.object_type,
        group_name: form.group_name || null,
        description: form.description.trim() || null,
        is_required: form.isRequired,
        show_in_forms: form.showInForms,
        options: choiceOptions,
        settings: {
          default_value: form.default_value?.trim() || null,
          require_unique: form.require_unique,
          require_min_chars: form.require_min_chars,
          min_chars: form.min_chars,
          limit_max_chars: form.limit_max_chars,
          max_chars: form.max_chars,
          auto_remove_disallowed: form.auto_remove_disallowed,
          allowed_characters: form.allowed_characters,
          allowed_spaces: form.allowed_spaces,
          case_sensitivity: form.case_sensitivity,
          number_format: form.numberFormat,
          date_display_format: form.date_display_format,
          access: {
            type: "everyone_edit",
            assignments: [] as Array<{ entity_type: string; entity_id: string; access_level: string }>,
          },
        },
      };

      const { data: result, error: submitError } = await laravelApi.post("/properties", payload);

      if (!submitError) {
        const propertyId = (result as any)?.data?.id ?? (result as any)?.id;
        toast.success("Property created successfully");
        onCreated();
        onClose();
        if (propertyId) {
          router.push(`/settings/properties/${propertyId}/edit`);
        }
      } else {
        toast.error(submitError || "Failed to create property");
      }
    } catch (error) {
      console.error("Error creating property:", { message: (error as Error)?.message });
      toast.error("An error occurred while creating the property");
    } finally {
      setSaving(false);
    }
  };

  const internalName = form.label
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const getStepStatus = (stepId: string) => {
    const stepIndex = STEPS.findIndex((s) => s.id === stepId);
    const currentStepIndex = STEPS.findIndex((s) => s.id === step);
    if (stepIndex < currentStepIndex) return "completed";
    if (stepIndex === currentStepIndex) return "active";
    return "pending";
  };

  const goToNextStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === step);
    if (currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1].id as any);
    }
  };

  const goToPrevStep = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === step);
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1].id as any);
    }
  };

  const handleEditMoreOptions = () => {
    const params = new URLSearchParams();
    params.set("object_type", form.object_type);
    params.set("label", form.label);
    params.set("field_type", form.field_type);
    if (form.group_name) params.set("group_name", form.group_name);
    if (form.description) params.set("description", form.description);
    if (internalName) params.set("internal_name", internalName);
    if (form.require_unique) params.set("require_unique", "true");
    router.push(`/settings/properties/create?${params.toString()}`);
  };

  const handleNumberChange = (name: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value === "" ? null : parseInt(value),
    }));
  };

  const handleRadioChange = (name: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddOption = () => {
    const label = newOption.label.trim();
    if (!label) {
      toast.error("Option label cannot be empty");
      return;
    }

    let value = newOption.value.trim();
    if (!value) {
      value = label
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
    }

    // Check for duplicates
    const labelExists = form.options.some(
      (opt) => opt.label.toLowerCase() === label.toLowerCase()
    );
    const valueExists = form.options.some(
      (opt) => opt.value.toLowerCase() === value.toLowerCase()
    );

    if (labelExists) {
      toast.error("An option with this label already exists");
      return;
    }

    if (valueExists) {
      toast.error("An option with this value already exists");
      return;
    }

    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { label, value }],
    }));

    setNewOption({ label: "", value: "" });
  };

  const handleRemoveOption = (index: number) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleOptionChange = (index: number, field: "label" | "value", value: string) => {
    setForm((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = { ...newOptions[index], [field]: value };
      if (field === "label" && !newOptions[index].value) {
        newOptions[index].value = value.toLowerCase().replace(/\s+/g, "_");
      }
      return { ...prev, options: newOptions };
    });
  };

  const handleLoadPreset = (preset: string) => {
    const presets: Record<string, {label: string, internal_name: string}[]> = {
      yes_no: [{ label: 'Yes', internal_name: 'yes' }, { label: 'No', internal_name: 'no' }],
      agree_disagree: [{ label: 'Agree', internal_name: 'agree' }, { label: 'Disagree', internal_name: 'disagree' }],
      priority: [{ label: 'High', internal_name: 'high' }, { label: 'Medium', internal_name: 'medium' }, { label: 'Low', internal_name: 'low' }],
    };
    const options = (presets[preset] || []).map((o, i) => ({
      id: crypto.randomUUID(), order: i + 1, label: o.label, internal_name: o.internal_name, in_forms: true
    }));
    if (form.field_type === 'radio_select') {
      setForm(p => ({ ...p, radio_options: options }));
    } else {
      setForm(p => ({ ...p, dropdown_options: options }));
    }
    setLoadOptionsOpen(false);
  };

  const handlePasteOptions = () => {
    const lines = pasteOptionsText.split('\n').filter(l => l.trim());
    const options = lines.map((line, i) => {
      const parts = pasteDelimiter ? line.split(pasteDelimiter) : [line];
      const label = parts[0]?.trim() || '';
      const internal_name = (parts[1]?.trim() || label).toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
      return { id: crypto.randomUUID(), order: i + 1, label, internal_name, in_forms: true };
    });
    if (form.field_type === 'radio_select') {
      setForm(p => ({ ...p, radio_options: options }));
    } else {
      setForm(p => ({ ...p, dropdown_options: options }));
    }
    setLoadOptionsOpen(false);
    setPasteOptionsText('');
  };

  const handleLoadFromProperty = async () => {
    try {
      const { data } = await laravelApi.get<{ properties: any[]; meta: any }>('/properties', { object_type: fromPropertyObjectType, limit: 500 });
      const propsData = (data as any)?.data?.properties || data?.properties || [];
      const property = propsData.find((p: any) => p.name === fromPropertySelected);
      if (property) {
        const options = property.radio_options || property.dropdown_options || [];
        if (form.field_type === 'radio_select') {
          setForm(p => ({ ...p, radio_options: options }));
        } else {
          setForm(p => ({ ...p, dropdown_options: options }));
        }
      }
    } catch (err) {
      // Expected in standalone mode
    }
    setLoadOptionsOpen(false);
  };

  const getFieldTypeIcon = (fieldType: string) => {
    const type = fieldTypes.find((t) => t.value === fieldType);
    if (type?.icon) return type.icon;
    return <TextCursor className="w-5 h-5" />;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="p-0 sm:!max-w-[960px] w-full border-l border-border shadow-2xl"
      >
        <SheetHeader>
          <VisuallyHidden>
            <SheetTitle>Create property</SheetTitle>
            <SheetDescription>Form to create a new property</SheetDescription>
          </VisuallyHidden>
        </SheetHeader>

        <div className="h-full flex bg-muted/50 overflow-hidden">
          {/* Navigation Sidebar */}
          <aside className="hidden">
            <div className="p-8 border-b border-border space-y-0">
              <h2 className="text-xl font-extrabold tracking-tight text-foreground text-left">
                Create property
              </h2>
              <p className="text-[12px] text-muted-foreground mt-1 text-left">
                Configure your new property step by step
              </p>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 pb-6">
              <div className="space-y-1 relative">
                {STEPS.map((stepItem, index) => {
                  const status = getStepStatus(stepItem.id);
                  const isActive = status === "active";
                  const isCompleted = status === "completed";

                  return (
                    <div key={stepItem.id} className="relative">
                      {/* Connection Line */}
                      {index < STEPS.length - 1 && (
                        <div
                          className={cn(
                            "absolute left-[31px] top-[48px] w-[2px] h-[calc(100%-16px)] -z-0 transition-colors duration-500",
                            isCompleted
                              ? "bg-primary"
                              : "bg-border",
                          )}
                        />
                      )}

                      <button
                        onClick={() => setStep(stepItem.id as any)}
                        className={cn(
                          "w-full flex items-start gap-4 p-3 rounded-xl transition-all duration-300 text-left relative z-10",
                          isActive
                            ? "bg-primary/[0.04]"
                            : "hover:bg-accent",
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 transition-all duration-500 shadow-sm",
                            isCompleted
                              ? "bg-primary border-primary text-white scale-100"
                              : isActive
                                ? "bg-card border-primary text-primary ring-4 ring-primary/10 scale-105"
                                : "bg-card border-border text-muted-foreground/60 scale-90",
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : (
                            <span className="font-bold text-sm">
                              {index + 1}
                            </span>
                          )}
                        </div>

                        <div className="pt-1.5 pr-2">
                          <p
                            className={cn(
                              "text-[14px] font-bold transition-colors leading-tight",
                              isActive
                                ? "text-primary"
                                : isCompleted 
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                            )}
                          >
                            {stepItem.label}
                          </p>
                          <p className={cn(
                            "text-[11px] leading-relaxed mt-0.5 max-w-[180px] transition-colors",
                            isActive ? "text-muted-foreground" : "text-muted-foreground/60"
                          )}>
                            {stepItem.description}
                          </p>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </nav>

            <div className="flex-shrink-0 p-5 mt-auto">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/[0.03] to-primary/[0.08] border border-primary/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-foreground">
                      AI Property Assistant
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Smart configuration
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-9 text-[12px] bg-card dark:bg-card border-primary/20 text-primary hover:bg-primary hover:text-white transition-all font-bold rounded-lg shadow-sm"
                  onClick={() => {
                    /* Auto-fill functionality */
                  }}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-2" />
                  Auto-fill fields
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col">
            {/* Top Bar */}
            <header className="flex-shrink-0 bg-primary-foreground border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-start">
                  <h1 className="text-2xl font-bold text-foreground">
                    {form.label || "New Property"}
                  </h1>
                  <p className="text-[14px] text-muted-foreground/60 capitalize">
                    {form.object_type} property
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-muted-foreground/60 hover:text-foreground rounded-full"
                  aria-label="Close"
                >
                  <span aria-hidden>✕</span>
                </Button>
              </div>
            </header>

            {/* Tab Bar */}
            <div className="flex-shrink-0 border-b border-border bg-primary-foreground px-6">
              <div className="flex">
                {(['details', 'field-type', 'rules', 'manage-access', 'preview'] as const).map((id) => {
                  const meta: Record<string, { label: string; Icon: React.ElementType }> = {
                    'details':       { label: 'Details',       Icon: FileText    },
                    'field-type':    { label: 'Field type',   Icon: Database    },
                    'rules':         { label: 'Rules',        Icon: Settings2   },
                    'manage-access': { label: 'Manage Access', Icon: ShieldCheck },
                    'preview':       { label: 'Preview',      Icon: Eye         },
                  };
                  const { label: tabLabel, Icon } = meta[id];
                  return (
                    <button
                      key={id}
                      onClick={() => setStep(id)}
                      className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                        step === id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tabLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Content */}
            <section className="flex-1 overflow-y-auto p-6">
              <Toaster />

              {/* Step Content */}
              {step === "details" && (
                <DetailsStep
                  form={form}
                  setForm={setForm}
                  handleInputChange={handleInputChange}
                  handleObjectTypeChange={handleObjectTypeChange}
                  groups={groups}
                  internalName={internalName}
                />
              )}

              {step === "field-type" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="font-normal cursor-pointer">
                      Field type <span className="text-destructive">*</span>
                    </Label>
                    {fieldTypesLoading ? (
                      <div className="flex h-[200px] items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
                      </div>
                    ) : (
                      <FieldTypeSelector
                        value={form.field_type}
                        onChange={handleSelectChange}
                        placeholder="Select field type"
                      />
                    )}
                  </div>

                  {form.field_type === "dropdown" && (
                    <div className="space-y-6">
                      <Label className="font-normal cursor-pointer">
                        Options
                      </Label>
                      <div className="space-y-4">
                        {form.options.map((option, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-primary-foreground border border-border rounded-lg"
                          >
                            <span className="flex-1 text-[13px]">
                              <span className="font-medium">
                                {option.label}
                              </span>{" "}
                              — {option.value}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveOption(index)}
                              className="text-muted-foreground/60 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="flex items-center gap-3">
                          <Input
                            name="optionLabel"
                            value={newOption.label}
                            onChange={(e) =>
                              setNewOption((prev) => ({
                                ...prev,
                                label: e.target.value,
                              }))
                            }
                            placeholder="Option label"
                            className="flex-1"
                          />
                          <Input
                            name="optionValue"
                            value={newOption.value}
                            onChange={(e) =>
                              setNewOption((prev) => ({
                                ...prev,
                                value: e.target.value,
                              }))
                            }
                            placeholder="Option value"
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={handleAddOption}
                            className="text-foreground hover:text-primary"
                          >
                            Add option
                          </Button>
                           </div>
                         </div>
                         </div>
                       )}

                   {/* Conditional Default Value Input per Field Type */}
                  <div className="space-y-6">
                    {(() => {
                      const ft = form.field_type;

                      // 1. Text input types (single_line_text, email, url, phone_number)
                      if (["single_line_text", "email", "url", "phone", "phone_number"].includes(ft)) {
                        const placeholder =
                          ft === "email"
                            ? "Enter default email"
                            : ft === "url"
                              ? "Enter default URL"
                              : ["phone", "phone_number"].includes(ft)
                                ? "Enter default phone number"
                                : "Enter default text value";
                        return (
                          <div className="space-y-3">
                            <Label className="font-normal cursor-pointer">
                              Default value
                            </Label>
                            <Input
                              name="default_value"
                              value={form.default_value || ""}
                              onChange={handleInputChange}
                              placeholder={placeholder}
                              type={ft === "email" ? "email" : ft === "url" ? "url" : ["phone", "phone_number"].includes(ft) ? "tel" : "text"}
                              className="w-full"
                            />
                          </div>
                        );
                      }

                      // 2. Multiline text
                      if (ft === "multi_line_text") {
                        return (
                          <div className="space-y-3">
                            <Label className="font-normal cursor-pointer">
                              Default value
                            </Label>
                            <Textarea
                              name="default_value"
                              value={form.default_value || ""}
                              onChange={handleInputChange}
                              placeholder="Enter default text value"
                              className="w-full"
                              rows={4}
                            />
                          </div>
                        );
                      }

                      // 3. Rich text editor
                      if (ft === "rich_text") {
                        return (
                          <div className="space-y-3">
                            <Label className="font-normal cursor-pointer">
                              Default value
                            </Label>
                            <PropertyRichTextEditor
                              value={form.default_value}
                              onChange={(val) =>
                                setForm((prev) => ({ ...prev, default_value: val }))
                              }
                            />
                          </div>
                        );
                      }

                      // 4. Date Picker
                      if (ft === "date_picker") {
                        return (
                          <div className="space-y-6">
                            <Label className="font-normal cursor-pointer">
                              Default value
                            </Label>
                            <Input
                              type="date"
                              name="default_value"
                              value={form.default_value || ""}
                              onChange={handleInputChange}
                              className="w-full"
                            />

                            <Label className="font-normal cursor-pointer">
                              How should this date appear on records?
                            </Label>
                            <RadioGroup
                              value={form.dateDisplayFormat}
                              onValueChange={(val) =>
                                setForm((prev) => ({ ...prev, dateDisplayFormat: val as PropertyFormState['dateDisplayFormat'] }))
                              }
                              className="space-y-3"
                            >
                              <div className="flex items-start gap-3">
                                <RadioGroupItem value="date_only" id="date_only" className="mt-0.5" />
                                <Label htmlFor="date_only" className="cursor-pointer font-normal leading-snug">
                                  <p className="font-medium text-sm">Show date only</p>
                                  <p className="text-xs text-muted-foreground">Example: 05-04-2026</p>
                                </Label>
                              </div>
                              <div className="flex items-start gap-3">
                                <RadioGroupItem value="date_with_relative" id="date_with_relative" className="mt-0.5" />
                                <Label htmlFor="date_with_relative" className="cursor-pointer font-normal leading-snug">
                                  <p className="font-medium text-sm">Show date with relative time</p>
                                  <p className="text-xs text-muted-foreground">Example: 05-04-2026 (15 days ago)</p>
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        );
                      }

                      // 5b. Date or Datetime
                      if (ft === "date" || ft === "datetime") {
                        return (
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <Label className="font-normal cursor-pointer">
                                Default value
                              </Label>
                              <Input
                                type={ft === "date" ? "date" : "datetime-local"}
                                name="default_value"
                                value={form.default_value || ""}
                                onChange={handleInputChange}
                                className="w-full"
                              />
                            </div>

                            <div className="space-y-3">
                              <p className="font-medium text-sm">How should this date appear on records?</p>

                              <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="date_display_format"
                                  value="date_time_only"
                                  checked={form.date_display_format === "date_time_only"}
                                  onChange={(e) => setForm((prev) => ({ ...prev, date_display_format: e.target.value }))}
                                  className="mt-1"
                                />
                                <div>
                                  <p className="text-sm font-medium">Show date and time only</p>
                                  <p className="text-xs text-muted-foreground">Example: 05-22-2026 06:53 PM</p>
                                </div>
                              </label>

                              <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="date_display_format"
                                  value="date_time_relative"
                                  checked={form.date_display_format === "date_time_relative"}
                                  onChange={(e) => setForm((prev) => ({ ...prev, date_display_format: e.target.value }))}
                                  className="mt-1"
                                />
                                <div>
                                  <p className="text-sm font-medium">Show date, time, and relative time</p>
                                  <p className="text-xs text-muted-foreground">Example: 05-22-2026 06:53 PM (15 days ago)</p>
                                </div>
                              </label>
                            </div>

                            <div className="rounded-md border p-4 space-y-2 text-sm">
                              <p className="font-semibold">Which time zone will be used?</p>
                              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                                <li>When viewing and editing this property, a user's current time zone will be used. This is based on the time zone set on their device.</li>
                                <li>When filtering with this property, your account's time zone will be used by default.</li>
                              </ul>
                            </div>
                          </div>
                        );
                      }

                      // 5c. Date and Time (date_time_picker) field type
                      if (ft === "date_time_picker") {
                        const handleNowClick = () => {
                          const now = new Date();
                          const dateStr = now.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          }); // MM/DD/YYYY
                          let hours = now.getHours();
                          const minutes = now.getMinutes().toString().padStart(2, '0');
                          const ampm = hours >= 12 ? 'PM' : 'AM';
                          hours = hours % 12;
                          hours = hours ? hours : 12; // the hour '0' should be '12'
                          const timeStr = `${hours}:${minutes} ${ampm}`;
                          setForm((prev) => ({
                            ...prev,
                            datetime_default_date: dateStr,
                            datetime_default_time: timeStr,
                          }));
                        };

                        const handleClearClick = () => {
                          setForm((prev) => ({
                            ...prev,
                            datetime_default_date: '',
                            datetime_default_time: '',
                          }));
                        };

                        return (
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Default value</p>
                              <p className="text-xs text-muted-foreground">This value will be automatically filled in whenever a new record is created</p>
                              
                              <div className="flex gap-2 items-center">
                                <div className="flex items-center border rounded-md px-3 py-2 gap-2 flex-1 bg-card dark:bg-card">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <input
                                    type="text"
                                    placeholder="MM/DD/YYYY"
                                    className="bg-transparent outline-none text-sm w-full"
                                    value={form.datetime_default_date}
                                    onChange={(e) => setForm((prev) => ({ ...prev, datetime_default_date: e.target.value }))}
                                  />
                                </div>
                                <div className="flex items-center border rounded-md px-3 py-2 gap-2 flex-1 bg-card dark:bg-card">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <input
                                    type="text"
                                    placeholder="HH:MM AM/PM"
                                    className="bg-transparent outline-none text-sm w-full"
                                    value={form.datetime_default_time}
                                    onChange={(e) => setForm((prev) => ({ ...prev, datetime_default_time: e.target.value }))}
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 mt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleNowClick}
                                  className="text-xs px-3 py-1"
                                >
                                  Now
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleClearClick}
                                  className="text-xs px-3 py-1 text-muted-foreground"
                                >
                                  Clear
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <p className="font-medium text-sm">How should this date appear on records?</p>
                              
                              <RadioGroup
                                value={form.datetime_display_format}
                                onValueChange={(val) =>
                                  setForm((prev) => ({ ...prev, datetime_display_format: val }))
                                }
                                className="space-y-3"
                              >
                                <div className="flex items-start gap-3">
                                  <RadioGroupItem value="date_time_only" id="datetime_date_time_only" className="mt-0.5" />
                                  <Label htmlFor="datetime_date_time_only" className="cursor-pointer font-normal leading-snug">
                                    <p className="font-medium text-sm">Show date and time only</p>
                                    <p className="text-xs text-muted-foreground">Example: 05-23-2026 12:35 PM</p>
                                  </Label>
                                </div>
                                <div className="flex items-start gap-3">
                                  <RadioGroupItem value="date_time_relative" id="datetime_date_time_relative" className="mt-0.5" />
                                  <Label htmlFor="datetime_date_time_relative" className="cursor-pointer font-normal leading-snug">
                                    <p className="font-medium text-sm">Show date, time, and relative time</p>
                                    <p className="text-xs text-muted-foreground">Example: 05-23-2026 12:35 PM (15 days ago)</p>
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>

                            <div className="rounded-md border p-4 space-y-2 text-sm">
                              <p className="font-semibold">Which time zone will be used?</p>
                              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                                <li>When viewing and editing this property, a user's current time zone will be used. This is based on the time zone set on their device.</li>
                                <li>When filtering with this property, your account's time zone will be used by default.</li>
                              </ul>
                            </div>
                          </div>
                        );
                      }

                      // 6. Number
                      if (ft === "number") {
                        const NUMBER_FORMATS = [
                          { value: 'formatted', label: 'Formatted number', description: 'Format your property as a number' },
                          { value: 'unformatted', label: 'Unformatted number', description: 'Remove formatting from your property' },
                          { value: 'currency', label: 'Currency', description: 'Format your property as a currency' },
                          { value: 'percentage', label: 'Percentage', description: 'Format your property as a percentage' },
                        ];
                        return (
                          <div className="space-y-6">
                            <Label className="font-normal cursor-pointer">
                              Number format
                            </Label>
                            <div className="relative" ref={numberFormatRef}>
                              <button
                                type="button"
                                onClick={() => setNumberFormatOpen(!numberFormatOpen)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                <span>{NUMBER_FORMATS.find(f => f.value === form.numberFormat)?.label}</span>
                                <ChevronDown className="w-4 h-4 shrink-0 opacity-50" />
                              </button>
                              {numberFormatOpen && (
                                <div className="absolute z-[200] w-full border rounded-md bg-background shadow-md mt-1">
                                  {NUMBER_FORMATS.map(opt => (
                                    <div
                                      key={opt.value}
                                      onClick={() => {
                                        setForm((prev) => ({ ...prev, numberFormat: opt.value as PropertyFormState['numberFormat'] }));
                                        setNumberFormatOpen(false);
                                      }}
                                      className={`px-3 py-2 cursor-pointer hover:bg-muted ${form.numberFormat === opt.value ? 'bg-muted/50' : ''}`}
                                    >
                                      <p className="text-sm font-medium">{opt.label}</p>
                                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="space-y-3">
                              <Label className="font-normal cursor-pointer">
                                Default value
                              </Label>
                              {form.numberFormat === "currency" ? (
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                  <Input
                                    type="number"
                                    name="default_value"
                                    value={form.default_value || ""}
                                    onChange={handleInputChange}
                                    placeholder="Enter default amount"
                                    className="pl-9 w-full"
                                  />
                                </div>
                              ) : form.numberFormat === "percentage" ? (
                                <div className="relative">
                                  <Input
                                    type="number"
                                    name="default_value"
                                    value={form.default_value || ""}
                                    onChange={handleInputChange}
                                    placeholder="Enter default percentage"
                                    className="pr-9 w-full"
                                  />
                                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                </div>
                              ) : (
                                <Input
                                  type="number"
                                  name="default_value"
                                  value={form.default_value || ""}
                                  onChange={handleInputChange}
                                  placeholder="Enter default number"
                                  className="w-full"
                                />
                              )}
                            </div>
                          </div>
                        );
                      }

                      // 7. Currency
                      if (ft === "currency") {
                        return (
                          <div className="space-y-3">
                            <Label className="font-normal cursor-pointer">
                              Default value
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                              <Input
                                type="number"
                                step="any"
                                name="default_value"
                                value={form.default_value || ""}
                                onChange={handleInputChange}
                                placeholder="0.00"
                                className="pl-9 w-full"
                              />
                            </div>
                          </div>
                        );
                      }

                      // 8. Percent
                      if (ft === "percent") {
                        return (
                          <div className="space-y-3">
                            <Label className="font-normal cursor-pointer">
                              Default value
                            </Label>
                            <div className="relative">
                              <Input
                                type="number"
                                step="any"
                                name="default_value"
                                value={form.default_value || ""}
                                onChange={handleInputChange}
                                placeholder="0"
                                className="pr-9 w-full"
                              />
                              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                            </div>
                          </div>
                        );
                      }

                      // 9. Score (Rating)
                      if (ft === "score") {
                        return (
                          <div className="space-y-3">
                            <Label className="font-normal cursor-pointer">
                              Default value
                            </Label>
                            <Select
                              value={form.default_value || ""}
                              onValueChange={(val) =>
                                setForm((prev) => ({
                                  ...prev,
                                  default_value: val === "none_selected_score" ? null : val,
                                }))
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select default score (optional)" />
                              </SelectTrigger>
                              <SelectContent className="z-[200]">
                                <SelectItem value="none_selected_score">None</SelectItem>
                                <SelectItem value="1">1 Star</SelectItem>
                                <SelectItem value="2">2 Stars</SelectItem>
                                <SelectItem value="3">3 Stars</SelectItem>
                                <SelectItem value="4">4 Stars</SelectItem>
                                <SelectItem value="5">5 Stars</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      }

                      // 10. Checkboxes / Dropdown Option Picker
                      if (ft === "dropdown") {
                        return (
                          <div className="space-y-3">
                            <Label className="font-normal cursor-pointer">
                              Default value
                            </Label>
                            {form.options.length === 0 ? (
                              <p className="text-[13px] text-muted-foreground/60 italic">
                                Add options above to select a default value.
                              </p>
                            ) : (
                              <Select
                                value={form.default_value || ""}
                                onValueChange={(val) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    default_value: val === "none_selected_option" ? null : val,
                                  }))
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select default option (optional)" />
                                </SelectTrigger>
                                <SelectContent className="z-[200]">
                                  <SelectItem value="none_selected_option">None</SelectItem>
                                  {form.options.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        );
                      }

                      // 11. Multi Checkbox / Multiple Checkboxes (Unified)
                      if (ft === "multi_checkbox" || ft === "multiple_checkboxes") {
                        const checkbox_options = form.checkbox_options;
                        const checkbox_search = form.checkbox_search;
                        const checkbox_sort = form.checkbox_sort;
                        const option_style = form.option_style;

                        const toggleInForms = (id: string) => {
                          setForm(p => ({
                            ...p,
                            checkbox_options: p.checkbox_options.map(opt =>
                              opt.id === id ? { ...opt, in_forms: !opt.in_forms } : opt
                            )
                          }));
                        };

                        const addOption = () => {
                          const newOpt = {
                            id: crypto.randomUUID(),
                            order: form.checkbox_options.length + 1,
                            label: '',
                            internal_name: '',
                            in_forms: true
                          };
                          setForm(p => ({ ...p, checkbox_options: [...p.checkbox_options, newOpt] }));
                        };

                        const clearOptions = () => {
                          setForm(p => ({ ...p, checkbox_options: [] }));
                        };

                        let displayed = [...checkbox_options];
                        if (checkbox_search) {
                          displayed = displayed.filter(o =>
                            o.label.toLowerCase().includes(checkbox_search.toLowerCase())
                          );
                        }
                        if (checkbox_sort === 'alphabetical') {
                          displayed.sort((a, b) => a.label.localeCompare(b.label));
                        } else {
                          displayed.sort((a, b) => a.order - b.order);
                        }

                        return (
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <Label className="font-normal cursor-pointer">Default value</Label>
                              <div className="border rounded-md bg-background relative">
                                <button
                                  ref={defaultValuesBtnRef}
                                  type="button"
                                  onClick={openDefaultValuesDropdown}
                                  className="w-full text-left px-3 py-2 flex justify-between items-center text-sm"
                                >
                                  {form.checkbox_default_values && form.checkbox_default_values.length > 0
                                    ? form.checkbox_default_values.join(', ')
                                    : 'Select default value'}
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>
                              {defaultValuesDropdownOpen && dropdownPos && (
                                <div
                                  ref={defaultValuesDropdownRef}
                                  style={{
                                    position: 'fixed',
                                    top: dropdownPos.top,
                                    left: dropdownPos.left,
                                    width: dropdownPos.width,
                                    zIndex: 9999,
                                  }}
                                  className="border max-h-60 overflow-y-auto bg-background shadow-lg rounded-md"
                                >
                                  {(() => {
                                    const defaultOptions = [
                                      { label: 'Yes', internal_name: 'yes' },
                                      { label: 'No',  internal_name: 'no'  },
                                    ];
                                    const displayOptions = checkbox_options.length > 0 ? checkbox_options : defaultOptions;
                                    return displayOptions.map(opt => {
                                      const isChecked = (form.checkbox_default_values || []).includes(opt.internal_name);
                                      return (
                                        <label key={opt.internal_name} className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              const checked = e.target.checked;
                                              setForm(p => {
                                                const current = p.checkbox_default_values || [];
                                                const next = checked
                                                  ? [...current, opt.internal_name]
                                                  : current.filter(val => val !== opt.internal_name);
                                                return { ...p, checkbox_default_values: next };
                                              });
                                            }}
                                            className="rounded border-border"
                                          />
                                          <span className="text-sm">{opt.label || '(empty)'}</span>
                                        </label>
                                      );
                                    });
                                  })()}
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label className="font-normal cursor-pointer">Option style</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setForm(p => ({ ...p, option_style: 'default' }))}
                                  className={cn(
                                    "px-3 py-2 rounded border font-medium text-sm transition-all",
                                    option_style === 'default'
                                      ? "border-2 border-primary bg-muted font-bold"
                                      : "border"
                                  )}
                                >
                                  Default
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setForm(p => ({ ...p, option_style: 'badge' }))}
                                  className={cn(
                                    "px-3 py-2 rounded border font-medium text-sm transition-all flex items-center justify-center gap-2",
                                    option_style === 'badge'
                                      ? "border-2 border-primary bg-muted font-bold"
                                      : "border"
                                  )}
                                >
                                  <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs">Badge</span>
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="relative">
                                <Input
                                  placeholder="Search"
                                  value={checkbox_search}
                                  onChange={(e) => setForm(p => ({ ...p, checkbox_search: e.target.value }))}
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              </div>
                              <select
                                value={checkbox_sort}
                                onChange={(e) => setForm(p => ({ ...p, checkbox_sort: e.target.value }))}
                                className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                <option value="custom">Custom</option>
                                <option value="alphabetical">Alphabetical</option>
                              </select>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-medium">Checkbox options ({checkbox_options.length})</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const text = checkbox_options.map(o => `${o.label}\t${o.internal_name}`).join('\n');
                                    navigator.clipboard.writeText(text);
                                    toast.success("Options copied to clipboard!");
                                  }}
                                  className="text-sm text-primary underline"
                                >
                                  Copy option labels and internal names
                                </button>
                              </div>

                               <table className="w-full text-sm border-collapse">
                                <thead>
                                  <tr className="border-b text-left text-xs font-semibold text-muted-foreground uppercase">
                                    <th scope="col" className="py-2 w-8"></th>
                                    <th scope="col" className="py-2 w-8"><input type="checkbox" aria-label="Select all options" className="rounded border-border" /></th>
                                    <th scope="col" className="py-2 w-16">Order</th>
                                    <th scope="col" className="py-2">Label</th>
                                    <th scope="col" className="py-2">Internal name</th>
                                    <th scope="col" className="py-2 w-20 text-center">In Forms</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {displayed.map((opt, i) => (
                                    <tr key={opt.id} className="border-b">
                                      <td className="py-2">⠿</td>
                                      <td className="py-2"><input type="checkbox" aria-label="Select option" className="rounded border-border" /></td>
                                      <td className="py-2">
                                        <Input
                                          type="number"
                                          value={opt.order}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            setForm(p => ({
                                              ...p,
                                              checkbox_options: p.checkbox_options.map(o =>
                                                o.id === opt.id ? { ...o, order: val } : o
                                              )
                                            }));
                                          }}
                                          className="w-16 h-8 text-center"
                                        />
                                      </td>
                                      <td className="py-2">
                                        <Input
                                          type="text"
                                          value={opt.label}
                                          onChange={(e) => {
                                            const label = e.target.value;
                                            const internal = label.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
                                            setForm(p => ({
                                              ...p,
                                              checkbox_options: p.checkbox_options.map(o =>
                                                o.id === opt.id ? { ...o, label, internal_name: internal } : o
                                              )
                                            }));
                                          }}
                                          className="h-8"
                                        />
                                      </td>
                                      <td className="py-2">
                                        <Input
                                          type="text"
                                          value={opt.internal_name}
                                          onChange={(e) => {
                                            const internal = e.target.value;
                                            setForm(p => ({
                                              ...p,
                                              checkbox_options: p.checkbox_options.map(o =>
                                                o.id === opt.id ? { ...o, internal_name: internal } : o
                                              )
                                            }));
                                          }}
                                          className="h-8"
                                        />
                                      </td>
                                      <td className="py-2 text-center">
                                        <button
                                          type="button"
                                          onClick={() => toggleInForms(opt.id)}
                                          className={cn(
                                            "px-2.5 py-1 text-xs rounded transition-all font-semibold",
                                            opt.in_forms
                                              ? "bg-foreground text-background"
                                              : "bg-muted text-muted-foreground"
                                          )}
                                        >
                                          ✓
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              <div className="flex gap-4 mt-2 text-sm text-primary">
                                <button type="button" onClick={addOption}>+ Add option</button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const lines = ['Option 1', 'Option 2', 'Option 3'];
                                    const loaded = lines.map((l, idx) => ({
                                      id: crypto.randomUUID(),
                                      order: checkbox_options.length + idx + 1,
                                      label: l,
                                      internal_name: l.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, ''),
                                      in_forms: true
                                    }));
                                    setForm(p => ({ ...p, checkbox_options: [...p.checkbox_options, ...loaded] }));
                                  }}
                                >
                                  ≡ Load options
                                </button>
                                <button type="button" onClick={clearOptions}>🗑 Clear all options</button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // 11b. Dropdown Select (Unified UI)
                      if (ft === "dropdown_select") {
                        const dropdown_options = form.dropdown_options;
                        const dropdown_search = form.dropdown_search;
                        const dropdown_sort = form.dropdown_sort;
                        const dropdown_option_style = form.dropdown_option_style;

                        const toggleInForms = (id: string) => {
                          setForm(p => ({
                            ...p,
                            dropdown_options: p.dropdown_options.map(opt =>
                              opt.id === id ? { ...opt, in_forms: !opt.in_forms } : opt
                            )
                          }));
                        };

                        const addOption = () => {
                          const newOpt = {
                            id: crypto.randomUUID(),
                            order: form.dropdown_options.length + 1,
                            label: '',
                            internal_name: '',
                            in_forms: true
                          };
                          setForm(p => ({ ...p, dropdown_options: [...p.dropdown_options, newOpt] }));
                        };

                        const clearOptions = () => {
                          setForm(p => ({ ...p, dropdown_options: [] }));
                        };

                        let displayed = [...dropdown_options];
                        if (dropdown_search) {
                          displayed = displayed.filter(o =>
                            o.label.toLowerCase().includes(dropdown_search.toLowerCase())
                          );
                        }
                        if (dropdown_sort === 'alphabetical') {
                          displayed.sort((a, b) => a.label.localeCompare(b.label));
                        } else {
                          displayed.sort((a, b) => a.order - b.order);
                        }

                        return (
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <Label className="font-normal cursor-pointer">Default value</Label>
                              <Select
                                value={form.dropdown_default_value || ""}
                                onValueChange={(val) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    dropdown_default_value: val === "none_selected_dropdown" ? "" : val,
                                  }))
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select default value" />
                                </SelectTrigger>
                                <SelectContent className="z-[200]">
                                  <SelectItem value="none_selected_dropdown">Select default value</SelectItem>
                                  {dropdown_options.map((opt) => (
                                    <SelectItem key={opt.internal_name || opt.id} value={opt.internal_name}>
                                      {opt.label || "(empty)"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="font-normal cursor-pointer">Option style</Label>
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setForm(p => ({ ...p, dropdown_option_style: 'default' }))}
                                  className={cn(
                                    "px-3 py-2 rounded border font-medium text-sm transition-all",
                                    dropdown_option_style === 'default'
                                      ? "border-2 border-primary bg-muted font-bold"
                                      : "border"
                                  )}
                                >
                                  Default
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setForm(p => ({ ...p, dropdown_option_style: 'with_dot' }))}
                                  className={cn(
                                    "px-3 py-2 rounded border font-medium text-sm transition-all flex items-center justify-center gap-1.5",
                                    dropdown_option_style === 'with_dot'
                                      ? "border-2 border-primary bg-muted font-bold"
                                      : "border"
                                  )}
                                >
                                  • With dot
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setForm(p => ({ ...p, dropdown_option_style: 'badge' }))}
                                  className={cn(
                                    "px-3 py-2 rounded border font-medium text-sm transition-all flex items-center justify-center gap-2",
                                    dropdown_option_style === 'badge'
                                      ? "border-2 border-primary bg-muted font-bold"
                                      : "border"
                                  )}
                                >
                                  <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs">Badge</span>
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="relative">
                                <Input
                                  placeholder="Search"
                                  value={dropdown_search}
                                  onChange={(e) => setForm(p => ({ ...p, dropdown_search: e.target.value }))}
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              </div>
                              <select
                                value={dropdown_sort}
                                onChange={(e) => setForm(p => ({ ...p, dropdown_sort: e.target.value }))}
                                className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                <option value="custom">Custom</option>
                                <option value="alphabetical">Alphabetical</option>
                              </select>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-medium">Dropdown options ({dropdown_options.length})</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const text = dropdown_options.map(o => `${o.label}\t${o.internal_name}`).join('\n');
                                    navigator.clipboard.writeText(text);
                                    toast.success("Options copied to clipboard!");
                                  }}
                                  className="text-sm text-primary underline"
                                >
                                  Copy option labels and internal names
                                </button>
                              </div>

                              <table className="w-full text-sm border-collapse">
                                <thead>
                                  <tr className="border-b text-left text-xs font-semibold text-muted-foreground uppercase">
                                    <th className="py-2 w-8"></th>
                                    <th className="py-2 w-8"><input type="checkbox" aria-label="Select all options" className="rounded border-border" /></th>
                                    <th className="py-2 w-16">Order</th>
                                    <th className="py-2">Label</th>
                                    <th className="py-2">Internal name</th>
                                    <th className="py-2 w-20 text-center">In Forms</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {displayed.map((opt, i) => (
                                    <tr key={opt.id} className="border-b">
                                      <td className="py-2">⠿</td>
                                      <td className="py-2"><input type="checkbox" aria-label="Select option" className="rounded border-border" /></td>
                                      <td className="py-2">
                                        <Input
                                          type="number"
                                          value={opt.order}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            setForm(p => ({
                                              ...p,
                                              dropdown_options: p.dropdown_options.map(o =>
                                                o.id === opt.id ? { ...o, order: val } : o
                                              )
                                            }));
                                          }}
                                          className="w-16 h-8 text-center"
                                        />
                                      </td>
                                      <td className="py-2">
                                        <Input
                                          type="text"
                                          value={opt.label}
                                          onChange={(e) => {
                                            const label = e.target.value;
                                            const internal = label.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
                                            setForm(p => ({
                                              ...p,
                                              dropdown_options: p.dropdown_options.map(o =>
                                                o.id === opt.id ? { ...o, label, internal_name: internal } : o
                                              )
                                            }));
                                          }}
                                          className="h-8"
                                        />
                                      </td>
                                      <td className="py-2">
                                        <Input
                                          type="text"
                                          value={opt.internal_name}
                                          onChange={(e) => {
                                            const internal = e.target.value;
                                            setForm(p => ({
                                              ...p,
                                              dropdown_options: p.dropdown_options.map(o =>
                                                o.id === opt.id ? { ...o, internal_name: internal } : o
                                              )
                                            }));
                                          }}
                                          className="h-8"
                                        />
                                      </td>
                                      <td className="py-2 text-center">
                                        <button
                                          type="button"
                                          onClick={() => toggleInForms(opt.id)}
                                          className={cn(
                                            "px-2.5 py-1 text-xs rounded transition-all font-semibold",
                                            opt.in_forms
                                              ? "bg-foreground text-background"
                                              : "bg-muted text-muted-foreground"
                                          )}
                                        >
                                          ✓
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              <div className="flex gap-4 mt-2 text-sm text-primary">
                                <button type="button" onClick={addOption}>+ Add option</button>
                                <div className="relative" ref={loadOptionsRef}>
                                  <button
                                    type="button"
                                    onClick={() => setLoadOptionsOpen(!loadOptionsOpen)}
                                    className="text-sm text-primary flex items-center gap-1"
                                  >
                                    ≡ Load options
                                  </button>
                                  {loadOptionsOpen && (
                                    <div className="absolute z-50 w-[480px] border rounded-md bg-background shadow-lg p-0 mt-1">
                                      <div className="grid grid-cols-3 border-b">
                                        {(['presets', 'paste', 'from_property'] as const).map((tab) => (
                                          <button key={tab}
                                            onClick={() => setLoadOptionsTab(tab)}
                                            className={`py-2 text-sm font-medium border-b-2 transition-colors ${
                                              loadOptionsTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                                            }`}>
                                            {tab === 'presets' ? 'Presets' : tab === 'paste' ? 'Paste your own' : 'From property'}
                                          </button>
                                        ))}
                                      </div>
                                      <div className="p-4 space-y-4">
                                        {loadOptionsTab === 'presets' && (
                                          <div className="space-y-3">
                                            <div className="space-y-1">
                                              <label className="text-sm font-medium">Load preset</label>
                                              <select value={loadPreset} onChange={e => setLoadPreset(e.target.value)}
                                                className="w-full border rounded-md px-3 py-2 text-sm">
                                                <option value="">Search</option>
                                                <option value="yes_no">Yes / No</option>
                                                <option value="agree_disagree">Agree / Disagree</option>
                                                <option value="priority">High / Medium / Low</option>
                                              </select>
                                            </div>
                                            <div className="flex gap-2">
                                              <button
                                                disabled={!loadPreset}
                                                onClick={() => handleLoadPreset(loadPreset)}
                                                className="px-4 py-1.5 text-sm border rounded-md disabled:opacity-50 hover:bg-muted">
                                                Load options
                                              </button>
                                              <button onClick={() => setLoadOptionsOpen(false)}
                                                className="px-4 py-1.5 text-sm border rounded-md hover:bg-muted">
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                        {loadOptionsTab === 'paste' && (
                                          <div className="space-y-3">
                                            <div className="space-y-1">
                                              <label className="text-sm font-medium">Place your options on their own line</label>
                                              <textarea
                                                value={pasteOptionsText}
                                                onChange={e => setPasteOptionsText(e.target.value)}
                                                rows={5}
                                                placeholder={"Cat\nDog\nFish"}
                                                className="w-full border rounded-md px-3 py-2 text-sm resize-none outline-none"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-sm font-medium">Add a delimiter (optional)</label>
                                              <input type="text" value={pasteDelimiter} onChange={e => setPasteDelimiter(e.target.value)} aria-label="Paste delimiter"
                                                className="w-full border rounded-md px-3 py-2 text-sm outline-none" />
                                              <p className="text-xs text-muted-foreground">
                                                Use a comma, semi-colon, or any custom text to separate labels from values (for example, "label 1, value 1" or "label 2; value 2")
                                              </p>
                                            </div>
                                            <div className="flex gap-2">
                                              <button
                                                disabled={!pasteOptionsText.trim()}
                                                onClick={() => handlePasteOptions()}
                                                className="px-4 py-1.5 text-sm border rounded-md disabled:opacity-50 hover:bg-muted">
                                                Load options
                                              </button>
                                              <button onClick={() => setLoadOptionsOpen(false)}
                                                className="px-4 py-1.5 text-sm border rounded-md hover:bg-muted">
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                        {loadOptionsTab === 'from_property' && (
                                          <div className="space-y-3">
                                            <div className="space-y-1">
                                              <label className="text-sm font-medium">Object type</label>
                                              <select value={fromPropertyObjectType} onChange={e => setFromPropertyObjectType(e.target.value)}
                                                className="w-full border rounded-md px-3 py-2 text-sm">
                                                <option value="">Search</option>
                                                <option value="contact">Contact</option>
                                                <option value="company">Company</option>
                                                <option value="deal">Deal</option>
                                              </select>
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-sm font-medium">Property to copy options from</label>
                                              <select value={fromPropertySelected} onChange={e => setFromPropertySelected(e.target.value)}
                                                disabled={!fromPropertyObjectType}
                                                className="w-full border rounded-md px-3 py-2 text-sm disabled:opacity-50">
                                                <option value="">Search</option>
                                              </select>
                                            </div>
                                            <div className="flex gap-2">
                                              <button
                                                disabled={!fromPropertySelected}
                                                onClick={() => handleLoadFromProperty()}
                                                className="px-4 py-1.5 text-sm border rounded-md disabled:opacity-50 hover:bg-muted">
                                                Load options
                                              </button>
                                              <button onClick={() => setLoadOptionsOpen(false)}
                                                className="px-4 py-1.5 text-sm border rounded-md hover:bg-muted">
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <button type="button" onClick={clearOptions}>🗑 Clear all options</button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // 11c. Radio Select (Unified UI — mirrors dropdown_select)
                      if (ft === "radio_select") {
                        const radio_options = form.radio_options;
                        const radio_search = form.radio_search;
                        const radio_sort = form.radio_sort;
                        const radio_option_style = form.radio_option_style;

                        const toggleInForms = (id: string) => {
                          setForm(p => ({
                            ...p,
                            radio_options: p.radio_options.map(opt =>
                              opt.id === id ? { ...opt, in_forms: !opt.in_forms } : opt
                            )
                          }));
                        };

                        const addOption = () => {
                          const newOpt = {
                            id: crypto.randomUUID(),
                            order: form.radio_options.length + 1,
                            label: '',
                            internal_name: '',
                            in_forms: true
                          };
                          setForm(p => ({ ...p, radio_options: [...p.radio_options, newOpt] }));
                        };

                        const clearOptions = () => {
                          setForm(p => ({ ...p, radio_options: [] }));
                        };

                        let displayed = [...radio_options];
                        if (radio_search) {
                          displayed = displayed.filter(o =>
                            o.label.toLowerCase().includes(radio_search.toLowerCase())
                          );
                        }
                        if (radio_sort === 'alphabetical') {
                          displayed.sort((a, b) => a.label.localeCompare(b.label));
                        } else {
                          displayed.sort((a, b) => a.order - b.order);
                        }

                        return (
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <Label className="font-normal cursor-pointer">Default value</Label>
                              <Select
                                value={form.radio_default_value || ""}
                                onValueChange={(val) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    radio_default_value: val === "none_selected_radio" ? "" : val,
                                  }))
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select default value" />
                                </SelectTrigger>
                                <SelectContent className="z-[200]">
                                  <SelectItem value="none_selected_radio">Select default value</SelectItem>
                                  {radio_options.map((opt) => (
                                    <SelectItem key={opt.internal_name || opt.id} value={opt.internal_name}>
                                      {opt.label || "(empty)"}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="font-normal cursor-pointer">Option style</Label>
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setForm(p => ({ ...p, radio_option_style: 'default' }))}
                                  className={cn(
                                    "px-3 py-2 rounded border font-medium text-sm transition-all",
                                    radio_option_style === 'default'
                                      ? "border-2 border-primary bg-muted font-bold"
                                      : "border"
                                  )}
                                >
                                  Default
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setForm(p => ({ ...p, radio_option_style: 'with_dot' }))}
                                  className={cn(
                                    "px-3 py-2 rounded border font-medium text-sm transition-all flex items-center justify-center gap-1.5",
                                    radio_option_style === 'with_dot'
                                      ? "border-2 border-primary bg-muted font-bold"
                                      : "border"
                                  )}
                                >
                                  • With dot
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setForm(p => ({ ...p, radio_option_style: 'badge' }))}
                                  className={cn(
                                    "px-3 py-2 rounded border font-medium text-sm transition-all flex items-center justify-center gap-2",
                                    radio_option_style === 'badge'
                                      ? "border-2 border-primary bg-muted font-bold"
                                      : "border"
                                  )}
                                >
                                  <span className="px-2 py-0.5 rounded-full bg-primary text-white text-xs">Badge</span>
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="relative">
                                <Input
                                  placeholder="Search"
                                  value={radio_search}
                                  onChange={(e) => setForm(p => ({ ...p, radio_search: e.target.value }))}
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              </div>
                              <select
                                value={radio_sort}
                                onChange={(e) => setForm(p => ({ ...p, radio_sort: e.target.value }))}
                                className="h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                <option value="custom">Custom</option>
                                <option value="alphabetical">Alphabetical</option>
                              </select>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-medium">Radio options ({radio_options.length})</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const text = radio_options.map(o => `${o.label}\t${o.internal_name}`).join('\n');
                                    navigator.clipboard.writeText(text);
                                    toast.success("Options copied to clipboard!");
                                  }}
                                  className="text-sm text-primary underline"
                                >
                                  Copy option labels and internal names
                                </button>
                              </div>

                              <table className="w-full text-sm border-collapse">
                                <thead>
                                  <tr className="border-b text-left text-xs font-semibold text-muted-foreground uppercase">
                                     <th scope="col" className="py-2 w-8"></th>
                                    <th scope="col" className="py-2 w-8"><input type="checkbox" aria-label="Select all options" className="rounded border-border" /></th>
                                    <th scope="col" className="py-2 w-16">Order</th>
                                    <th scope="col" className="py-2">Label</th>
                                    <th scope="col" className="py-2">Internal name</th>
                                    <th scope="col" className="py-2 w-20 text-center">In Forms</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {displayed.map((opt, i) => (
                                    <tr key={opt.id} className="border-b">
                                      <td className="py-2">⠿</td>
                                      <td className="py-2"><input type="checkbox" aria-label="Select option" className="rounded border-border" /></td>
                                      <td className="py-2">
                                        <Input
                                          type="number"
                                          value={opt.order}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            setForm(p => ({
                                              ...p,
                                              checkbox_options: p.checkbox_options.map(o =>
                                                o.id === opt.id ? { ...o, order: val } : o
                                              )
                                            }));
                                          }}
                                          className="w-16 h-8"
                                        />
                                      </td>
                                      <td className="py-2">
                                        <Input
                                          type="text"
                                          value={opt.label}
                                          onChange={(e) => {
                                            const label = e.target.value;
                                            const internal = label.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
                                            setForm(p => ({
                                              ...p,
                                              radio_options: p.radio_options.map(o =>
                                                o.id === opt.id ? { ...o, label, internal_name: internal } : o
                                              )
                                            }));
                                          }}
                                          className="h-8"
                                        />
                                      </td>
                                      <td className="py-2">
                                        <Input
                                          type="text"
                                          value={opt.internal_name}
                                          onChange={(e) => {
                                            const internal = e.target.value;
                                            setForm(p => ({
                                              ...p,
                                              radio_options: p.radio_options.map(o =>
                                                o.id === opt.id ? { ...o, internal_name: internal } : o
                                              )
                                            }));
                                          }}
                                          className="h-8"
                                        />
                                      </td>
                                      <td className="py-2 text-center">
                                        <button
                                          type="button"
                                          onClick={() => toggleInForms(opt.id)}
                                          className={cn(
                                            "px-2.5 py-1 text-xs rounded transition-all font-semibold",
                                            opt.in_forms
                                              ? "bg-foreground text-background"
                                              : "bg-muted text-muted-foreground"
                                          )}
                                        >
                                          ✓
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>

                              <div className="flex gap-4 mt-2 text-sm text-primary">
                                <button type="button" onClick={addOption}>+ Add option</button>
                                <div className="relative" ref={loadOptionsRef}>
                                  <button
                                    type="button"
                                    onClick={() => setLoadOptionsOpen(!loadOptionsOpen)}
                                    className="text-sm text-primary flex items-center gap-1"
                                  >
                                    ≡ Load options
                                  </button>
                                  {loadOptionsOpen && (
                                    <div className="absolute z-50 w-[480px] border rounded-md bg-background shadow-lg p-0 mt-1">
                                      <div className="grid grid-cols-3 border-b">
                                        {(['presets', 'paste', 'from_property'] as const).map((tab) => (
                                          <button key={tab}
                                            onClick={() => setLoadOptionsTab(tab)}
                                            className={`py-2 text-sm font-medium border-b-2 transition-colors ${
                                              loadOptionsTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                                            }`}>
                                            {tab === 'presets' ? 'Presets' : tab === 'paste' ? 'Paste your own' : 'From property'}
                                          </button>
                                        ))}
                                      </div>
                                      <div className="p-4 space-y-4">
                                        {loadOptionsTab === 'presets' && (
                                          <div className="space-y-3">
                                            <div className="space-y-1">
                                              <label className="text-sm font-medium">Load preset</label>
                                              <select value={loadPreset} onChange={e => setLoadPreset(e.target.value)}
                                                className="w-full border rounded-md px-3 py-2 text-sm">
                                                <option value="">Search</option>
                                                <option value="yes_no">Yes / No</option>
                                                <option value="agree_disagree">Agree / Disagree</option>
                                                <option value="priority">High / Medium / Low</option>
                                              </select>
                                            </div>
                                            <div className="flex gap-2">
                                              <button
                                                disabled={!loadPreset}
                                                onClick={() => handleLoadPreset(loadPreset)}
                                                className="px-4 py-1.5 text-sm border rounded-md disabled:opacity-50 hover:bg-muted">
                                                Load options
                                              </button>
                                              <button onClick={() => setLoadOptionsOpen(false)}
                                                className="px-4 py-1.5 text-sm border rounded-md hover:bg-muted">
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                        {loadOptionsTab === 'paste' && (
                                          <div className="space-y-3">
                                            <div className="space-y-1">
                                              <label className="text-sm font-medium">Place your options on their own line</label>
                                              <textarea
                                                value={pasteOptionsText}
                                                onChange={e => setPasteOptionsText(e.target.value)}
                                                rows={5}
                                                placeholder={"Cat\nDog\nFish"}
                                                className="w-full border rounded-md px-3 py-2 text-sm resize-none outline-none"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-sm font-medium">Add a delimiter (optional)</label>
                                              <input type="text" value={pasteDelimiter} onChange={e => setPasteDelimiter(e.target.value)} aria-label="Paste delimiter"
                                                className="w-full border rounded-md px-3 py-2 text-sm outline-none" />
                                              <p className="text-xs text-muted-foreground">
                                                Use a comma, semi-colon, or any custom text to separate labels from values (for example, "label 1, value 1" or "label 2; value 2")
                                              </p>
                                            </div>
                                            <div className="flex gap-2">
                                              <button
                                                disabled={!pasteOptionsText.trim()}
                                                onClick={() => handlePasteOptions()}
                                                className="px-4 py-1.5 text-sm border rounded-md disabled:opacity-50 hover:bg-muted">
                                                Load options
                                              </button>
                                              <button onClick={() => setLoadOptionsOpen(false)}
                                                className="px-4 py-1.5 text-sm border rounded-md hover:bg-muted">
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                        {loadOptionsTab === 'from_property' && (
                                          <div className="space-y-3">
                                            <div className="space-y-1">
                                              <label className="text-sm font-medium">Object type</label>
                                              <select value={fromPropertyObjectType} onChange={e => setFromPropertyObjectType(e.target.value)}
                                                className="w-full border rounded-md px-3 py-2 text-sm">
                                                <option value="">Search</option>
                                                <option value="contact">Contact</option>
                                                <option value="company">Company</option>
                                                <option value="deal">Deal</option>
                                              </select>
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-sm font-medium">Property to copy options from</label>
                                              <select value={fromPropertySelected} onChange={e => setFromPropertySelected(e.target.value)}
                                                disabled={!fromPropertyObjectType}
                                                className="w-full border rounded-md px-3 py-2 text-sm disabled:opacity-50">
                                                <option value="">Search</option>
                                              </select>
                                            </div>
                                            <div className="flex gap-2">
                                              <button
                                                disabled={!fromPropertySelected}
                                                onClick={() => handleLoadFromProperty()}
                                                className="px-4 py-1.5 text-sm border rounded-md disabled:opacity-50 hover:bg-muted">
                                                Load options
                                              </button>
                                              <button onClick={() => setLoadOptionsOpen(false)}
                                                className="px-4 py-1.5 text-sm border rounded-md hover:bg-muted">
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <button type="button" onClick={clearOptions}>🗑 Clear all options</button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // 12. Boolean / Single Checkbox
                      if (["single_checkbox", "boolean_checkbox"].includes(ft)) {
                        return (
                          <div className="space-y-3">
                            <Label className="font-normal cursor-pointer">
                              Default value
                            </Label>
                            <Select
                              value={form.default_value === "true" ? "true" : form.default_value === "false" ? "false" : ""}
                              onValueChange={(val) =>
                                setForm((prev) => ({
                                  ...prev,
                                  default_value: val === "none_selected_boolean" ? null : val,
                                }))
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select default status (optional)" />
                              </SelectTrigger>
                              <SelectContent className="z-[200]">
                                <SelectItem value="none_selected_boolean">None</SelectItem>
                                <SelectItem value="true">Yes / True (checked)</SelectItem>
                                <SelectItem value="false">No / False (unchecked)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      }

                      // 13. Color Picker
                      if (ft === "color_picker") {
                        return (
                          <div className="space-y-3">
                            <Label className="font-normal cursor-pointer">
                              Default value
                            </Label>
                            <div className="flex gap-2">
                              <div className="relative w-12 h-10 rounded-md overflow-hidden border border-border shrink-0">
                                <input
                                  type="color"
                                  value={form.default_value || "#000000"}
                                  onChange={(e) =>
                                    setForm((prev) => ({ ...prev, default_value: e.target.value }))
                                  }
                                  className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer"
                                />
                              </div>
                              <Input
                                type="text"
                                value={form.default_value || ""}
                                onChange={handleInputChange}
                                name="default_value"
                                placeholder="#ffffff"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        );
                      }

                      // 14. Calculation
                      if (ft === "calculation") {
                        return <CalculationEditor form={form} setForm={setForm} objectType={objectType} />;
                      }
                      // 15. Rollup
                      if (ft === "rollup") {
                        return <RollupEditor form={form} setForm={setForm} />;
                      }
                      // 15b. Property Sync — associated record type only
                      if (ft === "property_sync") {
                        const RECORD_TYPES = [
                          'Call', 'Campaign', 'Cart', 'Company', 'Contact',
                          'Credit memo', 'Deal', 'Invoice', 'Meeting', 'Order',
                          'Payment', 'Quote', 'Subscription', 'Ticket'
                        ];

                        return (
                          <div className="space-y-6">
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

                      // 16. HubSpot user / SalesHub user
                      if (ft === "hubspot_user") {
                        return <HubSpotUserEditor form={form} setForm={setForm} workspaceMembers={workspaceMembers} />;
                      }
                      // 17. File
                      if (ft === "file") {
                        return <FileFieldEditor form={form} setForm={setForm} />;
                      }
                      // 18. Non-defaultable types
                      if (["owner"].includes(ft)) {
                        return (
                          <div className="p-3 rounded-md bg-accent border border-border">
                            <p className="text-[13px] text-muted-foreground/60">
                              Default values are not supported for user/owner assignments.
                            </p>
                          </div>
                        );
                      }

                      // Fallback
                      return (
                        <div className="space-y-3">
                          <Label className="font-normal cursor-pointer">
                            Default value
                          </Label>
                          <Input
                            name="default_value"
                            value={form.default_value || ""}
                            onChange={handleInputChange}
                            placeholder="Enter default value (optional)"
                            className="w-full"
                          />
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {step === "rules" && (
                <RulesStep
                  form={form}
                  handleCheckboxChange={handleCheckboxChange}
                  handleRadioChange={handleRadioChange}
                  handleNumberChange={handleNumberChange}
                />
              )}

              {step === "manage-access" && (
                <ManageAccessStep />
              )}

              {step === "preview" && (
                <PreviewStep
                  form={form}
                  internalName={internalName}
                  getFieldTypeIcon={getFieldTypeIcon}
                />
              )}
            </section>

            <footer className="flex-shrink-0 bg-primary-foreground border-t border-border px-8 py-4">
              <div className="flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving || !form.label.trim() || !form.field_type}
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-6"
                >
                  {saving ? 'Creating...' : 'Create property'}
                </Button>
              </div>
            </footer>
          </main>
        </div>
      </SheetContent>
    </Sheet>
  );
}
