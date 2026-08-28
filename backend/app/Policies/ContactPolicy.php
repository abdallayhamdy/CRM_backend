<?php

namespace App\Policies;

use App\Models\Contact;
use App\Models\User;
use App\Services\PermissionEvaluator;

class ContactPolicy
{
    public function viewAny(User $user): bool
    {
        return app(PermissionEvaluator::class)->effectiveScope($user, 'contacts', 'view')
            !== PermissionEvaluator::SCOPE_NONE;
    }

    public function view(User $user, Contact $contact): bool
    {
        if ($user->workspace_id !== $contact->workspace_id) {
            return false;
        }

        return $contact->satisfiesScope($user, 'contacts', 'view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_contacts');
    }

    public function update(User $user, Contact $contact): bool
    {
        if ($user->workspace_id !== $contact->workspace_id) {
            return false;
        }

        return $contact->satisfiesScope($user, 'contacts', 'edit');
    }

    public function delete(User $user, Contact $contact): bool
    {
        if ($user->workspace_id !== $contact->workspace_id) {
            return false;
        }

        return $contact->satisfiesScope($user, 'contacts', 'delete');
    }
}