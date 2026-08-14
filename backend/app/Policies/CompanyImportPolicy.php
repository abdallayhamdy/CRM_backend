<?php

namespace App\Policies;

use App\Models\CompanyImport;
use App\Models\User;

class CompanyImportPolicy
{
    public function view(User $user, CompanyImport $companyImport): bool
    {
        return $user->workspace_id === $companyImport->workspace_id;
    }
}
