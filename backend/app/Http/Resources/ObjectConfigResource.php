<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ObjectConfigResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'object_type' => $this->object_type,
            'lifecycle_stages' => $this->lifecycle_stages ?? [],
            'display_style' => $this->display_style ?? 'colored_badge',
        ];
    }
}
