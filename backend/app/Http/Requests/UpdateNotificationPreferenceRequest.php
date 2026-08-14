<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationPreferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'topic_preferences' => 'sometimes|nullable|array',
            'topic_preferences.*' => 'array',
            'channels' => 'sometimes|nullable|array',
            'channels.email' => 'sometimes|boolean',
            'channels.bell' => 'sometimes|boolean',
            'channels.browser' => 'sometimes|boolean',
            'channels.popup' => 'sometimes|boolean',
            'new_leads' => 'sometimes|boolean',
            'task_reminders' => 'sometimes|boolean',
            'weekly_digest' => 'sometimes|boolean',
            'browser_alerts' => 'sometimes|boolean',
        ];
    }
}
