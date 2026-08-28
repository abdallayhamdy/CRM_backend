<?php

namespace App\Traits;

use App\Models\User;
use App\Services\PermissionEvaluator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Applies permission-set record-level scopes to owner-aware models.
 *
 * Relies on HasOwnership::getOwnershipColumns() to determine which columns
 * define record ownership for the 'their' / 'team' scopes.
 */
trait HasPermissionScopes
{
    /**
     * Filter a query down to the records the user may operate on for a
     * capability, based on their resolved scope ('all'/'team'/'their'/'none').
     */
    public function scopeApplyRecordScope(Builder $query, User $user, string $object, string $key): Builder
    {
        $scope = $this->resolveScope($user, $object, $key);

        if ($scope === PermissionEvaluator::SCOPE_ALL) {
            return $query;
        }

        if ($scope === PermissionEvaluator::SCOPE_NONE) {
            return $query->whereRaw('1 = 0');
        }

        $columns = $this->getOwnershipColumns() ?? [];

        if (empty($columns)) {
            return $query;
        }

        return $query->where(function (Builder $nested) use ($user, $scope, $columns) {
            foreach ($columns as $column) {
                $nested->orWhere(function (Builder $matches) use ($user, $scope, $column) {
                    $qualified = $this->qualifyColumn($column);

                    if ($scope === PermissionEvaluator::SCOPE_THEIR) {
                        $matches->where($qualified, $user->id);

                        return;
                    }

                    $matches->where($qualified, $user->id)
                        ->orWhereIn($qualified, function ($teammates) use ($user) {
                            $teammates->select('team_user.user_id')
                                ->from('team_user')
                                ->distinct()
                                ->whereIn('team_user.team_id', function ($teams) use ($user) {
                                    $teams->select('team_user.team_id')
                                        ->from('team_user')
                                        ->where('team_user.user_id', $user->id);
                                });
                        });
                });
            }
        });
    }

    /**
     * Whether a single record satisfies the user's resolved scope.
     */
    public function satisfiesScope(User $user, string $object, string $key): bool
    {
        $scope = $this->resolveScope($user, $object, $key);

        if ($scope === PermissionEvaluator::SCOPE_ALL) {
            return true;
        }

        if ($scope === PermissionEvaluator::SCOPE_NONE) {
            return false;
        }

        $columns = $this->getOwnershipColumns() ?? [];

        if (empty($columns)) {
            return true;
        }

        $ownIds = collect($columns)
            ->map(fn (string $column) => $this->{$column})
            ->filter()
            ->unique();

        if ($scope === PermissionEvaluator::SCOPE_THEIR) {
            return $ownIds->contains($user->id);
        }

        $teamMemberIds = DB::table('team_user')
            ->select('team_user.user_id')
            ->distinct()
            ->whereIn('team_user.team_id', function ($teams) use ($user) {
                $teams->select('team_user.team_id')
                    ->from('team_user')
                    ->where('team_user.user_id', $user->id);
            })
            ->pluck('user_id')
            ->push($user->id)
            ->unique();

        return $ownIds->intersect($teamMemberIds)->isNotEmpty();
    }

    protected function resolveScope(User $user, string $object, string $key): string
    {
        return app(PermissionEvaluator::class)->effectiveScope($user, $object, $key);
    }
}