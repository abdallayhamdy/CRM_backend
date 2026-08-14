<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\BelongsToWorkspace;

class RestoreHistory extends Model
{
    use HasFactory, HasUuids, BelongsToWorkspace;

    protected $table = 'restore_history';

    protected $fillable = [
        'workspace_id',
        'restore_type',
        'status',
        'source',
        'objects',
        'changed_by',
        'start_date',
        'end_date',
        'requested_by',
    ];

    protected function casts(): array
    {
        return [
            'objects' => 'array',
            'start_date' => 'datetime',
            'end_date' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
