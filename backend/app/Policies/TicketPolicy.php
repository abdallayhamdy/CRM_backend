<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view_tickets_all') || $user->hasPermissionTo('view_tickets_own');
    }

    public function view(User $user, Ticket $ticket): bool
    {
        if ($user->workspace_id !== $ticket->workspace_id) return false;
        if ($user->hasPermissionTo('view_tickets_all')) return true;
        if ($user->hasPermissionTo('view_tickets_own')) {
            return $ticket->isOwnedBy($user);
        }
        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_tickets');
    }

    public function update(User $user, Ticket $ticket): bool
    {
        if ($user->workspace_id !== $ticket->workspace_id) return false;
        if ($user->hasPermissionTo('edit_tickets_all')) return true;
        if ($user->hasPermissionTo('edit_tickets_own')) {
            return $ticket->isOwnedBy($user);
        }
        return false;
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        if ($user->workspace_id !== $ticket->workspace_id) return false;
        if ($user->hasPermissionTo('delete_tickets_all')) return true;
        if ($user->hasPermissionTo('delete_tickets_own')) {
            return $ticket->isOwnedBy($user);
        }
        return false;
    }
}
