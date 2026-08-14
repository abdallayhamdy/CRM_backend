<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationPreferenceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'topic_preferences' => $this->topic_preferences,
            'channels' => $this->channels ?? ['email' => true, 'bell' => true, 'browser' => true, 'popup' => true],
            'new_leads' => $this->new_leads,
            'task_reminders' => $this->task_reminders,
            'weekly_digest' => $this->weekly_digest,
            'browser_alerts' => $this->browser_alerts,
        ];
    }
}
