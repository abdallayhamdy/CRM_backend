<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Resolves the effective record-level access scope for a user and capability.
 *
 * Semantics: "Most restrictive wins".
 *  - Spatie role permissions form the baseline gatekeeper:
 *      view/edit/delete_{object}_all  -> 'all'
 *      view/edit/delete_{object}_own  -> 'their'
 *      neither                        -> 'none'
 *  - Assigned permission sets can only narrow that baseline further with
 *    granular scopes ('all', 'team', 'their', 'none').
 *  - The final scope is the most restrictive of every contributing source
 *    (baseline + each non-empty permission-set value).
 */
class PermissionEvaluator
{
    public const SCOPE_ALL = 'all';
    public const SCOPE_TEAM = 'team';
    public const SCOPE_THEIR = 'their';
    public const SCOPE_NONE = 'none';

    protected const SCOPE_RANK = [
        self::SCOPE_NONE => 0,
        self::SCOPE_THEIR => 1,
        self::SCOPE_TEAM => 2,
        self::SCOPE_ALL => 3,
    ];

    protected const KEY_PREFIX = [
        'view' => 'view',
        'edit' => 'edit',
        'delete' => 'delete',
    ];

    /**
     * Compute the record-level scope a user has for a capability.
     */
    public function effectiveScope(User $user, string $object, string $key): string
    {
        if ($user->is_super_admin) {
            return self::SCOPE_ALL;
        }

        $baseline = $this->baselineScope($user, $object, $key);
        $setScope = $this->permissionSetScope($user, $object, $key);

        return $setScope === null ? $baseline : $this->mostRestrictive($baseline, $setScope);
    }

    protected function baselineScope(User $user, string $object, string $key): string
    {
        $prefix = self::KEY_PREFIX[$key] ?? null;

        if ($prefix === null) {
            return self::SCOPE_NONE;
        }

        if ($user->checkPermissionTo("{$prefix}_{$object}_all")) {
            return self::SCOPE_ALL;
        }

        if ($user->checkPermissionTo("{$prefix}_{$object}_own")) {
            return self::SCOPE_THEIR;
        }

        return self::SCOPE_NONE;
    }

    /**
     * The most restrictive scope contributed by the user's assigned sets.
     * Returns null when no assigned set constrains this capability.
     */
    protected function permissionSetScope(User $user, string $object, string $key): ?string
    {
        $scopes = DB::table('permission_set_permissions')
            ->join(
                'permission_set_user',
                'permission_set_user.permission_set_id',
                '=',
                'permission_set_permissions.permission_set_id'
            )
            ->where('permission_set_user.user_id', $user->id)
            ->where('permission_set_permissions.object', $object)
            ->where('permission_set_permissions.key', $key)
            ->pluck('permission_set_permissions.value');

        return $scopes
            ->map(fn ($value) => strtolower((string) $value))
            ->filter(fn ($value) => array_key_exists($value, self::SCOPE_RANK))
            ->reduce(function (?string $carry, string $value): ?string {
                $carry = $carry ?? $value;

                return self::SCOPE_RANK[$value] < self::SCOPE_RANK[$carry] ? $value : $carry;
            });
    }

    protected function mostRestrictive(string $scopeA, string $scopeB): string
    {
        return self::SCOPE_RANK[$scopeA] <= self::SCOPE_RANK[$scopeB] ? $scopeA : $scopeB;
    }
}