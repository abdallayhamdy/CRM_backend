<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;
use App\Services\PermissionEvaluator;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return app(PermissionEvaluator::class)->effectiveScope($user, 'products', 'view')
            !== PermissionEvaluator::SCOPE_NONE;
    }

    public function view(User $user, Product $product): bool
    {
        if ($user->workspace_id !== $product->workspace_id) {
            return false;
        }

        return $product->satisfiesScope($user, 'products', 'view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_products');
    }

    public function update(User $user, Product $product): bool
    {
        if ($user->workspace_id !== $product->workspace_id) {
            return false;
        }

        return $product->satisfiesScope($user, 'products', 'edit');
    }

    public function delete(User $user, Product $product): bool
    {
        if ($user->workspace_id !== $product->workspace_id) {
            return false;
        }

        return $product->satisfiesScope($user, 'products', 'delete');
    }
}