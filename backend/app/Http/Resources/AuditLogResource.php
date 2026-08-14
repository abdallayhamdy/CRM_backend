<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category' => $this->category ?? 'Settings',
            'subcategory' => $this->subcategory,
            'action' => $this->formatAction($this->action),
            'modified_by_name' => $this->user?->name,
            'modified_by_email' => $this->user?->email,
            'modified_by_avatar' => null,
            'assisted_by' => $this->assisted_by,
            'source' => $this->source,
            'source_url' => $this->source_url,
            'record_id' => $this->auditable_id,
            'record_type' => $this->auditable_type,
            'date_of_change' => $this->created_at?->toISOString(),
        ];
    }

    private function formatAction(string $action): string
    {
        return match ($action) {
            'created' => 'Create',
            'updated' => 'Update',
            'deleted' => 'Delete',
            'viewed' => 'View',
            default => ucfirst($action),
        };
    }
}
