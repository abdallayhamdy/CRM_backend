<?php

namespace App\Policies;

use App\Models\Pipeline;
use App\Models\User;

class PipelinePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view_pipelines_all') || $user->hasPermissionTo('view_pipelines_own');
    }

    public function view(User $user, Pipeline $pipeline): bool
    {
        if ($user->workspace_id !== $pipeline->workspace_id) return false;

        return $user->hasPermissionTo('view_pipelines_all') || $user->hasPermissionTo('view_pipelines_own');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_pipelines');
    }

    public function update(User $user, Pipeline $pipeline): bool
    {
        if ($user->workspace_id !== $pipeline->workspace_id) return false;

        return $user->hasPermissionTo('edit_pipelines_all');
    }

    public function delete(User $user, Pipeline $pipeline): bool
    {
        if ($user->workspace_id !== $pipeline->workspace_id) return false;

        return $user->hasPermissionTo('delete_pipelines_all');
    }
}
