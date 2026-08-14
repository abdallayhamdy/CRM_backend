<?php

namespace App\Policies;

use App\Models\ActivityComment;
use App\Models\User;

class ActivityCommentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view_activities_all') || $user->hasPermissionTo('view_activities_own');
    }

    public function view(User $user, ActivityComment $comment): bool
    {
        if ($user->workspace_id !== $comment->activity->workspace_id) return false;

        if ($user->hasPermissionTo('view_activities_all')) return true;
        if ($user->hasPermissionTo('view_activities_own')) {
            return $user->id === $comment->activity->user_id || $user->id === $comment->user_id;
        }
        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_activities') || $user->hasPermissionTo('create_notes');
    }

    public function update(User $user, ActivityComment $comment): bool
    {
        if ($user->workspace_id !== $comment->activity->workspace_id) return false;

        if ($user->id === $comment->user_id) return true;
        if ($user->hasPermissionTo('edit_activity_comments_own')) {
            return $user->id === $comment->user_id;
        }
        return false;
    }

    public function delete(User $user, ActivityComment $comment): bool
    {
        if ($user->workspace_id !== $comment->activity->workspace_id) return false;

        if ($user->hasPermissionTo('delete_activities_all')) return true;
        if ($user->id === $comment->user_id && $user->hasPermissionTo('delete_activity_comments_own')) return true;
        return false;
    }
}
