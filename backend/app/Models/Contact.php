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

class Contact extends Model
{
    use HasFactory, HasUuids, SoftDeletes, BelongsToWorkspace, HasOwnership, HasPermissionScopes, RecordsActivity;

    protected $fillable = [
        'workspace_id',
        'company_id',
        'company_name',
        'stage_id',
        'assigned_to',
        'first_name',
        'last_name',
        'email',
        'phone',
        'custom_data',
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

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function stage()
    {
        return $this->belongsTo(Stage::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
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