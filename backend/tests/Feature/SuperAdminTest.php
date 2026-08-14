<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Workspace;
use App\Models\User;

class SuperAdminTest extends TestCase
{
    use TestHelpers;

    public function test_super_admin_can_list_workspaces(): void
    {
        $this->authenticateAsSuperAdmin();
        Workspace::factory()->count(3)->create();

        $response = $this->getJson('/api/super-admin/workspaces');

        $response->assertStatus(200);
    }

    public function test_super_admin_can_create_workspace(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $response = $this->postJson('/api/super-admin/workspaces', [
            'company_name' => 'New Workspace',
            'admin_full_name' => 'Owner Name',
            'admin_email' => 'owner@test.com',
            'plan' => 'starter',
            'user_limit' => 10,
            'status' => 'active',
            'industry' => 'technology',
            'company_country' => 'US',
            'name' => 'New Workspace',
            'slug' => 'new-workspace-slug',
            'timezone' => 'UTC',
            'currency' => 'USD',
            'default_language' => 'en',
            'default_date_format' => 'iso',
            'billing_cycle' => 'monthly',
            'billing_email' => 'owner@test.com',
        ]);

        $response->assertStatus(201);
        $response->assertJson(['status' => 'success']);
        $this->assertDatabaseHas('workspaces', ['name' => 'New Workspace']);
    }

    public function test_super_admin_can_delete_workspace(): void
    {
        $this->authenticateAsSuperAdmin();
        $workspace = Workspace::factory()->create();

        $response = $this->deleteJson('/api/super-admin/workspaces/' . $workspace->id);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'success']);
    }

    public function test_non_super_admin_cannot_access_super_admin_routes(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/workspaces');

        $response->assertStatus(403);
    }

    public function test_create_workspace_validation(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->postJson('/api/super-admin/workspaces', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['company_name', 'admin_full_name', 'admin_email', 'plan', 'user_limit', 'status']);
    }

    // ═══════════════════════════════════════════════════════════
    // Tenant endpoints
    // ═══════════════════════════════════════════════════════════

    public function test_super_admin_can_list_tenants(): void
    {
        $this->authenticateAsSuperAdmin();
        Workspace::factory()->count(3)->create(['company_name' => 'Test Co']);

        $response = $this->getJson('/api/super-admin/tenants');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'company_name', 'plan', 'user_limit', 'current_user_count', 'status', 'created_at'],
            ],
            'meta' => ['page', 'limit', 'total'],
        ]);
    }

    public function test_tenants_list_supports_search(): void
    {
        $this->authenticateAsSuperAdmin();
        Workspace::factory()->create(['company_name' => 'Acme Corp']);
        Workspace::factory()->create(['company_name' => 'Beta Inc']);

        $response = $this->getJson('/api/super-admin/tenants?q=Acme');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.company_name', 'Acme Corp');
    }

    public function test_tenants_list_supports_status_filter(): void
    {
        $this->authenticateAsSuperAdmin();
        Workspace::factory()->create(['status' => 'active']);
        Workspace::factory()->create(['status' => 'trial']);

        $response = $this->getJson('/api/super-admin/tenants?status=active');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
    }

    public function test_super_admin_can_get_single_tenant(): void
    {
        $this->authenticateAsSuperAdmin();
        $workspace = Workspace::factory()->create([
            'company_name' => 'Acme Corp',
            'plan' => 'pro',
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/super-admin/tenants/' . $workspace->id);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => ['id', 'company_name', 'plan', 'user_limit', 'status', 'created_at'],
        ]);
        $response->assertJsonPath('data.company_name', 'Acme Corp');
        $response->assertJsonPath('data.plan', 'pro');
    }

    public function test_super_admin_can_create_tenant(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $response = $this->postJson('/api/super-admin/tenants', [
            'company_name' => 'New Tenant Co',
            'admin_full_name' => 'Admin User',
            'admin_email' => 'admin@newtenant.com',
            'plan' => 'pro',
            'user_limit' => 25,
            'status' => 'active',
            'industry' => 'technology',
            'company_country' => 'US',
            'name' => 'New Tenant Co',
            'slug' => 'new-tenant-slug',
            'timezone' => 'UTC',
            'currency' => 'USD',
            'default_language' => 'en',
            'default_date_format' => 'iso',
            'billing_cycle' => 'monthly',
            'billing_email' => 'admin@newtenant.com',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => ['id', 'company_name', 'admin_full_name', 'admin_email', 'plan', 'user_limit', 'current_user_count', 'status', 'created_at'],
        ]);
        $response->assertJsonPath('data.company_name', 'New Tenant Co');
        $response->assertJsonPath('data.plan', 'pro');
        $response->assertJsonPath('data.user_limit', 25);
        $this->assertDatabaseHas('workspaces', ['name' => 'New Tenant Co', 'company_name' => 'New Tenant Co']);
    }

    public function test_super_admin_can_create_tenant_with_duplicate_slug(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        Workspace::factory()->create([
            'slug' => 'duplicate-slug',
        ]);

        $response = $this->postJson('/api/super-admin/tenants', [
            'company_name' => 'Duplicate Tenant Co',
            'admin_full_name' => 'Admin User',
            'admin_email' => 'admin@duplicatetenant.com',
            'plan' => 'pro',
            'user_limit' => 25,
            'status' => 'active',
            'industry' => 'technology',
            'company_country' => 'US',
            'name' => 'Duplicate Tenant Co',
            'slug' => 'duplicate-slug',
            'timezone' => 'UTC',
            'currency' => 'USD',
            'default_language' => 'en',
            'default_date_format' => 'iso',
            'billing_cycle' => 'monthly',
            'billing_email' => 'admin@duplicatetenant.com',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('workspaces', ['slug' => 'duplicate-slug-2']);
        $this->assertDatabaseHas('workspaces', ['company_name' => 'Duplicate Tenant Co']);
    }

    public function test_super_admin_can_create_trial_tenant(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $response = $this->postJson('/api/super-admin/tenants', [
            'company_name' => 'Trial Co',
            'admin_full_name' => 'Trial Admin',
            'admin_email' => 'admin@trial.com',
            'plan' => 'starter',
            'user_limit' => 5,
            'status' => 'trial',
            'trial_end_date' => now()->addDays(14)->format('Y-m-d'),
            'industry' => 'technology',
            'company_country' => 'US',
            'name' => 'Trial Co',
            'slug' => 'trial-tenant-slug',
            'timezone' => 'UTC',
            'currency' => 'USD',
            'default_language' => 'en',
            'default_date_format' => 'iso',
            'billing_cycle' => 'monthly',
            'billing_email' => 'admin@trial.com',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.status', 'trial');
        $this->assertDatabaseHas('workspaces', ['name' => 'Trial Co', 'status' => 'trial']);
    }

    public function test_super_admin_can_update_tenant(): void
    {
        $this->authenticateAsSuperAdmin();
        $workspace = Workspace::factory()->create([
            'plan' => 'starter',
            'status' => 'active',
            'max_users' => 10,
        ]);

        $response = $this->patchJson('/api/super-admin/tenants/' . $workspace->id, [
            'plan' => 'enterprise',
            'user_limit' => 50,
            'status' => 'suspended',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.plan', 'enterprise');
        $response->assertJsonPath('data.user_limit', 50);
        $response->assertJsonPath('data.status', 'suspended');
        $this->assertDatabaseHas('workspaces', [
            'id' => $workspace->id,
            'plan' => 'enterprise',
            'status' => 'suspended',
        ]);
    }

    public function test_update_tenant_clears_trial_end_date_when_status_not_trial(): void
    {
        $this->authenticateAsSuperAdmin();
        $workspace = Workspace::factory()->create([
            'status' => 'trial',
            'trial_end_date' => now()->addDays(7)->format('Y-m-d'),
        ]);

        $response = $this->patchJson('/api/super-admin/tenants/' . $workspace->id, [
            'status' => 'active',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('workspaces', [
            'id' => $workspace->id,
            'status' => 'active',
            'trial_end_date' => null,
        ]);
    }

    public function test_tenants_validation_requires_company_name(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->postJson('/api/super-admin/tenants', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['company_name', 'admin_full_name', 'admin_email', 'plan', 'user_limit', 'status']);
    }

    public function test_non_super_admin_cannot_access_tenants(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/tenants');

        $response->assertStatus(403);
    }
}
