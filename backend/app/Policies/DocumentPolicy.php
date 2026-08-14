<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view_documents_all') || $user->hasPermissionTo('view_documents_own');
    }

    public function view(User $user, Document $document): bool
    {
        if ($user->workspace_id !== $document->workspace_id) return false;
        if ($user->hasPermissionTo('view_documents_all')) return true;
        if ($user->hasPermissionTo('view_documents_own')) {
            return $document->isOwnedBy($user);
        }
        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_documents');
    }

    public function update(User $user, Document $document): bool
    {
        if ($user->workspace_id !== $document->workspace_id) return false;
        if ($user->hasPermissionTo('edit_documents_all')) return true;
        if ($user->hasPermissionTo('edit_documents_own')) {
            return $document->isOwnedBy($user);
        }
        return false;
    }

    public function delete(User $user, Document $document): bool
    {
        if ($user->workspace_id !== $document->workspace_id) return false;
        if ($user->hasPermissionTo('delete_documents_all')) return true;
        if ($user->hasPermissionTo('delete_documents_own')) {
            return $document->isOwnedBy($user);
        }
        return false;
    }
}
