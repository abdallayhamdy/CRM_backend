<?php

namespace App\Policies;

use App\Models\Backup;
use App\Models\User;

class BackupPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('manage_backup');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('manage_backup');
    }

    public function update(User $user, Backup $backup): bool
    {
        if ($user->workspace_id !== $backup->workspace_id) return false;

        return $user->hasPermissionTo('manage_backup');
    }
}
