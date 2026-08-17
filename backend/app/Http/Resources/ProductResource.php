<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $customData = $this->custom_data ?? [];

        return [
            'id' => $this->id,
            'name' => $this->name,
            'sku' => $this->sku,
            'unit_price' => (float) $this->unit_price,
            'status' => $this->status,
            'product_folder' => $this->product_folder,
            'product_type' => $customData['product_type'] ?? null,
            'product_description' => $customData['product_description'] ?? null,
            'workspace_id' => $this->workspace_id,
            'custom_fields' => $customData,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
