<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    private const GUARD = 'sanctum';
    private const PERMISSION = 'manage_permission_sets';

    public function up(): void
    {
        $permission = DB::table('permissions')
            ->where('name', self::PERMISSION)
            ->where('guard_name', self::GUARD)
            ->first();

        $permissionId = $permission?->id ?? DB::table('permissions')->insertGetId([
            'name' => self::PERMISSION,
            'guard_name' => self::GUARD,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach (['Workspace Owner', 'Workspace Admin'] as $roleName) {
            $role = DB::table('roles')
                ->where('name', $roleName)
                ->where('guard_name', self::GUARD)
                ->first();

            if (!$role) {
                continue;
            }

            $has = DB::table('role_has_permissions')
                ->where('permission_id', $permissionId)
                ->where('role_id', $role->id)
                ->exists();

            if (!$has) {
                DB::table('role_has_permissions')->insert([
                    'permission_id' => $permissionId,
                    'role_id' => $role->id,
                ]);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Permissions are shared across environments; do not delete on rollback.
    }
};