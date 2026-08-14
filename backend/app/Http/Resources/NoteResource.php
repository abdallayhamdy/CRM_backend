<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $contactId = null;
        $companyId = null;
        $dealId = null;
        $ticketId = null;

        if ($this->notable_type === 'App\Models\Contact') {
            $contactId = $this->notable_id;
        } elseif ($this->notable_type === 'App\Models\Company') {
            $companyId = $this->notable_id;
        } elseif ($this->notable_type === 'App\Models\Deal') {
            $dealId = $this->notable_id;
        } elseif ($this->notable_type === 'App\Models\Ticket') {
            $ticketId = $this->notable_id;
        }

        return [
            'id' => $this->id,
            'content' => $this->content,
            'contact_id' => $contactId,
            'company_id' => $companyId,
            'deal_id' => $dealId,
            'ticket_id' => $ticketId,
            'type' => class_basename($this->notable_type),
            'notable_id' => $this->notable_id,
            'created_by' => $this->user_id,
            'author' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'first_name' => $this->user->first_name ?? $this->user->name,
                    'last_name' => $this->user->last_name ?? '',
                ];
            }),
            'workspace_id' => $this->workspace_id,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
