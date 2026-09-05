<?php

namespace App\Policies;

use App\Models\Company;
use App\Models\User;
use App\Services\PermissionEvaluator;

class CompanyPolicy
{
    public function viewAny(User $user): bool
    {
        return app(PermissionEvaluator::class)->effectiveScope($user, 'companies', 'view')
            !== PermissionEvaluator::SCOPE_NONE;
    }

    public function view(User $user, Company $company): bool
    {
        if ($user->workspace_id !== $company->workspace_id) {
            return false;
        }

        return $company->satisfiesScope($user, 'companies', 'view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_companies');
    }

    public function update(User $user, Company $company): bool
    {
        if ($user->workspace_id !== $company->workspace_id) {
            return false;
        }

        return $company->satisfiesScope($user, 'companies', 'edit');
    }

    public function delete(User $user, Company $company): bool
    {
        if ($user->workspace_id !== $company->workspace_id) {
            return false;
        }

        return $company->satisfiesScope($user, 'companies', 'delete');
    }
}
