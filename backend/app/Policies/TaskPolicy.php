<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use App\Services\PermissionEvaluator;

class TaskPolicy
{
    public function viewAny(User $user): bool
    {
        return app(PermissionEvaluator::class)->effectiveScope($user, 'tasks', 'view')
            !== PermissionEvaluator::SCOPE_NONE;
    }

    public function view(User $user, Task $task): bool
    {
        if ($user->workspace_id !== $task->workspace_id) {
            return false;
        }

        return $task->satisfiesScope($user, 'tasks', 'view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_tasks');
    }

    public function update(User $user, Task $task): bool
    {
        if ($user->workspace_id !== $task->workspace_id) {
            return false;
        }

        return $task->satisfiesScope($user, 'tasks', 'edit');
    }

    public function delete(User $user, Task $task): bool
    {
        if ($user->workspace_id !== $task->workspace_id) {
            return false;
        }

        return $task->satisfiesScope($user, 'tasks', 'delete');
    }
}
