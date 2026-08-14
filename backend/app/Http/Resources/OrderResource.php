<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'title' => $this->title,
            'status' => $this->status,
            'currency' => $this->currency,
            'subtotal' => (float) $this->subtotal,
            'discount' => (float) $this->discount,
            'tax' => (float) $this->tax,
            'shipping' => (float) $this->shipping,
            'total' => (float) $this->total,
            'contact_id' => $this->contact_id,
            'company_id' => $this->company_id,
            'owner_id' => $this->owner_id,
            'closed_at' => $this->closed_at?->format('Y-m-d H:i:s'),
            'workspace_id' => $this->workspace_id,
            'contact' => new ContactResource($this->whenLoaded('contact')),
            'company' => new CompanyResource($this->whenLoaded('company')),
            'owner' => $this->whenLoaded('owner', function () {
                if (!$this->owner) return null;
                return [
                    'id' => $this->owner->id,
                    'first_name' => $this->owner->first_name ?? $this->owner->name,
                    'last_name' => $this->owner->last_name ?? '',
                ];
            }),
            'line_items' => OrderLineItemResource::collection($this->whenLoaded('lineItems')),
            'custom_fields' => $this->custom_data ?? [],
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
