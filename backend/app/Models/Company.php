<?php

namespace App\Models;
use App\Traits\BelongsToWorkspace;
use App\Traits\HasOwnership;
use App\Traits\HasPermissionScopes;
use App\Traits\RecordsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Company extends Model
{
    use HasFactory, HasUuids, SoftDeletes, BelongsToWorkspace, HasOwnership, HasPermissionScopes, RecordsActivity;

    protected $fillable = [
        'workspace_id',
        'name',
        'industry',
        'website',
        'phone',
        'email',
        'custom_data',
        'assigned_to',
        'stage_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'custom_data' => 'array', 
        ];
    }

    protected function getOwnershipColumns(): ?array
    {
        return ['created_by', 'assigned_to'];
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function stage()
    {
        return $this->belongsTo(Stage::class);
    }

    public function contacts()
    {
        return $this->hasMany(Contact::class);
    }

    public function deals()
    {
        return $this->hasMany(Deal::class);
    }
    public function tasks()
    {
        return $this->morphMany(Task::class, 'taskable');
    }

    public function notes()
    {
        return $this->morphMany(Note::class, 'notable');
    }

    public function activities()
    {
        return $this->morphMany(Activity::class, 'activitable');
    }
    public function documents()
{
    return $this->morphMany(\App\Models\Document::class, 'documentable');
}
}