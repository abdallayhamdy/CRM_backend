<?php

namespace App\Policies;

use App\Models\ContactImport;
use App\Models\User;

class ContactImportPolicy
{
    public function view(User $user, ContactImport $contactImport): bool
    {
        return $user->workspace_id === $contactImport->workspace_id;
    }
}
