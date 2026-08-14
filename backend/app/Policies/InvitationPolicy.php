<?php

namespace App\Policies;

use App\Models\Invitation;
use App\Models\User;

class InvitationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('manage_workspace_members')
            || $user->hasPermissionTo('invite_users');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('invite_users');
    }
}
