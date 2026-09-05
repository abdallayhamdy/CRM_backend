<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;
use App\Services\PermissionEvaluator;

class DocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return app(PermissionEvaluator::class)->effectiveScope($user, 'documents', 'view')
            !== PermissionEvaluator::SCOPE_NONE;
    }

    public function view(User $user, Document $document): bool
    {
        if ($user->workspace_id !== $document->workspace_id) {
            return false;
        }

        return $document->satisfiesScope($user, 'documents', 'view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_documents');
    }

    public function update(User $user, Document $document): bool
    {
        if ($user->workspace_id !== $document->workspace_id) {
            return false;
        }

        return $document->satisfiesScope($user, 'documents', 'edit');
    }

    public function delete(User $user, Document $document): bool
    {
        if ($user->workspace_id !== $document->workspace_id) {
            return false;
        }

        return $document->satisfiesScope($user, 'documents', 'delete');
    }
}