<?php

namespace App\Policies;

use App\Models\DealImport;
use App\Models\User;

class DealImportPolicy
{
    public function view(User $user, DealImport $dealImport): bool
    {
        if ($user->is_super_admin) {
            return true;
        }

        return $user->workspace_id === $dealImport->workspace_id;
    }
}
