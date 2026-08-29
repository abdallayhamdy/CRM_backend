<?php

namespace App\Traits;

use App\Models\Property;
use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\AllowedFilter;

trait HasCustomDataFilter
{
    protected function customDataFilters(string $objectType, string $tableAlias = '', array $exclude = []): array
    {
        $propertyNames = Property::where('object_type', $objectType)
            ->where('is_archived', false)
            ->pluck('name')
            ->filter(fn (string $name) => !in_array($name, $exclude, true))
            ->toArray();

        $filters = [];
        foreach ($propertyNames as $propName) {
            $columnPath = $tableAlias ? "{$tableAlias}.custom_data" : 'custom_data';
            $filters[] = AllowedFilter::callback($propName, function (Builder $query, $value) use ($columnPath, $propName) {
                $values = is_array($value) ? $value : array_map('trim', explode(',', $value));
                $query->where(function (Builder $q) use ($values, $columnPath, $propName) {
                    foreach ($values as $val) {
                        $q->orWhereRaw("JSON_UNQUOTE(JSON_EXTRACT({$columnPath}, '$.{$propName}')) = ?", [$val]);
                    }
                });
            });
        }

        return $filters;
    }
}
