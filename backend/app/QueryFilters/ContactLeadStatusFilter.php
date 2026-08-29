<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class ContactLeadStatusFilter implements Filter
{
    public function __invoke(Builder $query, mixed $value, string $property): void
    {
        // lead_status is stored in the custom_data JSON column
        // Support both single value ("New") and comma-separated values ("New,Open,Connected")
        // Matching is case-insensitive because stored values and UI labels may differ in case.
        $statuses = is_array($value) ? $value : array_map('trim', explode(',', $value));

        $query->where(function (Builder $q) use ($statuses) {
            foreach ($statuses as $status) {
                $q->orWhereRaw("LOWER(JSON_UNQUOTE(JSON_EXTRACT(custom_data, '$.lead_status'))) = ?", [mb_strtolower($status)]);
            }
        });
    }
}