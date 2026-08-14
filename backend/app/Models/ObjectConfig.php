<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use App\Traits\BelongsToWorkspace;

class ObjectConfig extends Model
{
    use HasFactory, BelongsToWorkspace;

    protected $fillable = [
        'workspace_id',
        'object_type',
        'lifecycle_stages',
        'display_style',
    ];

    protected $casts = [
        'lifecycle_stages' => 'json',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = Str::uuid();
            }
        });
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function scopeForWorkspaceAndObject(Builder $query, string $workspaceId, string $objectType): Builder
    {
        return $query->where('workspace_id', $workspaceId)->where('object_type', $objectType);
    }
}
