<?php

namespace App\Policies;

use App\Models\Deal;
use App\Models\User;
use App\Services\PermissionEvaluator;

class DealPolicy
{
    public function viewAny(User $user): bool
    {
        return app(PermissionEvaluator::class)->effectiveScope($user, 'deals', 'view')
            !== PermissionEvaluator::SCOPE_NONE;
    }

    public function view(User $user, Deal $deal): bool
    {
        if ($user->workspace_id !== $deal->workspace_id) {
            return false;
        }

        return $deal->satisfiesScope($user, 'deals', 'view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_deals');
    }

    public function update(User $user, Deal $deal): bool
    {
        if ($user->workspace_id !== $deal->workspace_id) {
            return false;
        }

        return $deal->satisfiesScope($user, 'deals', 'edit');
    }

    public function delete(User $user, Deal $deal): bool
    {
        if ($user->workspace_id !== $deal->workspace_id) {
            return false;
        }

        return $deal->satisfiesScope($user, 'deals', 'delete');
    }
}