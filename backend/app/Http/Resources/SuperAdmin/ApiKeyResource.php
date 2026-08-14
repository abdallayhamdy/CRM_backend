<?php

namespace App\Http\Resources\SuperAdmin;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApiKeyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'key_preview' => $this->key_prefix . '••••••' . $this->key_tail,
            'created_at' => Carbon::parse($this->created_at)->toISOString(),
            'last_used_at' => $this->last_used_at
                ? Carbon::parse($this->last_used_at)->toISOString()
                : null,
            'status' => $this->status(),
        ];
    }
}
