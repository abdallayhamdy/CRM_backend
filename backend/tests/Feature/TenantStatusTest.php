<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\Workspace;

class TenantStatusTest extends TestCase
{
    use TestHelpers;

    // ═══════════════════════════════════════════════════════════════
    // Middleware: status enforcement
    // ═══════════════════════════════════════════════════════════════

    public function test_suspended_workspace_blocks_access(): void
    {
        $this->authenticateAsAdmin();
        $this->workspace->update(['status' => 'suspended']);

        $response = $this->getJson('/api/companies');

        $response->assertStatus(403);
        $response->assertJson([
            'status' => 'error',
            'message' => 'This workspace has been suspended.',
        ]);
    }

    public function test_churned_workspace_blocks_access(): void
    {
        $this->authenticateAsAdmin();
        $this->workspace->update(['status' => 'churned']);

        $response = $this->getJson('/api/companies');

        $response->assertStatus(403);
        $response->assertJson([
            'status' => 'error',
            'message' => 'This workspace has been churned.',
        ]);
    }

    public function test_expired_trial_blocks_access(): void
    {
        $this->authenticateAsAdmin();
        $this->workspace->update([
            'status' => 'trial',
            'trial_end_date' => now()->subDay()->format('Y-m-d'),
        ]);

        $response = $this->getJson('/api/companies');

        $response->assertStatus(403);
        $response->assertJson([
            'status' => 'error',
            'message' => 'This workspace trial has expired.',
        ]);
    }

    public function test_active_workspace_allows_access(): void
    {
        $this->authenticateAsAdmin();
        $this->workspace->update(['status' => 'active']);

        $response = $this->getJson('/api/companies');

        $response->assertStatus(200);
    }

    public function test_trial_workspace_with_future_date_allows_access(): void
    {
        $this->authenticateAsAdmin();
        $this->workspace->update([
            'status' => 'trial',
            'trial_end_date' => now()->addDays(7)->format('Y-m-d'),
        ]);

        $response = $this->getJson('/api/companies');

        $response->assertStatus(200);
    }

    public function test_super_admin_bypasses_workspace_status_check(): void
    {
        $this->authenticateAsSuperAdmin();
        $workspace = Workspace::factory()->create(['status' => 'suspended']);

        $response = $this->getJson('/api/super-admin/tenants');

        $response->assertStatus(200);
    }

    // ═══════════════════════════════════════════════════════════════
    // Status transitions: user cascade
    // ═══════════════════════════════════════════════════════════════

    public function test_suspension_deactivates_all_members(): void
    {
        $this->authenticateAsSuperAdmin();
        $workspace = Workspace::factory()->create(['status' => 'active']);
        $user1 = User::factory()->create(['workspace_id' => $workspace->id]);
        $user2 = User::factory()->create(['workspace_id' => $workspace->id]);
        $user1->workspaces()->attach($workspace->id, ['role_name' => 'Workspace Member', 'is_active' => true]);
        $user2->workspaces()->attach($workspace->id, ['role_name' => 'Workspace Owner', 'is_active' => true]);

        $this->patchJson('/api/super-admin/tenants/' . $workspace->id, [
            'status' => 'suspended',
        ])->assertStatus(200);

        $this->assertDatabaseHas('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $user1->id,
            'is_active' => false,
        ]);
        $this->assertDatabaseHas('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $user2->id,
            'is_active' => false,
        ]);
    }

    public function test_reactivation_activates_all_members(): void
    {
        $this->authenticateAsSuperAdmin();
        $workspace = Workspace::factory()->create(['status' => 'suspended']);
        $user1 = User::factory()->create(['workspace_id' => $workspace->id]);
        $user1->workspaces()->attach($workspace->id, ['role_name' => 'Workspace Member', 'is_active' => false]);

        $this->patchJson('/api/super-admin/tenants/' . $workspace->id, [
            'status' => 'active',
        ])->assertStatus(200);

        $this->assertDatabaseHas('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $user1->id,
            'is_active' => true,
        ]);
    }

    public function test_churning_deactivates_all_members(): void
    {
        $this->authenticateAsSuperAdmin();
        $workspace = Workspace::factory()->create(['status' => 'active']);
        $user1 = User::factory()->create(['workspace_id' => $workspace->id]);
        $user1->workspaces()->attach($workspace->id, ['role_name' => 'Workspace Member', 'is_active' => true]);

        $this->patchJson('/api/super-admin/tenants/' . $workspace->id, [
            'status' => 'churned',
        ])->assertStatus(200);

        $this->assertDatabaseHas('workspace_user', [
            'workspace_id' => $workspace->id,
            'user_id' => $user1->id,
            'is_active' => false,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // Audit logging
    // ═══════════════════════════════════════════════════════════════

    public function test_suspension_creates_audit_log(): void
    {
        $this->authenticateAsSuperAdmin();
        $workspace = Workspace::factory()->create(['status' => 'active']);

        $this->patchJson('/api/super-admin/tenants/' . $workspace->id, [
            'status' => 'suspended',
        ])->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'workspace_id' => $workspace->id,
            'action' => 'workspace_suspended',
            'category' => 'workspace',
            'subcategory' => 'super_admin',
        ]);
    }

    public function test_reactivation_creates_audit_log(): void
    {
        $this->authenticateAsSuperAdmin();
        $workspace = Workspace::factory()->create(['status' => 'suspended']);

        $this->patchJson('/api/super-admin/tenants/' . $workspace->id, [
            'status' => 'active',
        ])->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'workspace_id' => $workspace->id,
            'action' => 'workspace_activated',
            'category' => 'workspace',
            'subcategory' => 'super_admin',
        ]);
    }

    public function test_churning_creates_audit_log(): void
    {
        $this->authenticateAsSuperAdmin();
        $workspace = Workspace::factory()->create(['status' => 'active']);

        $this->patchJson('/api/super-admin/tenants/' . $workspace->id, [
            'status' => 'churned',
        ])->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'workspace_id' => $workspace->id,
            'action' => 'workspace_churned',
            'category' => 'workspace',
            'subcategory' => 'super_admin',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    // Delete
    // ═══════════════════════════════════════════════════════════════

    public function test_super_admin_can_delete_tenant(): void
    {
        $this->authenticateAsSuperAdmin();
        $workspace = Workspace::factory()->create();

        $response = $this->deleteJson('/api/super-admin/tenants/' . $workspace->id);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'success', 'message' => 'Tenant deleted.']);
        $this->assertSoftDeleted('workspaces', ['id' => $workspace->id]);
    }

    public function test_delete_creates_audit_log(): void
    {
        $this->authenticateAsSuperAdmin();
        $workspace = Workspace::factory()->create(['name' => 'Doomed Co']);

        $this->deleteJson('/api/super-admin/tenants/' . $workspace->id)->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'workspace_id' => $workspace->id,
            'action' => 'workspace_deleted',
            'category' => 'workspace',
            'subcategory' => 'super_admin',
        ]);
    }

    public function test_non_super_admin_cannot_delete_tenant(): void
    {
        $this->authenticateAsAdmin();
        $workspace = Workspace::factory()->create();

        $response = $this->deleteJson('/api/super-admin/tenants/' . $workspace->id);

        $response->assertStatus(403);
    }
}
