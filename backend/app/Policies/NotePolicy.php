<?php

namespace App\Policies;

use App\Models\Note;
use App\Models\User;

class NotePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view_notes_all') || $user->hasPermissionTo('view_notes_own');
    }

    public function view(User $user, Note $note): bool
    {
        if ($user->workspace_id !== $note->workspace_id) return false;
        if ($user->hasPermissionTo('view_notes_all')) return true;
        if ($user->hasPermissionTo('view_notes_own')) {
            return $note->isOwnedBy($user);
        }
        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_notes');
    }

    public function update(User $user, Note $note): bool
    {
        if ($user->workspace_id !== $note->workspace_id) return false;
        if ($user->hasPermissionTo('edit_notes_all')) return true;
        if ($user->hasPermissionTo('edit_notes_own')) {
            return $note->isOwnedBy($user);
        }
        return false;
    }

    public function delete(User $user, Note $note): bool
    {
        if ($user->workspace_id !== $note->workspace_id) return false;
        if ($user->hasPermissionTo('delete_notes_all')) return true;
        if ($user->hasPermissionTo('delete_notes_own')) {
            return $note->isOwnedBy($user);
        }
        return false;
    }
}
