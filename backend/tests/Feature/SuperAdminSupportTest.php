<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\BroadcastMessage;
use App\Models\SupportTicket;
use App\Models\Workspace;

class SuperAdminSupportTest extends TestCase
{
    use TestHelpers;

    private function createTenant(string $status = 'active'): Workspace
    {
        return Workspace::create([
            'name' => fake()->company(),
            'company_name' => fake()->company(),
            'status' => $status,
            'max_users' => 10,
        ]);
    }

    // ── Support Tickets ──────────────────────────────────────────────

    public function test_super_admin_can_list_support_tickets_with_tenant_name(): void
    {
        $this->authenticateAsSuperAdmin();

        $tenant = $this->createTenant();

        SupportTicket::create([
            'tenant_id' => $tenant->id,
            'subject' => 'Unable to import contacts',
            'description' => 'CSV import times out.',
            'status' => 'Open',
            'priority' => 'High',
            'assigned_to' => 'Ahmad El-Sayed',
        ]);

        $response = $this->getJson('/api/super-admin/support-tickets');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'tenant_id',
                    'tenant_name',
                    'subject',
                    'description',
                    'status',
                    'priority',
                    'assigned_to',
                    'created_at',
                    'updated_at',
                ],
            ],
        ]);
        $response->assertJsonPath('data.0.tenant_id', $tenant->id);
        $response->assertJsonPath('data.0.tenant_name', $tenant->company_name);
        $response->assertJsonPath('data.0.subject', 'Unable to import contacts');
        $response->assertJsonPath('data.0.status', 'Open');
    }

    public function test_ticket_without_tenant_returns_null_tenant_fields(): void
    {
        $this->authenticateAsSuperAdmin();

        SupportTicket::create([
            'tenant_id' => null,
            'subject' => 'Orphan ticket',
            'description' => 'No tenant attached.',
            'status' => 'Open',
            'priority' => 'Low',
        ]);

        $response = $this->getJson('/api/super-admin/support-tickets');

        $response->assertStatus(200);
        $this->assertNull($response->json('data.0.tenant_id'));
        $this->assertNull($response->json('data.0.tenant_name'));
    }

    public function test_super_admin_can_update_ticket_status(): void
    {
        $this->authenticateAsSuperAdmin();

        $ticket = SupportTicket::create([
            'tenant_id' => null,
            'subject' => 'Status test',
            'description' => 'Testing status change.',
            'status' => 'Open',
            'priority' => 'Medium',
        ]);

        $response = $this->patchJson('/api/super-admin/support-tickets/' . $ticket->id . '/status', [
            'status' => 'In Progress',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'In Progress');
        $this->assertDatabaseHas('support_tickets', [
            'id' => $ticket->id,
            'status' => 'In Progress',
        ]);
        $this->assertDatabaseHas('platform_audit_logs', [
            'action' => 'support_ticket_status_changed',
        ]);
    }

    public function test_update_ticket_status_rejects_invalid_status(): void
    {
        $this->authenticateAsSuperAdmin();

        $ticket = SupportTicket::create([
            'tenant_id' => null,
            'subject' => 'Invalid status',
            'description' => 'Rejects bad status.',
            'status' => 'Open',
            'priority' => 'Low',
        ]);

        $response = $this->patchJson('/api/super-admin/support-tickets/' . $ticket->id . '/status', [
            'status' => 'Banana',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['status']);
    }

    // ── Broadcasts ───────────────────────────────────────────────────

    public function test_super_admin_can_list_broadcasts(): void
    {
        $this->authenticateAsSuperAdmin();

        BroadcastMessage::create([
            'title' => 'Scheduled maintenance',
            'message' => 'Platform may be briefly unavailable.',
            'audience' => 'All Tenants',
            'sent_by' => 'Ahmad El-Sayed',
            'recipient_count' => 18,
            'sent_at' => now(),
        ]);

        $response = $this->getJson('/api/super-admin/broadcasts');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'title',
                    'message',
                    'audience',
                    'sent_by',
                    'recipient_count',
                    'sent_at',
                ],
            ],
        ]);
        $response->assertJsonPath('data.0.title', 'Scheduled maintenance');
        $response->assertJsonPath('data.0.audience', 'All Tenants');
        $response->assertJsonPath('data.0.recipient_count', 18);
    }

    public function test_broadcast_to_all_tenants_counts_all_workspaces(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->createTenant('active');
        $this->createTenant('trial');
        $this->createTenant('suspended');

        $response = $this->postJson('/api/super-admin/broadcasts', [
            'title' => 'All tenants notice',
            'message' => 'Hello everyone.',
            'audience' => 'All Tenants',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.audience', 'All Tenants');
        $response->assertJsonPath('data.recipient_count', 3);
        $this->assertNotNull($response->json('data.sent_at'));
        $this->assertDatabaseHas('broadcast_messages', [
            'title' => 'All tenants notice',
            'recipient_count' => 3,
        ]);
        $this->assertDatabaseHas('platform_audit_logs', [
            'action' => 'broadcast_sent',
        ]);
    }

    public function test_broadcast_to_active_only_counts_active_workspaces(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->createTenant('active');
        $this->createTenant('active');
        $this->createTenant('trial');
        $this->createTenant('churned');

        $response = $this->postJson('/api/super-admin/broadcasts', [
            'title' => 'Active only notice',
            'message' => 'Hello active tenants.',
            'audience' => 'Active Only',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.recipient_count', 2);
    }

    public function test_broadcast_to_trial_only_counts_trial_workspaces(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->createTenant('active');
        $this->createTenant('trial');
        $this->createTenant('trial');

        $response = $this->postJson('/api/super-admin/broadcasts', [
            'title' => 'Trial notice',
            'message' => 'Your trial is ending.',
            'audience' => 'Trial Only',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.recipient_count', 2);
    }

    public function test_broadcast_records_sent_by_admin_name(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->postJson('/api/super-admin/broadcasts', [
            'title' => 'Sent by test',
            'message' => 'Who sent this?',
            'audience' => 'All Tenants',
        ]);

        $response->assertStatus(201);
        $this->assertNotNull($response->json('data.sent_by'));
    }

    public function test_create_broadcast_validates_input(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->postJson('/api/super-admin/broadcasts', [
            'title' => '',
            'message' => '',
            'audience' => 'Everyone',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['title', 'message', 'audience']);
    }

    public function test_non_super_admin_cannot_access_support_and_broadcasts(): void
    {
        $this->authenticateAsAdmin();

        $this->getJson('/api/super-admin/support-tickets')->assertStatus(403);
        $this->getJson('/api/super-admin/broadcasts')->assertStatus(403);
        $this->postJson('/api/super-admin/broadcasts', ['title' => 'x', 'message' => 'y', 'audience' => 'All Tenants'])->assertStatus(403);
    }
}
