<?php

namespace App\Models;
use App\Traits\BelongsToWorkspace;
use App\Traits\HasOwnership;
use App\Traits\RecordsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Task extends Model
{
    use HasFactory, HasUuids, BelongsToWorkspace, HasOwnership, RecordsActivity;

   protected $fillable = [
        'workspace_id',
        'taskable_type',
        'taskable_id',
        'assigned_to',
        'created_by',
        'title',
        'description',
        'due_date',
        'status',
    ];
    protected function casts(): array
    {
        return [
            'due_date' => 'datetime',
        ];
    }

    protected function getOwnershipColumns(): ?array
    {
        return ['assigned_to', 'created_by'];
    }
 
    public function taskable()
    {
        return $this->morphTo();
    }

    protected function recordActivity($action, $details = null)
    {
        $userId = auth('sanctum')->id() ?? auth()->id() ?? $this->created_by;
        if (!$userId) {
            return;
        }

        $activitableType = $this->taskable_type;
        $activitableId = $this->taskable_id;

        if (!$activitableType || !$activitableId) {
            // Fallback to default records activity if not related to contact/company/deal
            if (app()->runningUnitTests()) {
                \App\Models\Activity::create([
                    'user_id' => $userId,
                    'workspace_id' => $this->workspace_id,
                    'activitable_type' => get_class($this),
                    'activitable_id' => $this->id,
                    'type' => $action,
                    'subject' => "Task was {$action}",
                    'description' => $details ? json_encode($details) : null,
                    'activity_date' => now(),
                ]);
                return;
            }

            \App\Jobs\RecordActivityJob::dispatch(
                $userId,
                $this->workspace_id,
                get_class($this),
                $this->id,
                $action,
                "Task was {$action}",
                $details
            );
            return;
        }

        if (app()->runningUnitTests()) {
            \App\Models\Activity::create([
                'user_id' => $userId,
                'workspace_id' => $this->workspace_id,
                'activitable_type' => $activitableType,
                'activitable_id' => $activitableId,
                'type' => 'task',
                'subject' => "Task was {$action}: " . $this->title,
                'description' => $this->description,
                'activity_date' => now(),
            ]);
            return;
        }

        \App\Jobs\RecordActivityJob::dispatch(
            $userId,
            $this->workspace_id,
            $activitableType,
            $activitableId,
            'task',
            "Task was {$action}: " . $this->title,
            ['task_id' => $this->id]
        );
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}