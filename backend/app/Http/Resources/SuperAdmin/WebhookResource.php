<?php

namespace App\Http\Resources\SuperAdmin;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WebhookResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => $this->url,
            'events' => $this->events,
            'status' => $this->status(),
            'last_triggered_at' => $this->last_triggered_at
                ? Carbon::parse($this->last_triggered_at)->toISOString()
                : null,
        ];
    }
}
