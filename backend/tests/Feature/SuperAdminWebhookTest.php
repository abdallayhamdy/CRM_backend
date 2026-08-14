<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Webhook;

class SuperAdminWebhookTest extends TestCase
{
    use TestHelpers;

    public function test_super_admin_can_list_webhooks(): void
    {
        $this->authenticateAsSuperAdmin();

        Webhook::create([
            'url' => 'https://hooks.zapier.com/hooks/catch/123456/abcdef',
            'secret' => str_repeat('a', 48),
            'events' => ['invoice.paid', 'ticket.created'],
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/super-admin/webhooks');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'url',
                    'events',
                    'status',
                    'last_triggered_at',
                ],
            ],
        ]);
        $response->assertJsonPath('data.0.url', 'https://hooks.zapier.com/hooks/catch/123456/abcdef');
        $response->assertJsonPath('data.0.status', 'Active');
        $response->assertJsonPath('data.0.events', ['invoice.paid', 'ticket.created']);
        $this->assertNull($response->json('data.0.last_triggered_at'));
    }

    public function test_webhook_list_never_exposes_secret(): void
    {
        $this->authenticateAsSuperAdmin();

        Webhook::create([
            'url' => 'https://example.com/webhook',
            'secret' => 'super-secret-signing-key',
            'events' => ['tenant.created'],
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/super-admin/webhooks');

        $response->assertStatus(200);
        $this->assertStringNotContainsString('super-secret-signing-key', $response->getContent());
    }

    public function test_super_admin_can_create_webhook(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->postJson('/api/super-admin/webhooks', [
            'url' => 'https://api.example.com/webhooks/tenant-events',
            'events' => ['tenant.created', 'user.deactivated'],
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.status', 'Active');
        $response->assertJsonPath('data.events', ['tenant.created', 'user.deactivated']);
        $this->assertNull($response->json('data.last_triggered_at'));
        $this->assertNull($response->json('data.secret'));

        $this->assertDatabaseHas('webhooks', [
            'url' => 'https://api.example.com/webhooks/tenant-events',
            'is_active' => true,
        ]);
        $this->assertDatabaseHas('platform_audit_logs', [
            'action' => 'webhook_created',
        ]);
    }

    public function test_create_webhook_requires_valid_url_and_events(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->postJson('/api/super-admin/webhooks', [
            'url' => 'not-a-url',
            'events' => [],
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['url', 'events']);

        $badEvent = $this->postJson('/api/super-admin/webhooks', [
            'url' => 'https://example.com/webhook',
            'events' => ['unknown.event'],
        ]);

        $badEvent->assertStatus(422);
        $badEvent->assertJsonValidationErrors(['events.0']);
    }

    public function test_super_admin_can_toggle_webhook_status(): void
    {
        $this->authenticateAsSuperAdmin();

        $webhook = Webhook::create([
            'url' => 'https://example.com/webhook',
            'secret' => str_repeat('b', 48),
            'events' => ['broadcast.sent'],
            'is_active' => true,
        ]);

        $response = $this->patchJson('/api/super-admin/webhooks/' . $webhook->id . '/toggle');

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'Disabled');
        $this->assertDatabaseHas('webhooks', [
            'id' => $webhook->id,
            'is_active' => false,
        ]);
        $this->assertDatabaseHas('platform_audit_logs', [
            'action' => 'webhook_status_changed',
        ]);

        $reEnable = $this->patchJson('/api/super-admin/webhooks/' . $webhook->id . '/toggle');
        $reEnable->assertStatus(200);
        $reEnable->assertJsonPath('data.status', 'Active');
    }

    public function test_super_admin_can_delete_webhook(): void
    {
        $this->authenticateAsSuperAdmin();

        $webhook = Webhook::create([
            'url' => 'https://example.com/webhook',
            'secret' => str_repeat('c', 48),
            'events' => ['invoice.paid'],
            'is_active' => true,
        ]);

        $response = $this->deleteJson('/api/super-admin/webhooks/' . $webhook->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('webhooks', ['id' => $webhook->id]);
        $this->assertDatabaseHas('platform_audit_logs', [
            'action' => 'webhook_deleted',
        ]);
    }

    public function test_non_super_admin_cannot_access_webhooks(): void
    {
        $this->authenticateAsAdmin();

        $webhook = Webhook::create([
            'url' => 'https://example.com/webhook',
            'secret' => str_repeat('d', 48),
            'events' => ['tenant.created'],
            'is_active' => true,
        ]);

        $this->getJson('/api/super-admin/webhooks')->assertStatus(403);
        $this->postJson('/api/super-admin/webhooks', ['url' => 'https://example.com/x', 'events' => ['tenant.created']])->assertStatus(403);
        $this->patchJson('/api/super-admin/webhooks/' . $webhook->id . '/toggle')->assertStatus(403);
        $this->deleteJson('/api/super-admin/webhooks/' . $webhook->id)->assertStatus(403);
    }

    public function test_deleting_nonexistent_webhook_returns_404(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->deleteJson('/api/super-admin/webhooks/00000000-0000-0000-0000-000000000000')->assertStatus(404);
    }
}
