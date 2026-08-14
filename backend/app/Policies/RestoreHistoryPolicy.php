<?php

namespace App\Policies;

use App\Models\RestoreHistory;
use App\Models\User;

class RestoreHistoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('manage_backup');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('manage_backup');
    }
}
