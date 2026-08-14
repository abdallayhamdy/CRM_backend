<?php

namespace App\Http\Resources\SuperAdmin;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmailTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'name' => $this->name,
            'subject' => $this->subject,
            'body' => $this->body,
            'is_active' => (bool) $this->is_active,
            'updated_at' => $this->updated_at
                ? Carbon::parse($this->updated_at)->toISOString()
                : null,
        ];
    }
}
