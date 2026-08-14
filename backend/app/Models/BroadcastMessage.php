<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BroadcastMessage extends Model
{
    use HasUuids;

    public const AUDIENCES = ['All Tenants', 'Active Only', 'Trial Only'];

    protected $table = 'broadcast_messages';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'title',
        'message',
        'audience',
        'sent_by',
        'recipient_count',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }
}
