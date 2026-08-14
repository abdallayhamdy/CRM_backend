<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view_products_all') || $user->hasPermissionTo('view_products_own');
    }

    public function view(User $user, Product $product): bool
    {
        if ($user->workspace_id !== $product->workspace_id) return false;
        return $user->hasPermissionTo('view_products_all') || $user->hasPermissionTo('view_products_own');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_products');
    }

    public function update(User $user, Product $product): bool
    {
        if ($user->workspace_id !== $product->workspace_id) return false;
        return $user->hasPermissionTo('edit_products_all');
    }

    public function delete(User $user, Product $product): bool
    {
        if ($user->workspace_id !== $product->workspace_id) return false;
        return $user->hasPermissionTo('delete_products_all');
    }
}
