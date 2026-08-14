<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    use HasUuids;

    public const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

    public const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

    protected $table = 'support_tickets';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'subject',
        'description',
        'status',
        'priority',
        'assigned_to',
    ];

    public function tenant()
    {
        return $this->belongsTo(Workspace::class, 'tenant_id');
    }
}
