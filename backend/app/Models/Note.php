<?php

namespace App\Models;
use App\Traits\BelongsToWorkspace;
use App\Traits\HasOwnership;
use App\Traits\RecordsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Note extends Model
{
    use HasFactory, HasUuids, BelongsToWorkspace, HasOwnership, RecordsActivity;

   protected $fillable = [
        'workspace_id',
        'notable_type',
        'notable_id',
        'content',
        'user_id',
    ];

    protected function getOwnershipColumns(): ?array
    {
        return ['user_id'];
    }

    
    public function notable()
    {
        return $this->morphTo();
    }

    protected function recordActivity($action, $details = null)
    {
        $userId = auth('sanctum')->id() ?? auth()->id() ?? $this->user_id;
        if (!$userId) {
            return;
        }

        $activitableType = $this->notable_type;
        $activitableId = $this->notable_id;

        if (!$activitableType || !$activitableId) {
            if (app()->runningUnitTests()) {
                \App\Models\Activity::create([
                    'user_id' => $userId,
                    'workspace_id' => $this->workspace_id,
                    'activitable_type' => get_class($this),
                    'activitable_id' => $this->id,
                    'type' => $action,
                    'subject' => "Note was {$action}",
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
                "Note was {$action}",
                $details
            );
            return;
        }

        $subject = "Note was {$action}";
        if ($this->content) {
            $plainText = strip_tags($this->content);
            $subject = substr($plainText, 0, 50);
            if (strlen($plainText) > 50) $subject .= "...";
        }

        if (app()->runningUnitTests()) {
            \App\Models\Activity::create([
                'user_id' => $userId,
                'workspace_id' => $this->workspace_id,
                'activitable_type' => $activitableType,
                'activitable_id' => $activitableId,
                'type' => 'note',
                'subject' => $subject,
                'description' => $this->content,
                'activity_date' => now(),
            ]);
            return;
        }

        \App\Jobs\RecordActivityJob::dispatch(
            $userId,
            $this->workspace_id,
            $activitableType,
            $activitableId,
            'note',
            $subject,
            ['note_id' => $this->id]
        );
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}