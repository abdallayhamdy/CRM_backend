<?php

namespace App\Traits;

use App\Models\Property;
use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\AllowedFilter;

trait HasCustomDataFilter
{
    /**
     * Properties whose values live in dedicated table columns instead of
     * custom_data. Maps property name => qualified column.
     */
    protected function columnFilterProps(string $objectType): array
    {
        if ($objectType === 'contact') {
            return [
                'first_name' => 'contacts.first_name',
                'last_name' => 'contacts.last_name',
                'email' => 'contacts.email',
                'phone_number' => 'contacts.phone',
            ];
        }

        if ($objectType === 'company') {
            return [
                'name' => 'companies.name',
                'industry' => 'companies.industry',
                'website' => 'companies.website',
                'phone_number' => 'companies.phone',
                'email' => 'companies.email',
            ];
        }

        return [];
    }

    protected function customDataFilters(string $objectType, string $tableAlias = '', array $exclude = []): array
    {
        $columnProps = $this->columnFilterProps($objectType);

        $properties = Property::where('object_type', $objectType)
            ->where('is_archived', false)
            ->get(['name', 'field_type'])
            ->filter(fn (Property $prop) => !in_array($prop->name, $exclude, true));

        $filters = [];
        foreach ($properties as $prop) {
            $name = $prop->name;

            // 1) Values stored in dedicated columns (first_name, last_name, email, phone…)
            if (isset($columnProps[$name])) {
                $column = $columnProps[$name];
                $filters[] = AllowedFilter::callback($name, function (Builder $query, $value) use ($column) {
                    foreach ($this->normalizeValues($value) as $val) {
                        $query->where($column, 'like', '%' . $val . '%');
                    }
                });
                continue;
            }

            // 2) Notes live in the related notes table
            if ($objectType === 'contact' && $name === 'notes') {
                $filters[] = AllowedFilter::callback('notes', function (Builder $query, $value) {
                    $values = $this->normalizeValues($value);
                    $query->whereHas('notes', function (Builder $q) use ($values) {
                        $q->where(function (Builder $sq) use ($values) {
                            foreach ($values as $val) {
                                $sq->orWhere('notes.content', 'like', '%' . $val . '%');
                            }
                        });
                    });
                });
                continue;
            }

            $columnPath = $tableAlias ? "{$tableAlias}.custom_data" : 'custom_data';

            // 3) Booleans are stored as JSON true/false; sidebar sends Yes/No labels
            if (in_array($prop->field_type, ['boolean', 'boolean_checkbox'], true)) {
                $filters[] = AllowedFilter::callback($name, function (Builder $query, $value) use ($columnPath, $name) {
                    $normalized = [];
                    foreach ($this->normalizeValues($value) as $val) {
                        $bool = $this->normalizeBoolean($val);
                        $normalized[] = $bool === null ? (string) $val : ($bool ? 'true' : 'false');
                    }
                    if (!$normalized) {
                        return;
                    }
                    $query->where(function (Builder $q) use ($columnPath, $name, $normalized) {
                        foreach ($normalized as $val) {
                            $q->orWhereRaw("JSON_UNQUOTE(JSON_EXTRACT({$columnPath}, '$.{$name}')) = ?", [$val]);
                        }
                    });
                });
                continue;
            }

            // 4) Date-typed custom properties support exact values and from/to ranges
            if (in_array($prop->field_type, ['date', 'datetime', 'date_picker'], true)) {
                $filters[] = AllowedFilter::callback($name, function (Builder $query, $value) use ($columnPath, $name) {
                    if (is_array($value) && (isset($value['from']) || isset($value['to']))) {
                        if (!empty($value['from'])) {
                            $query->whereRaw("JSON_UNQUOTE(JSON_EXTRACT({$columnPath}, '$.{$name}')) >= ?", [$value['from'] . ' 00:00:00']);
                        }
                        if (!empty($value['to'])) {
                            $query->whereRaw("JSON_UNQUOTE(JSON_EXTRACT({$columnPath}, '$.{$name}')) <= ?", [$value['to'] . ' 23:59:59']);
                        }
                        return;
                    }
                    $query->where(function (Builder $q) use ($columnPath, $name, $value) {
                        foreach ($this->normalizeValues($value) as $val) {
                            $q->orWhereRaw("LOWER(JSON_UNQUOTE(JSON_EXTRACT({$columnPath}, '$.{$name}'))) = ?", [mb_strtolower(trim((string) $val))]);
                        }
                    });
                });
                continue;
            }

            // 5) Everything else lives in custom_data (case-insensitive equality)
            $filters[] = AllowedFilter::callback($name, function (Builder $query, $value) use ($columnPath, $name) {
                $query->where(function (Builder $q) use ($columnPath, $name, $value) {
                    foreach ($this->normalizeValues($value) as $val) {
                        $q->orWhereRaw("LOWER(JSON_UNQUOTE(JSON_EXTRACT({$columnPath}, '$.{$name}'))) = ?", [mb_strtolower(trim((string) $val))]);
                    }
                });
            });
        }

        return $filters;
    }

    protected function normalizeValues(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }
        if (is_bool($value)) {
            return [$value];
        }
        if ($value === null || $value === '') {
            return [];
        }
        return array_map('trim', explode(',', (string) $value));
    }

    protected function normalizeBoolean(mixed $value): ?bool
    {
        if (is_bool($value)) {
            return $value;
        }
        if (is_int($value)) {
            return $value === 1;
        }
        $normalized = strtolower(trim((string) $value));
        if (in_array($normalized, ['true', 'yes', 'on', '1'], true)) {
            return true;
        }
        if (in_array($normalized, ['false', 'no', 'off', '0'], true)) {
            return false;
        }
        return null;
    }
}