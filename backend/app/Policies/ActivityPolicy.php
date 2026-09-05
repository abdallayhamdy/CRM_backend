<?php

namespace App\Policies;

use App\Models\Activity;
use App\Models\User;
use App\Services\PermissionEvaluator;

class ActivityPolicy
{
    public function viewAny(User $user): bool
    {
        return app(PermissionEvaluator::class)->effectiveScope($user, 'activities', 'view')
            !== PermissionEvaluator::SCOPE_NONE;
    }

    public function view(User $user, Activity $activity): bool
    {
        if ($user->workspace_id !== $activity->workspace_id) {
            return false;
        }

        return $activity->satisfiesScope($user, 'activities', 'view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_activities');
    }

    public function update(User $user, Activity $activity): bool
    {
        if ($user->workspace_id !== $activity->workspace_id) {
            return false;
        }

        return $activity->satisfiesScope($user, 'activities', 'edit');
    }

    public function delete(User $user, Activity $activity): bool
    {
        if ($user->workspace_id !== $activity->workspace_id) {
            return false;
        }

        return $activity->satisfiesScope($user, 'activities', 'delete');
    }
}