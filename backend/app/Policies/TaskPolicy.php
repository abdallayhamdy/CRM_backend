<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view_tasks_all') || $user->hasPermissionTo('view_tasks_own');
    }

    public function view(User $user, Task $task): bool
    {
        if ($user->workspace_id !== $task->workspace_id) return false;
        if ($user->hasPermissionTo('view_tasks_all')) return true;
        if ($user->hasPermissionTo('view_tasks_own')) {
            return $task->isOwnedBy($user);
        }
        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_tasks');
    }

    public function update(User $user, Task $task): bool
    {
        if ($user->workspace_id !== $task->workspace_id) return false;
        if ($user->hasPermissionTo('edit_tasks_all')) return true;
        if ($user->hasPermissionTo('edit_tasks_own')) {
            return $task->isOwnedBy($user);
        }
        return false;
    }

    public function delete(User $user, Task $task): bool
    {
        if ($user->workspace_id !== $task->workspace_id) return false;
        if ($user->hasPermissionTo('delete_tasks_all')) return true;
        if ($user->hasPermissionTo('delete_tasks_own')) {
            return $task->isOwnedBy($user);
        }
        return false;
    }
}
