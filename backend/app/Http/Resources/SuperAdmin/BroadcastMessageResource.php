<?php

namespace App\Http\Resources\SuperAdmin;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BroadcastMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'message' => $this->message,
            'audience' => $this->audience,
            'sent_by' => $this->sent_by,
            'recipient_count' => $this->recipient_count,
            'sent_at' => $this->sent_at ? Carbon::parse($this->sent_at)->toISOString() : null,
        ];
    }
}
