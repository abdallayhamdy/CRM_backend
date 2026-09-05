<?php

namespace App\Policies;

use App\Models\Note;
use App\Models\User;
use App\Services\PermissionEvaluator;

class NotePolicy
{
    public function viewAny(User $user): bool
    {
        return app(PermissionEvaluator::class)->effectiveScope($user, 'notes', 'view')
            !== PermissionEvaluator::SCOPE_NONE;
    }

    public function view(User $user, Note $note): bool
    {
        if ($user->workspace_id !== $note->workspace_id) {
            return false;
        }

        return $note->satisfiesScope($user, 'notes', 'view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_notes');
    }

    public function update(User $user, Note $note): bool
    {
        if ($user->workspace_id !== $note->workspace_id) {
            return false;
        }

        return $note->satisfiesScope($user, 'notes', 'edit');
    }

    public function delete(User $user, Note $note): bool
    {
        if ($user->workspace_id !== $note->workspace_id) {
            return false;
        }

        return $note->satisfiesScope($user, 'notes', 'delete');
    }
}