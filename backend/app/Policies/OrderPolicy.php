<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view_orders_all') || $user->hasPermissionTo('view_orders_own');
    }

    public function view(User $user, Order $order): bool
    {
        if ($user->workspace_id !== $order->workspace_id) return false;
        if ($user->hasPermissionTo('view_orders_all')) return true;
        if ($user->hasPermissionTo('view_orders_own')) {
            return $order->isOwnedBy($user);
        }
        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_orders');
    }

    public function update(User $user, Order $order): bool
    {
        if ($user->workspace_id !== $order->workspace_id) return false;
        if ($user->hasPermissionTo('edit_orders_all')) return true;
        if ($user->hasPermissionTo('edit_orders_own')) {
            return $order->isOwnedBy($user);
        }
        return false;
    }

    public function delete(User $user, Order $order): bool
    {
        if ($user->workspace_id !== $order->workspace_id) return false;
        if ($user->hasPermissionTo('delete_orders_all')) return true;
        if ($user->hasPermissionTo('delete_orders_own')) {
            return $order->isOwnedBy($user);
        }
        return false;
    }
}
