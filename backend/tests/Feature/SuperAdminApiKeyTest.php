<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\ApiKey;
use App\Models\PlatformAuditLog;

class SuperAdminApiKeyTest extends TestCase
{
    use TestHelpers;

    public function test_super_admin_can_list_api_keys(): void
    {
        $this->authenticateAsSuperAdmin();

        ApiKey::create([
            'name' => 'Production Key',
            'key_hash' => hash('sha256', 'sk_production_secret'),
            'key_prefix' => 'sk_',
            'key_tail' => 'a1b2',
        ]);

        $response = $this->getJson('/api/super-admin/api-keys');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'key_preview',
                    'created_at',
                    'last_used_at',
                    'status',
                ],
            ],
        ]);
        $response->assertJsonPath('data.0.name', 'Production Key');
        $response->assertJsonPath('data.0.status', 'Active');
    }

    public function test_api_key_preview_never_exposes_the_full_key(): void
    {
        $this->authenticateAsSuperAdmin();

        ApiKey::create([
            'name' => 'Secret Key',
            'key_hash' => hash('sha256', 'sk_this_is_a_secret_key_1234567890'),
            'key_prefix' => 'sk_',
            'key_tail' => '7890',
        ]);

        $response = $this->getJson('/api/super-admin/api-keys');

        $response->assertStatus(200);
        $response->assertJsonPath('data.0.key_preview', 'sk_••••••7890');
        $this->assertStringNotContainsString('this_is_a_secret_key', $response->getContent());
    }

    public function test_super_admin_can_create_api_key_and_receives_full_key_once(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->postJson('/api/super-admin/api-keys', [
            'name' => 'Zapier Integration',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'key_preview',
                'created_at',
                'last_used_at',
                'status',
                'full_key',
            ],
        ]);
        $response->assertJsonPath('data.name', 'Zapier Integration');
        $response->assertJsonPath('data.status', 'Active');
        $this->assertNull($response->json('data.last_used_at'));

        $fullKey = $response->json('data.full_key');
        $this->assertStringStartsWith('sk_', $fullKey);
        $this->assertTrue(strlen($fullKey) > 10);

        $this->assertDatabaseHas('api_keys', [
            'key_hash' => hash('sha256', $fullKey),
        ]);
        $this->assertDatabaseMissing('api_keys', ['key_hash' => $fullKey]);
    }

    public function test_create_api_key_requires_name(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->postJson('/api/super-admin/api-keys', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_create_api_key_writes_audit_log(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->postJson('/api/super-admin/api-keys', [
            'name' => 'Audited Key',
        ]);

        $this->assertDatabaseHas('platform_audit_logs', [
            'action' => 'api_key_created',
        ]);
    }

    public function test_super_admin_can_revoke_api_key(): void
    {
        $this->authenticateAsSuperAdmin();

        $apiKey = ApiKey::create([
            'name' => 'Legacy Key',
            'key_hash' => hash('sha256', 'sk_legacy_secret'),
            'key_prefix' => 'sk_',
            'key_tail' => 'c3d4',
        ]);

        $response = $this->postJson('/api/super-admin/api-keys/' . $apiKey->id . '/revoke');

        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'Revoked');
        $this->assertDatabaseHas('api_keys', [
            'id' => $apiKey->id,
            'revoked_at' => now()->toDateTimeString(),
        ]);
        $this->assertDatabaseHas('platform_audit_logs', [
            'action' => 'api_key_revoked',
        ]);
    }

    public function test_revoking_already_revoked_key_returns_422(): void
    {
        $this->authenticateAsSuperAdmin();

        $apiKey = ApiKey::create([
            'name' => 'Already Revoked',
            'key_hash' => hash('sha256', 'sk_already_revoked'),
            'key_prefix' => 'sk_',
            'key_tail' => 'e5f6',
            'revoked_at' => now(),
        ]);

        $response = $this->postJson('/api/super-admin/api-keys/' . $apiKey->id . '/revoke');

        $response->assertStatus(422);
    }

    public function test_revoking_nonexistent_key_returns_404(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->postJson('/api/super-admin/api-keys/00000000-0000-0000-0000-000000000000/revoke');

        $response->assertStatus(404);
    }

    public function test_non_super_admin_cannot_access_api_keys(): void
    {
        $this->authenticateAsAdmin();

        $this->getJson('/api/super-admin/api-keys')->assertStatus(403);
        $this->postJson('/api/super-admin/api-keys', ['name' => 'Nope'])->assertStatus(403);
        $this->postJson('/api/super-admin/api-keys/00000000-0000-0000-0000-000000000000/revoke')->assertStatus(403);
    }

    public function test_index_includes_revoked_keys_with_status(): void
    {
        $this->authenticateAsSuperAdmin();

        ApiKey::create([
            'name' => 'Revoked Key',
            'key_hash' => hash('sha256', 'sk_revoked_one'),
            'key_prefix' => 'sk_',
            'key_tail' => '9999',
            'revoked_at' => now(),
        ]);

        $response = $this->getJson('/api/super-admin/api-keys');

        $response->assertStatus(200);
        $response->assertJsonPath('data.0.status', 'Revoked');
    }
}
