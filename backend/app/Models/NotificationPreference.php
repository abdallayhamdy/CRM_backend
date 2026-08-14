<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'topic_preferences',
        'channels',
        'new_leads',
        'task_reminders',
        'weekly_digest',
        'browser_alerts',
    ];

    protected function casts(): array
    {
        return [
            'topic_preferences' => 'array',
            'channels' => 'array',
            'new_leads' => 'boolean',
            'task_reminders' => 'boolean',
            'weekly_digest' => 'boolean',
            'browser_alerts' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
