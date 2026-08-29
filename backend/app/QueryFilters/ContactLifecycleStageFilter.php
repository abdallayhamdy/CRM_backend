<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class ContactLifecycleStageFilter implements Filter
{
    public function __invoke(Builder $query, mixed $value, string $property): void
    {
        $values = is_array($value) ? $value : array_map('trim', explode(',', $value));

        $query->whereHas('stage', function (Builder $q) use ($values) {
            $q->where(function (Builder $inner) use ($values) {
                foreach ($values as $val) {
                    $inner->orWhere('stages.slug', $val)
                        ->orWhereRaw('LOWER(stages.name) = ?', [mb_strtolower(trim($val))]);
                }
            });
        });
    }
}