<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'subject' => $this->subject,
            'description' => $this->description,
            'status' => $this->status,
            'priority' => $this->priority,
            'contact_id' => $this->contact_id,
            'owner_id' => $this->assigned_to,
            'workspace_id' => $this->workspace_id,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            'contact' => new ContactResource($this->whenLoaded('contact')),
            'owner' => $this->whenLoaded('assignee', function () {
                if (!$this->assignee) return null;
                return [
                    'id' => $this->assignee->id,
                    'first_name' => $this->assignee->first_name ?? $this->assignee->name,
                    'last_name' => $this->assignee->last_name ?? '',
                ];
            }),
            'activities' => ActivityResource::collection($this->whenLoaded('activities')),
            'custom_fields' => $this->custom_data ?? [],
        ];
    }
}
