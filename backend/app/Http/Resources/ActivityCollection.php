<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class ActivityCollection extends ResourceCollection
{
    /**
     * @param  mixed  $resource
     * @param  array<string, string>  $nameMap  UUID → display name
     */
    public function __construct($resource, public array $nameMap = [])
    {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        return $this->collection
            ->map(fn ($activity) => new ActivityResource($activity, $this->nameMap))
            ->all();
    }

    public function with(Request $request): array
    {
        return [];
    }
}
