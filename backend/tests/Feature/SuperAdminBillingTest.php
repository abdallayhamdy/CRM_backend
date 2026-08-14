<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Workspace;
use App\Models\Invoice;

class SuperAdminBillingTest extends TestCase
{
    use TestHelpers;

    private function createWorkspaceWithPlan(string $plan = 'starter', string $status = 'active'): Workspace
    {
        return Workspace::factory()->create([
            'plan' => $plan,
            'status' => $status,
        ]);
    }

    // ── GET /billing/summary ─────────────────────────────────────

    public function test_super_admin_can_get_billing_summary(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/billing/summary');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => ['mrr', 'arr', 'overdue_invoice_count', 'avg_revenue_per_tenant', 'active_tenant_count'],
        ]);
    }

    public function test_summary_mrr_calculated_from_active_plans(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->createWorkspaceWithPlan('starter', 'active');
        $this->createWorkspaceWithPlan('pro', 'active');
        $this->createWorkspaceWithPlan('enterprise', 'active');

        $response = $this->getJson('/api/super-admin/billing/summary');

        $response->assertStatus(200);
        $response->assertJsonPath('data.mrr', 49 + 149 + 399);
    }

    public function test_summary_arr_is_mrr_times_12(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->createWorkspaceWithPlan('pro', 'active');

        $response = $this->getJson('/api/super-admin/billing/summary');

        $response->assertStatus(200);
        $response->assertJsonPath('data.mrr', 149);
        $response->assertJsonPath('data.arr', 149 * 12);
    }

    public function test_summary_only_counts_active_tenants_for_mrr(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->createWorkspaceWithPlan('pro', 'active');
        $this->createWorkspaceWithPlan('enterprise', 'trial');
        $this->createWorkspaceWithPlan('starter', 'suspended');
        $this->createWorkspaceWithPlan('enterprise', 'churned');

        $response = $this->getJson('/api/super-admin/billing/summary');

        $response->assertStatus(200);
        $response->assertJsonPath('data.mrr', 149);
    }

    public function test_summary_active_tenant_count_includes_trial_and_suspended(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->createWorkspaceWithPlan('starter', 'active');
        $this->createWorkspaceWithPlan('pro', 'trial');
        $this->createWorkspaceWithPlan('enterprise', 'suspended');
        $this->createWorkspaceWithPlan('starter', 'churned');

        $response = $this->getJson('/api/super-admin/billing/summary');

        $response->assertStatus(200);
        $response->assertJsonPath('data.active_tenant_count', 3);
    }

    public function test_summary_overdue_invoice_count(): void
    {
        $this->authenticateAsSuperAdmin();

        $ws = $this->createWorkspaceWithPlan();
        Invoice::factory()->overdue()->count(3)->create(['workspace_id' => $ws->id]);
        Invoice::factory()->paid()->count(2)->create(['workspace_id' => $ws->id]);
        Invoice::factory()->pending()->create(['workspace_id' => $ws->id]);

        $response = $this->getJson('/api/super-admin/billing/summary');

        $response->assertStatus(200);
        $response->assertJsonPath('data.overdue_invoice_count', 3);
    }

    public function test_summary_excludes_soft_deleted_workspaces(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->createWorkspaceWithPlan('pro', 'active');
        Workspace::factory()->create(['plan' => 'enterprise', 'status' => 'active', 'deleted_at' => now()]);

        $response = $this->getJson('/api/super-admin/billing/summary');

        $response->assertStatus(200);
        $response->assertJsonPath('data.mrr', 149);
        $response->assertJsonPath('data.active_tenant_count', 1);
    }

    public function test_summary_with_no_data(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/billing/summary');

        $response->assertStatus(200);
        $response->assertJsonPath('data.mrr', 0);
        $response->assertJsonPath('data.arr', 0);
        $response->assertJsonPath('data.active_tenant_count', 0);
        $response->assertJsonPath('data.avg_revenue_per_tenant', 0);
    }

    public function test_non_super_admin_cannot_get_billing_summary(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/billing/summary');

        $response->assertStatus(403);
    }

    // ── GET /billing/invoices ────────────────────────────────────

    public function test_super_admin_can_get_invoices(): void
    {
        $this->authenticateAsSuperAdmin();

        $ws = $this->createWorkspaceWithPlan();
        Invoice::factory()->count(3)->create(['workspace_id' => $ws->id]);

        $response = $this->getJson('/api/super-admin/billing/invoices');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'tenant_id', 'tenant_name', 'amount', 'status', 'issued_date', 'due_date'],
            ],
            'meta' => ['page', 'limit', 'total'],
        ]);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_invoices_includes_tenant_name(): void
    {
        $this->authenticateAsSuperAdmin();

        $ws = $this->createWorkspaceWithPlan();
        $ws->update(['company_name' => 'Acme Corp']);
        Invoice::factory()->create(['workspace_id' => $ws->id]);

        $response = $this->getJson('/api/super-admin/billing/invoices');

        $response->assertStatus(200);
        $response->assertJsonPath('data.0.tenant_name', 'Acme Corp');
        $response->assertJsonPath('data.0.tenant_id', $ws->id);
    }

    public function test_invoices_can_filter_by_status(): void
    {
        $this->authenticateAsSuperAdmin();

        $ws = $this->createWorkspaceWithPlan();
        Invoice::factory()->paid()->count(2)->create(['workspace_id' => $ws->id]);
        Invoice::factory()->pending()->count(3)->create(['workspace_id' => $ws->id]);

        $response = $this->getJson('/api/super-admin/billing/invoices?status=Pending');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }

    public function test_invoices_returns_empty_with_no_data(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/billing/invoices');

        $response->assertStatus(200);
        $response->assertJsonPath('data', []);
        $response->assertJsonPath('meta.total', 0);
    }

    public function test_non_super_admin_cannot_get_invoices(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/billing/invoices');

        $response->assertStatus(403);
    }

    // ── POST /billing/invoices ───────────────────────────────────

    public function test_super_admin_can_create_invoice(): void
    {
        $this->authenticateAsSuperAdmin();

        $ws = $this->createWorkspaceWithPlan();

        $response = $this->postJson('/api/super-admin/billing/invoices', [
            'tenant_id' => $ws->id,
            'amount' => 149,
            'issued_date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(14)->format('Y-m-d'),
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => ['id', 'tenant_id', 'tenant_name', 'amount', 'status', 'issued_date', 'due_date'],
        ]);
        $response->assertJsonPath('data.amount', 149);
        $response->assertJsonPath('data.status', 'Pending');
    }

    public function test_create_invoice_with_paid_date_marks_as_paid(): void
    {
        $this->authenticateAsSuperAdmin();

        $ws = $this->createWorkspaceWithPlan();

        $response = $this->postJson('/api/super-admin/billing/invoices', [
            'tenant_id' => $ws->id,
            'amount' => 49,
            'issued_date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(14)->format('Y-m-d'),
            'paid_date' => now()->format('Y-m-d'),
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.status', 'Paid');
        $response->assertJsonPath('data.paid_date', now()->format('Y-m-d'));
    }

    public function test_create_invoice_validates_required_fields(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->postJson('/api/super-admin/billing/invoices', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['tenant_id', 'amount', 'issued_date', 'due_date']);
    }

    public function test_create_invoice_validates_tenant_exists(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->postJson('/api/super-admin/billing/invoices', [
            'tenant_id' => 'non-existent-uuid',
            'amount' => 100,
            'issued_date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(14)->format('Y-m-d'),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['tenant_id']);
    }

    public function test_non_super_admin_cannot_create_invoice(): void
    {
        $this->authenticateAsAdmin();

        $ws = $this->createWorkspaceWithPlan();

        $response = $this->postJson('/api/super-admin/billing/invoices', [
            'tenant_id' => $ws->id,
            'amount' => 100,
            'issued_date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(14)->format('Y-m-d'),
        ]);

        $response->assertStatus(403);
    }

    // ── PATCH /billing/invoices/{id}/pay ─────────────────────────

    public function test_super_admin_can_mark_invoice_as_paid(): void
    {
        $this->authenticateAsSuperAdmin();

        $ws = $this->createWorkspaceWithPlan();
        $invoice = Invoice::factory()->pending()->create(['workspace_id' => $ws->id]);

        $response = $this->patchJson("/api/super-admin/billing/invoices/{$invoice->id}/pay");

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'Paid');
        $this->assertNotNull($response->json('data.paid_date'));
    }

    public function test_mark_as_paid_updates_database(): void
    {
        $this->authenticateAsSuperAdmin();

        $invoice = Invoice::factory()->pending()->create();

        $this->patchJson("/api/super-admin/billing/invoices/{$invoice->id}/pay");

        $invoice->refresh();
        $this->assertEquals('Paid', $invoice->status);
        $this->assertNotNull($invoice->paid_date);
    }

    public function test_mark_as_paid_returns_422_for_already_paid(): void
    {
        $this->authenticateAsSuperAdmin();

        $invoice = Invoice::factory()->paid()->create();

        $response = $this->patchJson("/api/super-admin/billing/invoices/{$invoice->id}/pay");

        $response->assertStatus(422);
    }

    public function test_non_super_admin_cannot_mark_invoice_as_paid(): void
    {
        $this->authenticateAsAdmin();

        $invoice = Invoice::factory()->pending()->create();

        $response = $this->patchJson("/api/super-admin/billing/invoices/{$invoice->id}/pay");

        $response->assertStatus(403);
    }

    // ── GET /billing/plan-distribution ───────────────────────────

    public function test_super_admin_can_get_plan_distribution(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->createWorkspaceWithPlan('starter');
        $this->createWorkspaceWithPlan('starter');
        $this->createWorkspaceWithPlan('pro');

        $response = $this->getJson('/api/super-admin/billing/plan-distribution');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['plan', 'count'],
            ],
        ]);
        $data = $response->json('data');
        $this->assertCount(3, $data);

        $starter = collect($data)->firstWhere('plan', 'Starter');
        $this->assertEquals(2, $starter['count']);

        $pro = collect($data)->firstWhere('plan', 'Pro');
        $this->assertEquals(1, $pro['count']);
    }

    public function test_plan_distribution_returns_all_plans(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/billing/plan-distribution');

        $response->assertStatus(200);
        $data = collect($response->json('data'));
        $this->assertEquals(['Starter', 'Pro', 'Enterprise'], $data->pluck('plan')->values()->all());
    }

    public function test_plan_distribution_excludes_churned(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->createWorkspaceWithPlan('starter');
        $this->createWorkspaceWithPlan('pro', 'churned');

        $response = $this->getJson('/api/super-admin/billing/plan-distribution');

        $response->assertStatus(200);
        $data = collect($response->json('data'));
        $starter = $data->firstWhere('plan', 'Starter');
        $pro = $data->firstWhere('plan', 'Pro');
        $this->assertEquals(1, $starter['count']);
        $this->assertEquals(0, $pro['count']);
    }

    public function test_non_super_admin_cannot_get_plan_distribution(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/billing/plan-distribution');

        $response->assertStatus(403);
    }

    // ── GET /billing/revenue-trend ───────────────────────────────

    public function test_super_admin_can_get_revenue_trend(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->createWorkspaceWithPlan('pro', 'active');

        $response = $this->getJson('/api/super-admin/billing/revenue-trend');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['month', 'mrr'],
            ],
        ]);
        $this->assertGreaterThan(0, count($response->json('data')));
    }

    public function test_revenue_trend_shows_mrr_per_month(): void
    {
        $this->authenticateAsSuperAdmin();

        $ws = Workspace::factory()->create([
            'plan' => 'enterprise',
            'status' => 'active',
            'created_at' => now()->subMonths(3)->startOfMonth(),
        ]);

        $response = $this->getJson('/api/super-admin/billing/revenue-trend');

        $response->assertStatus(200);
        $data = $response->json('data');

        $currentMonth = collect($data)->firstWhere('month', now()->format('M Y'));
        $this->assertNotNull($currentMonth);
        $this->assertEquals(399, $currentMonth['mrr']);
    }

    public function test_revenue_trend_excludes_churned_workspaces(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->createWorkspaceWithPlan('enterprise', 'active');
        $this->createWorkspaceWithPlan('pro', 'churned');

        $response = $this->getJson('/api/super-admin/billing/revenue-trend');

        $response->assertStatus(200);
        $data = $response->json('data');

        $currentMonth = collect($data)->firstWhere('month', now()->format('M Y'));
        $this->assertEquals(399, $currentMonth['mrr']);
    }

    public function test_revenue_trend_returns_empty_with_no_workspaces(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/billing/revenue-trend');

        $response->assertStatus(200);
        $response->assertJsonPath('data', []);
    }

    public function test_non_super_admin_cannot_get_revenue_trend(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/billing/revenue-trend');

        $response->assertStatus(403);
    }
}
