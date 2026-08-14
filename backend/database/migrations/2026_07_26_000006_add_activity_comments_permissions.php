<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'edit_activity_comments_own',
            'delete_activity_comments_own',
        ];

        foreach ($permissions as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'sanctum']);
        }

        $owner = Role::where('name', 'Workspace Owner')->first();
        if ($owner) {
            $owner->givePermissionTo($permissions);
        }

        $admin = Role::where('name', 'Workspace Admin')->first();
        if ($admin) {
            $admin->givePermissionTo($permissions);
        }

        $member = Role::where('name', 'Workspace Member')->first();
        if ($member) {
            $member->givePermissionTo($permissions);
        }
    }

    public function down(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        Permission::whereIn('name', [
            'edit_activity_comments_own',
            'delete_activity_comments_own',
        ])->delete();
    }
};
