<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'object_type' => $this->object_type,
            'name' => $this->name,
            'label' => $this->label,
            'field_type' => $this->field_type,
            'group_name' => $this->group_name ?? '',
            'description' => $this->description ?? '',
            'is_required' => $this->is_required,
            'is_archived' => $this->is_archived,
            'show_in_forms' => $this->show_in_forms,
            'display_order' => $this->display_order,
            'created_by' => $this->relationLoaded('creator') ? ($this->creator?->name ?? '') : '',
            'options' => $this->options ?? [],
            'settings' => $this->settings ?? [],
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
