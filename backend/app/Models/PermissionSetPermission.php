<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PermissionSetPermission extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'permission_set_id',
        'object',
        'key',
        'value',
        'scope',
    ];

    public function permissionSet(): BelongsTo
    {
        return $this->belongsTo(PermissionSet::class);
    }
}