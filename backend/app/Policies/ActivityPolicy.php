<?php

namespace App\Policies;

use App\Models\Activity;
use App\Models\User;

class ActivityPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view_activities_all') || $user->hasPermissionTo('view_activities_own');
    }

    public function view(User $user, Activity $activity): bool
    {
        if ($user->workspace_id !== $activity->workspace_id) return false;
        if ($user->hasPermissionTo('view_activities_all')) return true;
        if ($user->hasPermissionTo('view_activities_own')) {
            return $activity->isOwnedBy($user);
        }
        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_activities');
    }

    public function update(User $user, Activity $activity): bool
    {
        if ($user->workspace_id !== $activity->workspace_id) return false;
        if ($user->hasPermissionTo('edit_activities_all')) return true;
        if ($user->hasPermissionTo('edit_activities_own')) {
            return $activity->isOwnedBy($user);
        }
        return false;
    }

    public function delete(User $user, Activity $activity): bool
    {
        if ($user->workspace_id !== $activity->workspace_id) return false;
        if ($user->hasPermissionTo('delete_activities_all')) return true;
        if ($user->hasPermissionTo('delete_activities_own')) {
            return $activity->isOwnedBy($user);
        }
        return false;
    }
}
