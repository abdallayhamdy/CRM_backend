<?php

namespace App\Models;
use App\Traits\BelongsToWorkspace;
use App\Traits\HasOwnership;
use App\Traits\RecordsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Deal extends Model
{
    use HasFactory, HasUuids, SoftDeletes, BelongsToWorkspace, HasOwnership, RecordsActivity;

    protected $fillable = [
        'workspace_id',
        'contact_id',
        'company_id',
        'stage_id',
        'assigned_to',
        'title',
        'amount',
        'status',
        'expected_close_date',
        'custom_data',
        'pipeline_stage_id'
    ];

    protected function casts(): array
    {
        return [
            'custom_data' => 'array',
            'expected_close_date' => 'date', 
        ];
    }

    protected function getOwnershipColumns(): ?array
    {
        return ['assigned_to'];
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
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
    public function pipelineStage()
{
    return $this->belongsTo(PipelineStage::class, 'pipeline_stage_id');
}
public function documents()
{
    return $this->morphMany(\App\Models\Document::class, 'documentable');
}
}