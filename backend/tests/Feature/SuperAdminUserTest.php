<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Workspace;
use App\Models\User;

class SuperAdminUserTest extends TestCase
{
    use TestHelpers;

    private function createUserWithWorkspace(string $roleName = 'Workspace Member', bool $isActive = true): array
    {
        $workspace = Workspace::factory()->create(['company_name' => 'Test Co']);
        $user = User::factory()->create(['workspace_id' => $workspace->id]);
        $user->workspaces()->attach($workspace->id, [
            'role_name' => $roleName,
            'is_active' => $isActive,
        ]);

        return ['user' => $user, 'workspace' => $workspace];
    }

    // ── GET /users ──────────────────────────────────────────────────

    public function test_super_admin_can_list_users(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->createUserWithWorkspace();

        $response = $this->getJson('/api/super-admin/users');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'email', 'tenant_id', 'tenant_name', 'role', 'status', 'created_at'],
            ],
            'meta' => ['page', 'limit', 'total'],
        ]);
    }

    public function test_users_list_excludes_super_admins(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->createUserWithWorkspace();
        User::factory()->superAdmin()->create();

        $response = $this->getJson('/api/super-admin/users');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
    }

    public function test_users_list_supports_search(): void
    {
        $this->authenticateAsSuperAdmin();

        $ws = Workspace::factory()->create(['company_name' => 'Search Co']);
        $alice = User::factory()->create(['name' => 'Alice Smith', 'workspace_id' => $ws->id]);
        $alice->workspaces()->attach($ws->id, ['role_name' => 'Workspace Member', 'is_active' => true]);

        $bob = User::factory()->create(['name' => 'Bob Jones', 'workspace_id' => $ws->id]);
        $bob->workspaces()->attach($ws->id, ['role_name' => 'Workspace Member', 'is_active' => true]);

        $response = $this->getJson('/api/super-admin/users?q=Alice');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.name', 'Alice Smith');
    }

    public function test_users_list_supports_tenant_filter(): void
    {
        $this->authenticateAsSuperAdmin();

        $ws1 = Workspace::factory()->create(['company_name' => 'Co A']);
        $ws2 = Workspace::factory()->create(['company_name' => 'Co B']);

        $u1 = User::factory()->create(['workspace_id' => $ws1->id]);
        $u1->workspaces()->attach($ws1->id, ['role_name' => 'Workspace Member', 'is_active' => true]);

        $u2 = User::factory()->create(['workspace_id' => $ws2->id]);
        $u2->workspaces()->attach($ws2->id, ['role_name' => 'Workspace Member', 'is_active' => true]);

        $response = $this->getJson('/api/super-admin/users?tenant_id=' . $ws1->id);

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
    }

    public function test_users_list_supports_status_filter(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->createUserWithWorkspace('Workspace Member', true);
        $this->createUserWithWorkspace('Workspace Member', false);

        $response = $this->getJson('/api/super-admin/users?status=Active');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.status', 'Active');
    }

    public function test_users_list_supports_role_filter(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->createUserWithWorkspace('Workspace Owner');
        $this->createUserWithWorkspace('Workspace Member');

        $response = $this->getJson('/api/super-admin/users?role=Admin');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.role', 'Admin');
    }

    public function test_non_super_admin_cannot_list_users(): void
    {
        $this->authenticateAsAdmin();
        $this->createUserWithWorkspace();

        $response = $this->getJson('/api/super-admin/users');

        $response->assertStatus(403);
    }

    // ── GET /users/{user} ──────────────────────────────────────────

    public function test_super_admin_can_get_user(): void
    {
        $this->authenticateAsSuperAdmin();
        $data = $this->createUserWithWorkspace('Workspace Owner');

        $response = $this->getJson('/api/super-admin/users/' . $data['user']->id);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => ['id', 'name', 'email', 'tenant_id', 'tenant_name', 'role', 'status', 'created_at'],
        ]);
        $response->assertJsonPath('data.id', $data['user']->id);
    }

    public function test_super_admin_user_returns_404(): void
    {
        $this->authenticateAsSuperAdmin();
        $superAdmin = User::factory()->superAdmin()->create();

        $response = $this->getJson('/api/super-admin/users/' . $superAdmin->id);

        $response->assertStatus(404);
    }

    public function test_non_super_admin_cannot_get_user(): void
    {
        $this->authenticateAsAdmin();
        $data = $this->createUserWithWorkspace();

        $response = $this->getJson('/api/super-admin/users/' . $data['user']->id);

        $response->assertStatus(403);
    }

    // ── PATCH /users/{user}/workspaces/{workspace} ─────────────────

    public function test_super_admin_can_deactivate_user(): void
    {
        $this->authenticateAsSuperAdmin();
        $data = $this->createUserWithWorkspace('Workspace Member', true);

        $response = $this->patchJson(
            '/api/super-admin/users/' . $data['user']->id . '/workspaces/' . $data['workspace']->id,
            ['status' => 'Deactivated']
        );

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'Deactivated');
        $this->assertDatabaseHas('workspace_user', [
            'user_id' => $data['user']->id,
            'workspace_id' => $data['workspace']->id,
            'is_active' => false,
        ]);
    }

    public function test_super_admin_can_reactivate_user(): void
    {
        $this->authenticateAsSuperAdmin();
        $data = $this->createUserWithWorkspace('Workspace Member', false);

        $response = $this->patchJson(
            '/api/super-admin/users/' . $data['user']->id . '/workspaces/' . $data['workspace']->id,
            ['status' => 'Active']
        );

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'Active');
        $this->assertDatabaseHas('workspace_user', [
            'user_id' => $data['user']->id,
            'workspace_id' => $data['workspace']->id,
            'is_active' => true,
        ]);
    }

    public function test_status_update_creates_audit_log(): void
    {
        $this->authenticateAsSuperAdmin();
        $data = $this->createUserWithWorkspace('Workspace Member', true);

        $this->patchJson(
            '/api/super-admin/users/' . $data['user']->id . '/workspaces/' . $data['workspace']->id,
            ['status' => 'Deactivated']
        );

        $this->assertDatabaseHas('audit_logs', [
            'workspace_id' => $data['workspace']->id,
            'action' => 'user_deactivated',
            'subcategory' => 'super_admin',
            'source' => 'super_admin_panel',
        ]);
    }

    public function test_cannot_deactivate_super_admin(): void
    {
        $this->authenticateAsSuperAdmin();
        $superAdmin = User::factory()->superAdmin()->create();
        $ws = Workspace::factory()->create();
        $superAdmin->workspaces()->attach($ws->id, [
            'role_name' => 'Workspace Owner',
            'is_active' => true,
        ]);

        $response = $this->patchJson(
            '/api/super-admin/users/' . $superAdmin->id . '/workspaces/' . $ws->id,
            ['status' => 'Deactivated']
        );

        $response->assertStatus(403);
    }

    public function test_cannot_modify_own_status(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        \Laravel\Sanctum\Sanctum::actingAs($superAdmin);
        $ws = Workspace::factory()->create();
        $superAdmin->workspaces()->attach($ws->id, [
            'role_name' => 'Workspace Owner',
            'is_active' => true,
        ]);

        $response = $this->patchJson(
            '/api/super-admin/users/' . $superAdmin->id . '/workspaces/' . $ws->id,
            ['status' => 'Deactivated']
        );

        $response->assertStatus(403);
    }

    public function test_status_update_validates_status_value(): void
    {
        $this->authenticateAsSuperAdmin();
        $data = $this->createUserWithWorkspace();

        $response = $this->patchJson(
            '/api/super-admin/users/' . $data['user']->id . '/workspaces/' . $data['workspace']->id,
            ['status' => 'InvalidStatus']
        );

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['status']);
    }

    public function test_non_super_admin_cannot_update_status(): void
    {
        $this->authenticateAsAdmin();
        $data = $this->createUserWithWorkspace();

        $response = $this->patchJson(
            '/api/super-admin/users/' . $data['user']->id . '/workspaces/' . $data['workspace']->id,
            ['status' => 'Deactivated']
        );

        $response->assertStatus(403);
    }
}
