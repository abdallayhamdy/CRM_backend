<?php

namespace App\Traits;

use App\Models\User;

trait HasOwnership
{
    /**
     * Get the column(s) that determine record ownership.
     * Return a single column name string, or an array of column names (OR logic).
     * Return null if the model has no ownership (shared workspace resource).
     */
    protected function getOwnershipColumns(): ?array
    {
        return null;
    }

    /**
     * Check if the given user owns this record.
     * Returns true if ANY of the ownership columns match the user's ID.
     * Returns true for models with no ownership columns (shared resources).
     */
    public function isOwnedBy(User $user): bool
    {
        $columns = $this->getOwnershipColumns();

        if ($columns === null) {
            return true;
        }

        foreach ($columns as $column) {
            if ($this->{$column} === $user->id) {
                return true;
            }
        }

        return false;
    }
}
