<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToWorkspace;

class FormLayout extends Model
{
    use HasFactory, HasUuids, BelongsToWorkspace;

    protected $fillable = [
        'workspace_id',
        'object_type',
        'groups',
    ];

    protected $casts = [
        'groups' => 'json',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function scopeForWorkspaceAndObject(Builder $query, string $workspaceId, string $objectType): Builder
    {
        return $query->withoutGlobalScope('workspace')
            ->where('workspace_id', $workspaceId)
            ->where('object_type', $objectType);
    }
}
