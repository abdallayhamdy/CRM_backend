<?php

namespace App\Policies;

use App\Models\User;
use App\Models\UserViewPreference;

class UserViewPreferencePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, UserViewPreference $preference): bool
    {
        return $user->id === $preference->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, UserViewPreference $preference): bool
    {
        return $user->id === $preference->user_id;
    }

    public function delete(User $user, UserViewPreference $preference): bool
    {
        return $user->id === $preference->user_id;
    }
}
