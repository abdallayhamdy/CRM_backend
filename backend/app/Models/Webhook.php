<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Webhook extends Model
{
    use HasUuids;

    public const EVENTS = [
        'tenant.created',
        'invoice.paid',
        'user.deactivated',
        'ticket.created',
        'broadcast.sent',
    ];

    protected $table = 'webhooks';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'url',
        'secret',
        'events',
        'is_active',
        'last_triggered_at',
    ];

    protected function casts(): array
    {
        return [
            'events' => 'array',
            'is_active' => 'boolean',
            'last_triggered_at' => 'datetime',
        ];
    }

    public function status(): string
    {
        return $this->is_active ? 'Active' : 'Disabled';
    }
}
