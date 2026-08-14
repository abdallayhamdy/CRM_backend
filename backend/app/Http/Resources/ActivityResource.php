<?php

namespace App\Http\Resources;

use App\Support\ActivityChangeParser;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $contactId = null;
        $dealId = null;
        $ticketId = null;
        $companyId = null;
        $entityType = null;
        $entityName = null;
        $entityRoute = null;
        $changes = ActivityChangeParser::parse($this->description);

        if ($this->activitable_type === 'App\Models\Contact') {
            $contactId = $this->activitable_id;
            $entityType = 'contact';
            $entityRoute = "/contacts/{$this->activitable_id}";
        } elseif ($this->activitable_type === 'App\Models\Deal') {
            $dealId = $this->activitable_id;
            $entityType = 'deal';
            $entityRoute = "/deals/{$this->activitable_id}";
        } elseif ($this->activitable_type === 'App\Models\Ticket') {
            $ticketId = $this->activitable_id;
            $entityType = 'ticket';
            $entityRoute = "/tickets/{$this->activitable_id}";
        } elseif ($this->activitable_type === 'App\Models\Company') {
            $companyId = $this->activitable_id;
            $entityType = 'company';
            $entityRoute = "/companies/{$this->activitable_id}";
        } elseif ($this->activitable_type === 'App\Models\Task') {
            $entityType = 'task';
            $entityRoute = "/tasks";
        } elseif ($this->activitable_type === 'App\Models\Note') {
            $entityType = 'note';
        } elseif ($this->activitable_type === 'App\Models\Document') {
            $entityType = 'document';
            $entityRoute = "/documents";
        } elseif ($this->activitable_type === 'App\Models\Order') {
            $entityType = 'order';
            $entityRoute = "/orders";
        } elseif ($this->activitable_type === 'App\Models\Product') {
            $entityType = 'product';
            $entityRoute = "/products";
        }

        if ($this->relationLoaded('activitable') && $this->activitable) {
            $related = $this->activitable;
            if ($related instanceof \App\Models\Contact) {
                $entityName = trim(($related->first_name ?? '') . ' ' . ($related->last_name ?? '')) ?: ($related->email ?? '');
            } elseif ($related instanceof \App\Models\Company) {
                $entityName = $related->name ?? '';
            } elseif ($related instanceof \App\Models\Deal) {
                $entityName = $related->title ?? '';
            } elseif ($related instanceof \App\Models\Task) {
                $entityName = $related->title ?? '';
            } elseif ($related instanceof \App\Models\Ticket) {
                $entityName = $related->subject ?? '';
            } elseif ($related instanceof \App\Models\Order) {
                $entityName = $related->title ?? '';
            } elseif ($related instanceof \App\Models\Product) {
                $entityName = $related->name ?? '';
            } elseif ($related instanceof \App\Models\Note) {
                $entityName = mb_substr($related->content ?? '', 0, 60);
            } elseif ($related instanceof \App\Models\Document) {
                $entityName = $related->name ?? '';
            }
        }

        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->subject,
            'description' => $this->description,
            'contact_id' => $contactId,
            'deal_id' => $dealId,
            'ticket_id' => $ticketId,
            'company_id' => $companyId,
            'entity_type' => $entityType,
            'entity_name' => $entityName,
            'entity_route' => $entityRoute,
            'entity_id' => $this->activitable_id,
            'changes' => $changes,
            'has_changes' => $changes !== [],
            'owner_id' => $this->user_id,
            'owner' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'first_name' => $this->user->first_name ?? $this->user->name,
                    'last_name' => $this->user->last_name ?? '',
                ];
            }),
            'workspace_id' => $this->workspace_id,
            'activity_date' => $this->activity_date?->format('Y-m-d H:i:s'),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}