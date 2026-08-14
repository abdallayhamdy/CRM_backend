<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class ContactLifecycleStageFilter implements Filter
{
    public function __invoke(Builder $query, mixed $value, string $property): void
    {
        $slugs = is_array($value) ? $value : array_map('trim', explode(',', $value));

        $query->whereHas('stage', function (Builder $q) use ($slugs) {
            $q->whereIn('stages.slug', $slugs);
        });
    }
}
