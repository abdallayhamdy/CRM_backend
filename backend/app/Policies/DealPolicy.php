<?php

namespace App\Policies;

use App\Models\Deal;
use App\Models\User;

class DealPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view_deals_all') || $user->hasPermissionTo('view_deals_own');
    }

    public function view(User $user, Deal $deal): bool
    {
        if ($user->workspace_id !== $deal->workspace_id) return false;
        if ($user->hasPermissionTo('view_deals_all')) return true;
        if ($user->hasPermissionTo('view_deals_own')) {
            return $deal->isOwnedBy($user);
        }
        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_deals');
    }

    public function update(User $user, Deal $deal): bool
    {
        if ($user->workspace_id !== $deal->workspace_id) return false;
        if ($user->hasPermissionTo('edit_deals_all')) return true;
        if ($user->hasPermissionTo('edit_deals_own')) {
            return $deal->isOwnedBy($user);
        }
        return false;
    }

    public function delete(User $user, Deal $deal): bool
    {
        if ($user->workspace_id !== $deal->workspace_id) return false;
        if ($user->hasPermissionTo('delete_deals_all')) return true;
        if ($user->hasPermissionTo('delete_deals_own')) {
            return $deal->isOwnedBy($user);
        }
        return false;
    }
}
