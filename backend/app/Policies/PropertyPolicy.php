<?php

namespace App\Policies;

use App\Models\Property;
use App\Models\User;
use Spatie\Permission\Exceptions\PermissionDoesNotExist;

class PropertyPolicy
{
    private function hasPermission(User $user, string $permission): bool
    {
        try {
            return $user->hasPermissionTo($permission);
        } catch (PermissionDoesNotExist) {
            return false;
        }
    }

    public function viewAny(User $user): bool
    {
        return $this->hasPermission($user, 'view_properties');
    }

    public function view(User $user, Property $property): bool
    {
        if ($user->workspace_id !== $property->workspace_id) return false;

        return $this->hasPermission($user, 'view_properties');
    }

    public function create(User $user): bool
    {
        return $this->hasPermission($user, 'manage_properties');
    }

    public function update(User $user, Property $property): bool
    {
        if ($user->workspace_id !== $property->workspace_id) return false;

        return $this->hasPermission($user, 'manage_properties');
    }

    public function delete(User $user, Property $property): bool
    {
        if ($user->workspace_id !== $property->workspace_id) return false;

        return $this->hasPermission($user, 'manage_properties');
    }

    public function restore(User $user, Property $property): bool
    {
        if ($user->workspace_id !== $property->workspace_id) return false;

        return $this->hasPermission($user, 'manage_properties');
    }

    public function forceDelete(User $user, Property $property): bool
    {
        if ($user->workspace_id !== $property->workspace_id) return false;

        return $this->hasPermission($user, 'manage_properties');
    }
}
