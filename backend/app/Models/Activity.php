<?php

namespace App\Models;

use App\Traits\BelongsToWorkspace;
use App\Traits\HasOwnership;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Activity extends Model
{
    use HasFactory, HasUuids, BelongsToWorkspace, HasOwnership;

    protected $fillable = [
        'workspace_id',
        'user_id',
        'activitable_type',
        'activitable_id',
        'type',
        'subject',
        'description',
        'activity_date',
    ];

    protected function casts(): array
    {
        return [
            'activity_date' => 'datetime',
        ];
    }

    protected function getOwnershipColumns(): ?array
    {
        return ['user_id'];
    }

    public function activitable()
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}