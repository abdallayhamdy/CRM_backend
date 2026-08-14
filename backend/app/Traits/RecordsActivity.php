<?php

namespace App\Traits;

use App\Models\Activity;

trait RecordsActivity
{
    protected static function bootRecordsActivity()
    {
        // لما الموديل يتكريت
        static::created(function ($model) {
            $model->recordActivity('created');
            $model->clearWorkspaceCache();
        });

        
        static::updated(function ($model) {
            $model->recordActivity('updated', [
                'old' => $model->getOriginal(),
                'new' => $model->getChanges(),
            ]);
            $model->clearWorkspaceCache();
        });

        
        static::deleted(function ($model) {
            $model->recordActivity('deleted');
            $model->clearWorkspaceCache();
        });
    }

    protected function recordActivity($action, $details = null)
    {
        $userId = auth('sanctum')->id() ?? auth()->id();
        if (!$userId) {
            return;
        }

        $modelName = class_basename($this);

        if (app()->runningUnitTests()) {
            \App\Models\Activity::create([
                'user_id' => $userId,
                'workspace_id' => $this->workspace_id,
                'activitable_type' => get_class($this),
                'activitable_id' => $this->id,
                'type' => $action,
                'subject' => "{$modelName} was {$action}",
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
            "{$modelName} was {$action}",
            $details
        );
    }

    protected function clearWorkspaceCache()
    {
        $workspaceId = $this->workspace_id;
        if ($workspaceId) {
            \Illuminate\Support\Facades\Cache::forget("dashboard_overview:{$workspaceId}");
            \Illuminate\Support\Facades\Cache::forget("report_sales:{$workspaceId}");
            \Illuminate\Support\Facades\Cache::forget("report_customers:{$workspaceId}");
        }
    }
}