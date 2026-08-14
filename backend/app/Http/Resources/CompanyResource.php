<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompanyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $customData = $this->custom_data ?? [];

        return [
            'id' => $this->id,
            'name' => $this->name,
            'domain' => $this->website,
            'industry' => $this->industry,
            'phone' => $this->phone,
            'owner_id' => $this->assigned_to,
            'owner' => $this->whenLoaded('assignee', function () {
                if (!$this->assignee) return null;
                return [
                    'id' => $this->assignee->id,
                    'first_name' => $this->assignee->first_name ?? $this->assignee->name,
                    'last_name' => $this->assignee->last_name ?? '',
                ];
            }),
            'lifecycle_stage' => $this->whenLoaded('stage', function () {
                return $this->stage?->slug;
            }),
            'custom_fields' => $customData,
            'workspace_id' => $this->workspace_id,
            'size' => $customData['size'] ?? null,
            'description' => $customData['description'] ?? null,
            'address' => $customData['address'] ?? null,
            'city' => $customData['city'] ?? null,
            'state' => $customData['state'] ?? null,
            'postal_code' => $customData['postal_code'] ?? null,
            'country' => $customData['country'] ?? null,
            'employee_count' => $customData['employee_count'] ?? null,
            'annual_revenue' => $customData['annual_revenue'] ?? null,
            'time_zone' => $customData['time_zone'] ?? null,
            'linkedin_url' => $customData['linkedin_url'] ?? null,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            'activities' => ActivityResource::collection($this->whenLoaded('activities')),
            'notes' => NoteResource::collection($this->whenLoaded('notes')),
            'tasks' => TaskResource::collection($this->whenLoaded('tasks')),
        ];
    }
}
