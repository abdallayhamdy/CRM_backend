<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;
use App\Services\PermissionEvaluator;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return app(PermissionEvaluator::class)->effectiveScope($user, 'orders', 'view')
            !== PermissionEvaluator::SCOPE_NONE;
    }

    public function view(User $user, Order $order): bool
    {
        if ($user->workspace_id !== $order->workspace_id) {
            return false;
        }

        return $order->satisfiesScope($user, 'orders', 'view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_orders');
    }

    public function update(User $user, Order $order): bool
    {
        if ($user->workspace_id !== $order->workspace_id) {
            return false;
        }

        return $order->satisfiesScope($user, 'orders', 'edit');
    }

    public function delete(User $user, Order $order): bool
    {
        if ($user->workspace_id !== $order->workspace_id) {
            return false;
        }

        return $order->satisfiesScope($user, 'orders', 'delete');
    }
}