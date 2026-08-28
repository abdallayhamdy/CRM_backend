<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $registrar = app()[\Spatie\Permission\PermissionRegistrar::class];
        $registrar->forgetCachedPermissions();

        // =====================================================================
        //  PART 3: Dead permissions — never create these
        // =====================================================================
        $deadPermissions = [
            'edit_products_own', 'delete_products_own',
            'edit_pipelines_own', 'delete_pipelines_own',
            'edit_stages_own', 'delete_stages_own',
        ];

        // =====================================================================
        //  CRM Record Permissions (contacts, companies, deals, tickets, tasks)
        // =====================================================================
        $crmModels = ['contacts', 'companies', 'deals', 'tickets', 'tasks'];

        foreach ($crmModels as $model) {
            Permission::firstOrCreate(['name' => "view_{$model}_all",  'guard_name' => 'sanctum']);
            Permission::firstOrCreate(['name' => "view_{$model}_own",  'guard_name' => 'sanctum']);
            Permission::firstOrCreate(['name' => "create_{$model}",    'guard_name' => 'sanctum']);
            Permission::firstOrCreate(['name' => "edit_{$model}_all",  'guard_name' => 'sanctum']);
            Permission::firstOrCreate(['name' => "edit_{$model}_own",  'guard_name' => 'sanctum']);
            Permission::firstOrCreate(['name' => "delete_{$model}_all",'guard_name' => 'sanctum']);
            Permission::firstOrCreate(['name' => "delete_{$model}_own",'guard_name' => 'sanctum']);
        }

        // =====================================================================
        //  CRM Tools (merge, import, export, bulk)
        // =====================================================================
        $crmToolModels = ['contacts', 'companies', 'deals'];

        foreach ($crmToolModels as $model) {
            Permission::firstOrCreate(['name' => "import_{$model}",      'guard_name' => 'sanctum']);
            Permission::firstOrCreate(['name' => "export_{$model}",      'guard_name' => 'sanctum']);
            Permission::firstOrCreate(['name' => "bulk_delete_{$model}", 'guard_name' => 'sanctum']);
            Permission::firstOrCreate(['name' => "bulk_edit_{$model}",   'guard_name' => 'sanctum']);
        }

        Permission::firstOrCreate(['name' => 'merge_contacts',      'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'merge_companies',     'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'customize_crm_layout','guard_name' => 'sanctum']);

        // =====================================================================
        //  CRM Supporting Modules — skip dead _own permissions
        // =====================================================================
        $supportModels = ['products', 'orders', 'documents', 'notes', 'activities', 'pipelines', 'stages'];

        foreach ($supportModels as $model) {
            Permission::firstOrCreate(['name' => "view_{$model}_all",   'guard_name' => 'sanctum']);
            Permission::firstOrCreate(['name' => "view_{$model}_own",   'guard_name' => 'sanctum']);
            Permission::firstOrCreate(['name' => "create_{$model}",     'guard_name' => 'sanctum']);
            Permission::firstOrCreate(['name' => "edit_{$model}_all",   'guard_name' => 'sanctum']);
            Permission::firstOrCreate(['name' => "delete_{$model}_all", 'guard_name' => 'sanctum']);

            if (!in_array("edit_{$model}_own", $deadPermissions)) {
                Permission::firstOrCreate(['name' => "edit_{$model}_own",   'guard_name' => 'sanctum']);
            }
            if (!in_array("delete_{$model}_own", $deadPermissions)) {
                Permission::firstOrCreate(['name' => "delete_{$model}_own", 'guard_name' => 'sanctum']);
            }
        }

        // =====================================================================
        //  Activity Comment Permissions
        // =====================================================================
        Permission::firstOrCreate(['name' => 'edit_activity_comments_own',   'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'delete_activity_comments_own', 'guard_name' => 'sanctum']);

        // =====================================================================
        //  Reports
        // =====================================================================
        Permission::firstOrCreate(['name' => 'view_reports',      'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'create_reports',    'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'edit_reports',      'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'delete_reports',    'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'export_reports',    'guard_name' => 'sanctum']);

        // =====================================================================
        //  Dashboard
        // =====================================================================
        Permission::firstOrCreate(['name' => 'view_dashboard', 'guard_name' => 'sanctum']);

        // =====================================================================
        //  Workspace Administration
        // =====================================================================
        Permission::firstOrCreate(['name' => 'manage_users',           'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_roles',           'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_teams',           'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_permission_sets', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_settings',        'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_pipelines',       'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_custom_fields',   'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_automations',     'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_integrations',    'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_billing',         'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'delete_workspace',       'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_audit_log',       'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_backup',          'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_panel_configs',   'guard_name' => 'sanctum']);

        // =====================================================================
        //  Workspace Members & Properties
        // =====================================================================
        Permission::firstOrCreate(['name' => 'invite_users',              'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'view_workspace_members',    'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_workspace_members',  'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'remove_workspace_members',  'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'view_properties',           'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'manage_properties',         'guard_name' => 'sanctum']);

        // =====================================================================
        //  Clean up any stale dead permissions from previous seeds
        // =====================================================================
        Permission::whereIn('name', $deadPermissions)->delete();
        $registrar->forgetCachedPermissions();

        // =====================================================================
        //  Build permission sets per role
        // =====================================================================
        $allPermissions = Permission::all()->pluck('name')->toArray();

        // ---------------------------------------------------------------------
        //  Workspace Owner — full access
        // ---------------------------------------------------------------------
        $ownerPerms = $allPermissions;

        // ---------------------------------------------------------------------
        //  Workspace Admin — daily operations only (no billing, no config)
        // ---------------------------------------------------------------------
        $adminExclusions = [
            'manage_billing',
            'delete_workspace',
            'manage_integrations',
            'manage_automations',
            'manage_custom_fields',
            'manage_pipelines',
            'manage_properties',
            'customize_crm_layout',
        ];
        $adminPerms = array_values(array_filter(
            $allPermissions,
            fn($p) => !in_array($p, $adminExclusions)
        ));

        // ---------------------------------------------------------------------
        //  Workspace Member — view all, create operational records, edit own
        // ---------------------------------------------------------------------
        $memberExclusions = [
            'create_products',
            'create_pipelines',
            'create_stages',
        ];

        $memberPerms = [];

        // CRM Records — view all, create, edit_own, delete_own (where allowed)
        foreach ($crmModels as $model) {
            $memberPerms[] = "view_{$model}_all";
            $memberPerms[] = "create_{$model}";
            $memberPerms[] = "edit_{$model}_own";
        }
        $memberPerms[] = 'delete_contacts_own';
        $memberPerms[] = 'delete_tasks_own';

        // Supporting modules — view all, create (except excluded), edit own
        foreach ($supportModels as $model) {
            $memberPerms[] = "view_{$model}_all";
            if (!in_array("create_{$model}", $memberExclusions)) {
                $memberPerms[] = "create_{$model}";
            }
            // Skip dead permissions that no longer exist
            $editPerm = "edit_{$model}_own";
            if (!in_array($editPerm, $deadPermissions)) {
                $memberPerms[] = $editPerm;
            }
        }

        // Activity comments — manage own
        $memberPerms[] = 'edit_activity_comments_own';
        $memberPerms[] = 'delete_activity_comments_own';

        // Dashboard + Reports (view only)
        $memberPerms[] = 'view_dashboard';
        $memberPerms[] = 'view_reports';

        // Workspace members — view only
        $memberPerms[] = 'view_workspace_members';
        $memberPerms[] = 'view_properties';

        // ---------------------------------------------------------------------
        //  Workspace Viewer — read-only
        // ---------------------------------------------------------------------
        $viewerPerms = [];

        foreach ($crmModels as $model) {
            $viewerPerms[] = "view_{$model}_all";
        }

        foreach ($supportModels as $model) {
            $viewerPerms[] = "view_{$model}_all";
        }

        $viewerPerms[] = 'view_dashboard';
        $viewerPerms[] = 'view_reports';
        $viewerPerms[] = 'view_workspace_members';
        $viewerPerms[] = 'view_properties';

        // =====================================================================
        //  Sync roles
        // =====================================================================
        $owner = Role::firstOrCreate(['name' => 'Workspace Owner', 'guard_name' => 'sanctum']);
        $owner->syncPermissions($ownerPerms);

        $admin = Role::firstOrCreate(['name' => 'Workspace Admin', 'guard_name' => 'sanctum']);
        $admin->syncPermissions($adminPerms);

        $member = Role::firstOrCreate(['name' => 'Workspace Member', 'guard_name' => 'sanctum']);
        $member->syncPermissions($memberPerms);

        $viewer = Role::firstOrCreate(['name' => 'Workspace Viewer', 'guard_name' => 'sanctum']);
        $viewer->syncPermissions($viewerPerms);
    }
}
