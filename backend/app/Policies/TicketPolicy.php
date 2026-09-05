<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;
use App\Services\PermissionEvaluator;

class TicketPolicy
{
    public function viewAny(User $user): bool
    {
        return app(PermissionEvaluator::class)->effectiveScope($user, 'tickets', 'view')
            !== PermissionEvaluator::SCOPE_NONE;
    }

    public function view(User $user, Ticket $ticket): bool
    {
        if ($user->workspace_id !== $ticket->workspace_id) {
            return false;
        }

        return $ticket->satisfiesScope($user, 'tickets', 'view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_tickets');
    }

    public function update(User $user, Ticket $ticket): bool
    {
        if ($user->workspace_id !== $ticket->workspace_id) {
            return false;
        }

        return $ticket->satisfiesScope($user, 'tickets', 'edit');
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        if ($user->workspace_id !== $ticket->workspace_id) {
            return false;
        }

        return $ticket->satisfiesScope($user, 'tickets', 'delete');
    }
}