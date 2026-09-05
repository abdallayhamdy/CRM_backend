<?php

namespace App\Policies;

use App\Models\Pipeline;
use App\Models\User;
use App\Services\PermissionEvaluator;

class PipelinePolicy
{
    public function viewAny(User $user): bool
    {
        return app(PermissionEvaluator::class)->effectiveScope($user, 'pipelines', 'view')
            !== PermissionEvaluator::SCOPE_NONE;
    }

    public function view(User $user, Pipeline $pipeline): bool
    {
        if ($user->workspace_id !== $pipeline->workspace_id) {
            return false;
        }

        return $pipeline->satisfiesScope($user, 'pipelines', 'view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_pipelines');
    }

    public function update(User $user, Pipeline $pipeline): bool
    {
        if ($user->workspace_id !== $pipeline->workspace_id) {
            return false;
        }

        return $pipeline->satisfiesScope($user, 'pipelines', 'edit');
    }

    public function delete(User $user, Pipeline $pipeline): bool
    {
        if ($user->workspace_id !== $pipeline->workspace_id) {
            return false;
        }

        return $pipeline->satisfiesScope($user, 'pipelines', 'delete');
    }
}