<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Workspace;
use App\Models\User;
use App\Models\Contact;
use App\Models\Company;
use App\Models\Deal;
use App\Models\Activity;
use App\Models\Task;
use App\Models\Document;
use App\Models\AuditLog;

class SuperAdminUsageTest extends TestCase
{
    use TestHelpers;

    private function createWorkspaceWithData(
        string $status = 'active',
        int $contactCount = 0,
        int $dealCount = 0,
        int $activityCount = 0,
        int $taskCount = 0,
        int $documentCount = 0,
    ): Workspace {
        $workspace = Workspace::factory()->create(['status' => $status]);
        $user = User::factory()->create(['workspace_id' => $workspace->id]);
        $user->workspaces()->attach($workspace->id, [
            'role_name' => 'Workspace Owner',
            'is_active' => true,
        ]);

        for ($i = 0; $i < $contactCount; $i++) {
            Contact::factory()->create(['workspace_id' => $workspace->id]);
        }
        for ($i = 0; $i < $dealCount; $i++) {
            Deal::factory()->create(['workspace_id' => $workspace->id, 'contact_id' => null]);
        }
        for ($i = 0; $i < $activityCount; $i++) {
            Activity::factory()->create([
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'type' => 'call',
            ]);
        }
        for ($i = 0; $i < $taskCount; $i++) {
            Task::factory()->create(['workspace_id' => $workspace->id, 'created_by' => $user->id]);
        }
        for ($i = 0; $i < $documentCount; $i++) {
            Document::factory()->create(['workspace_id' => $workspace->id, 'uploaded_by' => $user->id]);
        }

        return $workspace;
    }

    // ── GET /usage/summary ─────────────────────────────────────────

    public function test_super_admin_can_get_usage_summary(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->createWorkspaceWithData();
        $this->createWorkspaceWithData(status: 'churned');

        $response = $this->getJson('/api/super-admin/usage/summary');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => ['total_tenants', 'total_active_users', 'avg_users_per_tenant', 'churn_rate'],
        ]);
        $response->assertJsonPath('data.total_tenants', 2);
        $response->assertJsonPath('data.churn_rate', 50);
    }

    public function test_summary_counts_unique_active_users(): void
    {
        $this->authenticateAsSuperAdmin();
        $ws1 = Workspace::factory()->create();
        $ws2 = Workspace::factory()->create();
        $user = User::factory()->create(['workspace_id' => $ws1->id]);
        $user->workspaces()->attach([$ws1->id, $ws2->id], [
            'role_name' => 'Workspace Member',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/super-admin/usage/summary');

        $response->assertStatus(200);
        $response->assertJsonPath('data.total_active_users', 1);
    }

    public function test_summary_excludes_soft_deleted_workspaces(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->createWorkspaceWithData();
        Workspace::factory()->create(['deleted_at' => now()]);

        $response = $this->getJson('/api/super-admin/usage/summary');

        $response->assertStatus(200);
        $response->assertJsonPath('data.total_tenants', 1);
    }

    public function test_summary_with_no_data(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/usage/summary');

        $response->assertStatus(200);
        $response->assertJsonPath('data.total_tenants', 0);
        $response->assertJsonPath('data.total_active_users', 0);
        $response->assertJsonPath('data.avg_users_per_tenant', 0);
        $response->assertJsonPath('data.churn_rate', 0);
    }

    public function test_non_super_admin_cannot_get_usage_summary(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/usage/summary');

        $response->assertStatus(403);
    }

    // ── GET /usage/growth ──────────────────────────────────────────

    public function test_super_admin_can_get_growth_data(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->createWorkspaceWithData();

        $response = $this->getJson('/api/super-admin/usage/growth');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['month', 'new_tenants', 'total_active_users'],
            ],
        ]);
        $this->assertGreaterThan(0, count($response->json('data')));
    }

    public function test_growth_data_groups_by_quarter(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->createWorkspaceWithData();
        $this->createWorkspaceWithData();

        $response = $this->getJson('/api/super-admin/usage/growth');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertNotEmpty($data);

        foreach ($data as $point) {
            $this->assertArrayHasKey('month', $point);
            $this->assertArrayHasKey('new_tenants', $point);
            $this->assertArrayHasKey('total_active_users', $point);
            $this->assertMatchesRegularExpression('/^Q[1-4] \d{4}$/', $point['month']);
        }
    }

    public function test_growth_data_returns_empty_with_no_workspaces(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/usage/growth');

        $response->assertStatus(200);
        $response->assertJsonPath('data', []);
    }

    public function test_non_super_admin_cannot_get_growth_data(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/usage/growth');

        $response->assertStatus(403);
    }

    // ── GET /usage/tenant-usage ────────────────────────────────────

    public function test_super_admin_can_get_tenant_usage(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->createWorkspaceWithData(activityCount: 5);

        $response = $this->getJson('/api/super-admin/usage/tenant-usage');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['tenant_id', 'tenant_name', 'audit_events'],
            ],
        ]);
    }

    public function test_tenant_usage_counts_audit_logs_last_30_days(): void
    {
        $this->authenticateAsSuperAdmin();
        $workspace = $this->createWorkspaceWithData();

        AuditLog::factory()->count(3)->create([
            'workspace_id' => $workspace->id,
            'created_at' => now()->subDays(10),
        ]);

        $response = $this->getJson('/api/super-admin/usage/tenant-usage');

        $response->assertStatus(200);
        $data = $response->json('data');
        $tenantData = collect($data)->firstWhere('tenant_id', $workspace->id);
        $this->assertNotNull($tenantData);
        $this->assertEquals(3, $tenantData['audit_events']);
    }

    public function test_tenant_usage_excludes_old_audit_logs(): void
    {
        $this->authenticateAsSuperAdmin();
        $workspace = $this->createWorkspaceWithData();

        AuditLog::factory()->count(5)->create([
            'workspace_id' => $workspace->id,
            'created_at' => now()->subDays(60),
        ]);

        $response = $this->getJson('/api/super-admin/usage/tenant-usage');

        $response->assertStatus(200);
        $data = $response->json('data');
        $tenantData = collect($data)->firstWhere('tenant_id', $workspace->id);
        $this->assertNull($tenantData);
    }

    public function test_non_super_admin_cannot_get_tenant_usage(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/usage/tenant-usage');

        $response->assertStatus(403);
    }

    // ── GET /usage/feature-adoption ────────────────────────────────

    public function test_super_admin_can_get_feature_adoption(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->createWorkspaceWithData(contactCount: 3, dealCount: 2);

        $response = $this->getJson('/api/super-admin/usage/feature-adoption');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['feature', 'adopted', 'total'],
            ],
        ]);
        $data = $response->json('data');
        $this->assertCount(6, $data);
    }

    public function test_feature_adoption_counts_distinct_workspaces(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->createWorkspaceWithData(contactCount: 5);
        $this->createWorkspaceWithData(contactCount: 3);

        $response = $this->getJson('/api/super-admin/usage/feature-adoption');

        $response->assertStatus(200);
        $data = $response->json('data');
        $contactsFeature = collect($data)->firstWhere('feature', 'Contacts');
        $this->assertEquals(2, $contactsFeature['adopted']);
        $this->assertEquals(2, $contactsFeature['total']);
    }

    public function test_feature_adoption_excludes_soft_deleted_records(): void
    {
        $this->authenticateAsSuperAdmin();
        $ws = $this->createWorkspaceWithData();

        Contact::factory()->count(3)->create(['workspace_id' => $ws->id]);
        Contact::factory()->count(2)->create(['workspace_id' => $ws->id, 'deleted_at' => now()]);

        $response = $this->getJson('/api/super-admin/usage/feature-adoption');

        $response->assertStatus(200);
        $data = $response->json('data');
        $contactsFeature = collect($data)->firstWhere('feature', 'Contacts');
        $this->assertEquals(1, $contactsFeature['adopted']);
    }

    public function test_feature_adoption_excludes_churned_tenants(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->createWorkspaceWithData(status: 'churned', contactCount: 5);
        $this->createWorkspaceWithData(contactCount: 3);

        $response = $this->getJson('/api/super-admin/usage/feature-adoption');

        $response->assertStatus(200);
        $data = $response->json('data');
        $contactsFeature = collect($data)->firstWhere('feature', 'Contacts');
        $this->assertEquals(1, $contactsFeature['adopted']);
        $this->assertEquals(1, $contactsFeature['total']);
    }

    public function test_feature_adoption_returns_empty_with_no_active_tenants(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/usage/feature-adoption');

        $response->assertStatus(200);
        $response->assertJsonPath('data', []);
    }

    public function test_calls_log_only_counts_call_activities(): void
    {
        $this->authenticateAsSuperAdmin();
        $workspace = Workspace::factory()->create();
        $user = User::factory()->create(['workspace_id' => $workspace->id]);
        $user->workspaces()->attach($workspace->id, ['role_name' => 'Workspace Owner', 'is_active' => true]);

        Activity::factory()->count(3)->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'type' => 'call',
        ]);
        Activity::factory()->count(5)->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'type' => 'meeting',
        ]);

        $response = $this->getJson('/api/super-admin/usage/feature-adoption');

        $response->assertStatus(200);
        $data = $response->json('data');
        $callsFeature = collect($data)->firstWhere('feature', 'Calls Log');
        $this->assertEquals(1, $callsFeature['adopted']);
    }

    public function test_non_super_admin_cannot_get_feature_adoption(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/usage/feature-adoption');

        $response->assertStatus(403);
    }
}
