export interface PropertyFormState {
  object_type: string;
  label: string;
  description: string;
  group_name: string;
  field_type: string;
  default_value: string | null;
  showInForms: boolean;
  isRequired: boolean;
  require_unique: boolean;
  require_min_chars: boolean;
  min_chars: number | null;
  limit_max_chars: boolean;
  max_chars: number | null;
  auto_remove_disallowed: boolean;
  allowed_characters: "all" | "numbers_only" | "no_symbols";
  allowed_spaces: "all" | "no_leading_trailing" | "no_spaces";
  case_sensitivity:
    | "not_sensitive"
    | "uppercase_only"
    | "lowercase_only"
    | "title_casing";
  numberFormat: 'formatted' | 'unformatted' | 'currency' | 'percentage';
  dateDisplayFormat: 'date_only' | 'date_with_relative';
  date_display_format: string;
  options: Array<{ label: string; value: string }>;
  checkboxOptions: Array<{
    id: string;
    order: number;
    label: string;
    internalName: string;
    inForms: boolean;
    color?: string;
  }>;
  checkboxDefaultValue: string;
  checkboxOptionStyle: 'default' | 'badge';
  checkboxSearch: string;
  checkboxSort: 'search' | 'asc' | 'desc';
  option_style: 'default' | 'badge';
  checkbox_options: Array<{ id: string; order: number; label: string; internal_name: string; in_forms: boolean; color?: string }>;
  checkbox_search: string;
  checkbox_sort: string;
  checkbox_default_values: string[];
  datetime_display_format: string;
  datetime_default_date: string;
  datetime_default_time: string;
  dropdown_option_style: 'default' | 'with_dot' | 'badge';
  dropdown_options: Array<{ id: string; order: number; label: string; internal_name: string; in_forms: boolean; color?: string }>;
  dropdown_search: string;
  dropdown_sort: string;
  dropdown_default_value: string;
  radio_option_style: 'default' | 'with_dot' | 'badge';
  radio_options: Array<{ id: string; order: number; label: string; internal_name: string; in_forms: boolean; color?: string }>;
  radio_search: string;
  radio_sort: string;
  radio_default_value: string;
  calc_property_type: 'custom_equation' | 'time_between' | 'time_since' | 'time_until';
  calc_output_type: 'number' | 'boolean' | 'string' | 'date' | 'datetime';
  calc_number_format: string;
  calc_start_date_property: string;
  calc_end_date_property: string;
  calc_start_date_search: string;
  calc_end_date_search: string;
  calc_formula: string;
  rollup_type: 'min' | 'max' | 'count' | 'sum' | 'average' | 'earliest_date' | 'latest_date';
  rollup_number_format: string;
  rollup_associated_record_type: string;
  rollup_record_search: string;
  rollup_date_format: string;
  internal_name_override: string | null;
  user_selection_type: 'single' | 'multiple';
  user_search: string;
  show_multiple_users_confirm: boolean;
  file_access: 'private' | 'public';
}
