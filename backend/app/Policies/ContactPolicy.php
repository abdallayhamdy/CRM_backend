<?php

namespace App\Policies;

use App\Models\Contact;
use App\Models\User;

class ContactPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view_contacts_all') || $user->hasPermissionTo('view_contacts_own');
    }

    public function view(User $user, Contact $contact): bool
    {
        if ($user->workspace_id !== $contact->workspace_id) return false;
        if ($user->hasPermissionTo('view_contacts_all')) return true;
        if ($user->hasPermissionTo('view_contacts_own')) {
            return $contact->isOwnedBy($user);
        }
        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_contacts');
    }

    public function update(User $user, Contact $contact): bool
    {
        if ($user->workspace_id !== $contact->workspace_id) return false;
        if ($user->hasPermissionTo('edit_contacts_all')) return true;
        if ($user->hasPermissionTo('edit_contacts_own')) {
            return $contact->isOwnedBy($user);
        }
        return false;
    }

    public function delete(User $user, Contact $contact): bool
    {
        if ($user->workspace_id !== $contact->workspace_id) return false;
        if ($user->hasPermissionTo('delete_contacts_all')) return true;
        if ($user->hasPermissionTo('delete_contacts_own')) {
            return $contact->isOwnedBy($user);
        }
        return false;
    }
}
