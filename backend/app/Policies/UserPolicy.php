<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->workspace_id && $user->hasPermissionTo('view_workspace_members');
    }

    public function update(User $user, User $model): bool
    {
        $sharedWorkspaceId = $user->workspaces()
            ->whereIn('workspace_id', $model->workspaces()->pluck('workspace_id'))
            ->value('workspace_id');

        if (!$sharedWorkspaceId) {
            return false;
        }

        return $user->hasPermissionTo('manage_workspace_members');
    }

    public function delete(User $user, User $model): bool
    {
        $sharedWorkspaceId = $user->workspaces()
            ->whereIn('workspace_id', $model->workspaces()->pluck('workspace_id'))
            ->value('workspace_id');

        if (!$sharedWorkspaceId) {
            return false;
        }

        return $user->hasPermissionTo('remove_workspace_members');
    }
}
