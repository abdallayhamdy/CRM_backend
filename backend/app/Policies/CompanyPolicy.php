<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\User;

class CompanyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view_companies_all') || $user->hasPermissionTo('view_companies_own');
    }

    public function view(User $user, Company $company): bool
    {
        if ($user->workspace_id !== $company->workspace_id) return false;
        if ($user->hasPermissionTo('view_companies_all')) return true;
        if ($user->hasPermissionTo('view_companies_own')) {
            return $company->isOwnedBy($user);
        }
        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_companies');
    }

    public function update(User $user, Company $company): bool
    {
        if ($user->workspace_id !== $company->workspace_id) return false;
        if ($user->hasPermissionTo('edit_companies_all')) return true;
        if ($user->hasPermissionTo('edit_companies_own')) {
            return $company->isOwnedBy($user);
        }
        return false;
    }

    public function delete(User $user, Company $company): bool
    {
        if ($user->workspace_id !== $company->workspace_id) return false;
        if ($user->hasPermissionTo('delete_companies_all')) return true;
        if ($user->hasPermissionTo('delete_companies_own')) {
            return $company->isOwnedBy($user);
        }
        return false;
    }
}
