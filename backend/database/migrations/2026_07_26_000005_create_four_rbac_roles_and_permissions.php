<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

return new class extends Migration
{
    public function up(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create ALL permissions (CRUD + system)
        $models = [
            'contacts', 'companies', 'deals', 'tasks',
            'products', 'orders', 'tickets', 'documents',
            'notes', 'activities', 'pipelines', 'stages', 'invitations',
        ];

        foreach ($models as $model) {
            Permission::firstOrCreate(['name' => "create_{$model}", 'guard_name' => 'sanctum']);
            foreach (['view', 'edit', 'delete'] as $action) {
                Permission::firstOrCreate(['name' => "{$action}_{$model}_all", 'guard_name' => 'sanctum']);
                Permission::firstOrCreate(['name' => "{$action}_{$model}_own", 'guard_name' => 'sanctum']);
            }
        }

        Permission::firstOrCreate(['name' => 'invite_users', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'view_workspace_members', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_workspace_members', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'remove_workspace_members', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_roles', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_properties', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'view_properties', 'guard_name' => 'sanctum']);

        // System-level permissions
        Permission::firstOrCreate(['name' => 'view_reports', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'export_reports', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'view_dashboard', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_audit_log', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_settings', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_teams', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_backup', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_panel_configs', 'guard_name' => 'sanctum']);

        $allPermissions = Permission::all();

        // Migrate existing 'Standard User' → 'Workspace Member' (before creating new roles)
        $oldRole = Role::where('name', 'Standard User')->first();
        if ($oldRole) {
            $oldRole->name = 'Workspace Member';
            $oldRole->save();
        }

        // Workspace Owner — full access
        $owner = Role::firstOrCreate(['name' => 'Workspace Owner', 'guard_name' => 'sanctum']);
        $owner->syncPermissions($allPermissions);

        // Workspace Admin — all permissions
        $admin = Role::firstOrCreate(['name' => 'Workspace Admin', 'guard_name' => 'sanctum']);
        $admin->syncPermissions($allPermissions);

        // Workspace Member — view all, create, edit own
        $memberPerms = [];
        foreach ($models as $model) {
            $memberPerms[] = "view_{$model}_all";
            $memberPerms[] = "create_{$model}";
            $memberPerms[] = "edit_{$model}_own";
        }
        $memberPerms[] = 'view_workspace_members';
        $memberPerms[] = 'view_properties';
        $member = Role::firstOrCreate(['name' => 'Workspace Member', 'guard_name' => 'sanctum']);
        $member->syncPermissions($memberPerms);

        // Workspace Viewer — read-only
        $viewerPerms = [];
        foreach ($models as $model) {
            $viewerPerms[] = "view_{$model}_all";
        }
        $viewerPerms[] = 'view_workspace_members';
        $viewerPerms[] = 'view_properties';
        $viewer = Role::firstOrCreate(['name' => 'Workspace Viewer', 'guard_name' => 'sanctum']);
        $viewer->syncPermissions($viewerPerms);
    }

    public function down(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Reverse the Standard User rename
        $memberRole = Role::where('name', 'Workspace Member')->first();
        if ($memberRole) {
            $memberRole->name = 'Standard User';
            $memberRole->save();
        }

        // Remove new roles
        Role::where('name', 'Workspace Admin')->delete();
        Role::where('name', 'Workspace Viewer')->delete();

        // Remove system-level permissions
        foreach (['view_reports', 'export_reports', 'view_dashboard', 'manage_audit_log', 'manage_settings', 'manage_teams', 'manage_backup', 'manage_panel_configs'] as $perm) {
            Permission::where('name', $perm)->delete();
        }
    }
};
