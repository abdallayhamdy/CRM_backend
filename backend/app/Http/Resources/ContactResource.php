<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContactResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $customData = $this->custom_data ?? [];

        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'company_name' => $this->company_name,
            'company' => new CompanyResource($this->whenLoaded('company')),
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
            'emailOptOut' => $customData['email_opt_out'] ?? false,
            'source' => $customData['source'] ?? null,
            'lead_status' => $customData['lead_status'] ?? null,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            'activities' => ActivityResource::collection($this->whenLoaded('activities')),
            'notes' => NoteResource::collection($this->whenLoaded('notes')),
            'deals' => DealResource::collection($this->whenLoaded('deals')),
            'tasks' => TaskResource::collection($this->whenLoaded('tasks')),
        ];
    }
}
