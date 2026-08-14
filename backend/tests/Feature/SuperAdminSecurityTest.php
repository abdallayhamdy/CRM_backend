<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\AuditLog;
use App\Models\PlatformSettings;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

class SuperAdminSecurityTest extends TestCase
{
    use TestHelpers;

    private function createAuditEntry(
        ?string $action = null,
        ?string $auditableType = null,
        ?string $auditableId = null,
        ?array $changes = null,
        ?string $ipAddress = null,
        ?string $createdAt = null
    ): AuditLog {
        $workspace = Workspace::factory()->create();
        $user = User::factory()->create(['workspace_id' => $workspace->id]);

        return AuditLog::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'action' => $action ?? 'created',
            'category' => 'super_admin',
            'auditable_type' => $auditableType,
            'auditable_id' => $auditableId,
            'changes' => $changes,
            'ip_address' => $ipAddress,
            'created_at' => $createdAt ?? now(),
        ]);
    }

    private function createTokenForUser(
        User $user,
        ?string $name = 'auth_token',
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?string $lastUsedAt = null
    ): array {
        $newToken = $user->createToken($name);
        $accessToken = $newToken->accessToken;
        $plainTextToken = $newToken->plainTextToken;
        $updateData = [
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
        ];
        if ($lastUsedAt !== null) {
            $updateData['last_used_at'] = $lastUsedAt instanceof \Illuminate\Support\Carbon
                ? $lastUsedAt->toDateTimeString()
                : $lastUsedAt;
        }
        DB::table('personal_access_tokens')
            ->where('id', $accessToken->id)
            ->update($updateData);
        return [
            'token' => PersonalAccessToken::find($accessToken->id),
            'plainTextToken' => $plainTextToken,
        ];
    }

    // ── GET /security/settings ──────────────────────────────────

    public function test_super_admin_can_get_security_settings(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/security/settings');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'two_factor_required',
                'ip_whitelist_enabled',
                'whitelisted_ips',
                'session_timeout_minutes',
            ],
        ]);
    }

    public function test_security_settings_returns_defaults_when_not_configured(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/security/settings');

        $response->assertStatus(200);
        $response->assertJsonPath('data.two_factor_required', false);
        $response->assertJsonPath('data.ip_whitelist_enabled', false);
        $response->assertJsonPath('data.session_timeout_minutes', 30);
        $response->assertJsonPath('data.whitelisted_ips', []);
    }

    public function test_security_settings_reflects_stored_values(): void
    {
        $this->authenticateAsSuperAdmin();

        $settings = PlatformSettings::instance();
        $settings->update([
            'two_factor_required' => true,
            'ip_whitelist_enabled' => true,
            'whitelisted_ips' => ['192.168.1.0/24', '10.0.0.0/8'],
            'session_timeout_minutes' => 120,
        ]);

        $response = $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
            ->getJson('/api/super-admin/security/settings');

        $response->assertStatus(200);
        $response->assertJsonPath('data.two_factor_required', true);
        $response->assertJsonPath('data.ip_whitelist_enabled', true);
        $response->assertJsonPath('data.session_timeout_minutes', 120);
        $response->assertJsonPath('data.whitelisted_ips', ['192.168.1.0/24', '10.0.0.0/8']);
    }

    public function test_non_super_admin_cannot_get_security_settings(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/security/settings');

        $response->assertStatus(403);
    }

    // ── PATCH /security/settings ─────────────────────────────────

    public function test_super_admin_can_update_security_settings(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->patchJson('/api/super-admin/security/settings', [
            'two_factor_required' => true,
            'ip_whitelist_enabled' => true,
            'whitelisted_ips' => ['192.168.1.0/24'],
            'session_timeout_minutes' => 60,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.two_factor_required', true);
        $response->assertJsonPath('data.ip_whitelist_enabled', true);
        $response->assertJsonPath('data.session_timeout_minutes', 60);
        $response->assertJsonPath('data.whitelisted_ips', ['192.168.1.0/24']);

        $settings = PlatformSettings::instance();
        $this->assertTrue($settings->two_factor_required);
        $this->assertTrue($settings->ip_whitelist_enabled);
        $this->assertEquals(60, $settings->session_timeout_minutes);
        $this->assertEquals(['192.168.1.0/24'], $settings->whitelisted_ips);
    }

    public function test_update_security_settings_validates_timeout_range(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->patchJson('/api/super-admin/security/settings', [
            'session_timeout_minutes' => 2,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['session_timeout_minutes']);
    }

    public function test_update_security_settings_validates_max_timeout(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->patchJson('/api/super-admin/security/settings', [
            'session_timeout_minutes' => 500,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['session_timeout_minutes']);
    }

    public function test_update_security_settings_validates_ip_array(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->patchJson('/api/super-admin/security/settings', [
            'whitelisted_ips' => 'not-an-array',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['whitelisted_ips']);
    }

    public function test_non_super_admin_cannot_update_security_settings(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->patchJson('/api/super-admin/security/settings', [
            'two_factor_required' => true,
        ]);

        $response->assertStatus(403);
    }

    // ── GET /security/audit-log ──────────────────────────────────

    public function test_super_admin_can_get_audit_log(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->createAuditEntry('user_deactivated');

        $response = $this->getJson('/api/super-admin/security/audit-log');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'timestamp',
                    'actor_name',
                    'actor_email',
                    'action',
                    'target_type',
                    'target_id',
                    'target_label',
                    'ip_address',
                ],
            ],
            'meta' => ['page', 'limit', 'total'],
        ]);
    }

    public function test_audit_log_returns_empty_when_no_entries(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/security/audit-log');

        $response->assertStatus(200);
        $response->assertJsonPath('data', []);
        $response->assertJsonPath('meta.total', 0);
    }

    public function test_audit_log_entries_are_ordered_by_most_recent(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->createAuditEntry('created', null, null, null, null, now()->subHours(5));
        $this->createAuditEntry('updated', null, null, null, null, now()->subHours(1));

        $response = $this->getJson('/api/super-admin/security/audit-log');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(2, $data);
    }

    public function test_audit_log_includes_user_info(): void
    {
        $this->authenticateAsSuperAdmin();

        $workspace = Workspace::factory()->create();
        $user = User::factory()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Test Admin',
            'email' => 'test@admin.com',
        ]);

        AuditLog::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'action' => 'created',
            'category' => 'super_admin',
            'ip_address' => '192.168.1.1',
        ]);

        $response = $this->getJson('/api/super-admin/security/audit-log');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Test Admin', $data[0]['actor_name']);
        $this->assertEquals('test@admin.com', $data[0]['actor_email']);
        $this->assertEquals('192.168.1.1', $data[0]['ip_address']);
    }

    public function test_audit_log_resolves_workspace_target_label(): void
    {
        $this->authenticateAsSuperAdmin();

        $workspace = Workspace::factory()->create(['company_name' => 'Acme Corp']);
        $user = User::factory()->create(['workspace_id' => $workspace->id]);

        AuditLog::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'action' => 'created',
            'category' => 'super_admin',
            'auditable_type' => Workspace::class,
            'auditable_id' => $workspace->id,
        ]);

        $response = $this->getJson('/api/super-admin/security/audit-log');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Tenant', $data[0]['target_type']);
        $this->assertEquals('Acme Corp', $data[0]['target_label']);
    }

    public function test_audit_log_resolves_user_target_label(): void
    {
        $this->authenticateAsSuperAdmin();

        $workspace = Workspace::factory()->create();
        $targetUser = User::factory()->create([
            'workspace_id' => $workspace->id,
            'name' => 'Jane Smith',
        ]);
        $actor = User::factory()->create(['workspace_id' => $workspace->id]);

        AuditLog::create([
            'workspace_id' => $workspace->id,
            'user_id' => $actor->id,
            'action' => 'user_deactivated',
            'category' => 'super_admin',
            'auditable_type' => User::class,
            'auditable_id' => $targetUser->id,
        ]);

        $response = $this->getJson('/api/super-admin/security/audit-log');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('User', $data[0]['target_type']);
        $this->assertEquals('Jane Smith', $data[0]['target_label']);
    }

    public function test_audit_log_shows_na_for_missing_ip(): void
    {
        $this->authenticateAsSuperAdmin();

        $workspace = Workspace::factory()->create();
        $user = User::factory()->create(['workspace_id' => $workspace->id]);

        AuditLog::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'action' => 'created',
            'category' => 'super_admin',
            'ip_address' => null,
        ]);

        $response = $this->getJson('/api/super-admin/security/audit-log');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('N/A', $data[0]['ip_address']);
    }

    public function test_audit_log_shows_system_when_no_actor(): void
    {
        $this->authenticateAsSuperAdmin();

        $workspace = Workspace::factory()->create();
        AuditLog::create([
            'workspace_id' => $workspace->id,
            'user_id' => null,
            'action' => 'platform_setting_updated',
            'category' => 'super_admin',
        ]);

        $response = $this->getJson('/api/super-admin/security/audit-log');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('System', $data[0]['actor_name']);
    }

    public function test_audit_log_humanizes_deactivation_action(): void
    {
        $this->authenticateAsSuperAdmin();

        $workspace = Workspace::factory()->create();
        $user = User::factory()->create(['workspace_id' => $workspace->id]);

        AuditLog::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'action' => 'user_deactivated',
            'category' => 'super_admin',
        ]);

        $response = $this->getJson('/api/super-admin/security/audit-log');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('Deactivated user', $data[0]['action']);
    }

    public function test_audit_log_humanizes_activation_action(): void
    {
        $this->authenticateAsSuperAdmin();

        $workspace = Workspace::factory()->create();
        $user = User::factory()->create(['workspace_id' => $workspace->id]);

        AuditLog::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'action' => 'user_activated',
            'category' => 'super_admin',
        ]);

        $response = $this->getJson('/api/super-admin/security/audit-log');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('Reactivated user', $data[0]['action']);
    }

    public function test_audit_log_plan_change_label(): void
    {
        $this->authenticateAsSuperAdmin();

        $workspace = Workspace::factory()->create();
        $user = User::factory()->create(['workspace_id' => $workspace->id]);

        AuditLog::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'action' => 'plan_updated',
            'category' => 'super_admin',
            'changes' => ['plan' => 'enterprise'],
        ]);

        $response = $this->getJson('/api/super-admin/security/audit-log');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('Updated tenant plan', $data[0]['action']);
    }

    public function test_audit_log_status_change_label(): void
    {
        $this->authenticateAsSuperAdmin();

        $workspace = Workspace::factory()->create();
        $user = User::factory()->create(['workspace_id' => $workspace->id]);

        AuditLog::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'action' => 'status_changed',
            'category' => 'super_admin',
            'changes' => ['previous_status' => 'active', 'status' => 'suspended'],
        ]);

        $response = $this->getJson('/api/super-admin/security/audit-log');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('Changed tenant status', $data[0]['action']);
    }

    public function test_audit_log_meta_includes_total(): void
    {
        $this->authenticateAsSuperAdmin();
        $this->createAuditEntry();
        $this->createAuditEntry();

        $response = $this->getJson('/api/super-admin/security/audit-log');

        $response->assertStatus(200);
        $response->assertJsonPath('meta.total', 2);
        $response->assertJsonPath('meta.page', 1);
    }

    public function test_non_super_admin_cannot_get_audit_log(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/security/audit-log');

        $response->assertStatus(403);
    }

    // ── GET /security/sessions ───────────────────────────────────

    public function test_super_admin_can_get_sessions(): void
    {
        $this->authenticateAsSuperAdmin();

        $user = User::factory()->create();
        $this->createTokenForUser(
            $user,
            'auth_token',
            '192.168.1.1',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0',
            now()->subMinutes(5)
        );

        $response = $this->getJson('/api/super-admin/security/sessions');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'user_name',
                    'user_id',
                    'device',
                    'ip_address',
                    'location',
                    'last_active',
                    'is_current_session',
                ],
            ],
        ]);
    }

    public function test_sessions_returns_empty_when_no_tokens(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/security/sessions');

        $response->assertStatus(200);
        $response->assertJsonPath('data', []);
    }

    public function test_sessions_include_user_info(): void
    {
        $this->authenticateAsSuperAdmin();

        $user = User::factory()->create(['name' => 'John Doe']);
        $this->createTokenForUser($user, 'auth_token', '10.0.0.1');

        $response = $this->getJson('/api/super-admin/security/sessions');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('John Doe', $data[0]['user_name']);
        $this->assertEquals('10.0.0.1', $data[0]['ip_address']);
    }

    public function test_sessions_parse_device_from_user_agent_chrome_mac(): void
    {
        $this->authenticateAsSuperAdmin();

        $user = User::factory()->create();
        $this->createTokenForUser(
            $user,
            'auth_token',
            null,
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        $response = $this->getJson('/api/super-admin/security/sessions');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('Chrome on macOS', $data[0]['device']);
    }

    public function test_sessions_parse_device_firefox_windows(): void
    {
        $this->authenticateAsSuperAdmin();

        $user = User::factory()->create();
        $this->createTokenForUser(
            $user,
            'auth_token',
            null,
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
        );

        $response = $this->getJson('/api/super-admin/security/sessions');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('Firefox on Windows', $data[0]['device']);
    }

    public function test_sessions_parse_device_safari_iphone(): void
    {
        $this->authenticateAsSuperAdmin();

        $user = User::factory()->create();
        $this->createTokenForUser(
            $user,
            'auth_token',
            null,
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        );

        $response = $this->getJson('/api/super-admin/security/sessions');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('Safari on iPhone', $data[0]['device']);
    }

    public function test_sessions_parse_device_edge_windows(): void
    {
        $this->authenticateAsSuperAdmin();

        $user = User::factory()->create();
        $this->createTokenForUser(
            $user,
            'auth_token',
            null,
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
        );

        $response = $this->getJson('/api/super-admin/security/sessions');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('Edge on Windows', $data[0]['device']);
    }

    public function test_sessions_parse_device_android(): void
    {
        $this->authenticateAsSuperAdmin();

        $user = User::factory()->create();
        $this->createTokenForUser(
            $user,
            'auth_token',
            null,
            'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
        );

        $response = $this->getJson('/api/super-admin/security/sessions');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('Chrome on Android', $data[0]['device']);
    }

    public function test_sessions_identifies_current_session(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $result = $this->createTokenForUser($superAdmin, 'auth_token', '10.0.0.1');
        $token = $result['token'];

        $response = $this->withHeader('Authorization', 'Bearer ' . $result['plainTextToken'])
            ->getJson('/api/super-admin/security/sessions');

        $response->assertStatus(200);
        $data = $response->json('data');

        $currentSession = collect($data)->firstWhere('is_current_session', true);
        $this->assertNotNull($currentSession);
        $this->assertEquals((string) $token->id, $currentSession['id']);
    }

    public function test_sessions_last_active_shows_human_readable(): void
    {
        $this->authenticateAsSuperAdmin();

        $user = User::factory()->create();
        $this->createTokenForUser(
            $user,
            'auth_token',
            null,
            null,
            now()->subMinutes(30)
        );

        $response = $this->getJson('/api/super-admin/security/sessions');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertNotEmpty($data[0]['last_active']);
        $this->assertStringContainsString('ago', $data[0]['last_active']);
    }

    public function test_non_super_admin_cannot_get_sessions(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/security/sessions');

        $response->assertStatus(403);
    }

    // ── DELETE /security/sessions/{id} ──────────────────────────

    public function test_super_admin_can_revoke_session(): void
    {
        $this->authenticateAsSuperAdmin();

        $otherUser = User::factory()->create();
        $result = $this->createTokenForUser($otherUser, 'auth_token', '10.0.0.1');
        $token = $result['token'];

        $response = $this->deleteJson('/api/super-admin/security/sessions/' . $token->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $token->id]);
    }

    public function test_revoke_session_returns_404_for_nonexistent(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->deleteJson('/api/super-admin/security/sessions/00000000-0000-0000-0000-000000000000');

        $response->assertStatus(404);
    }

    public function test_non_super_admin_cannot_revoke_session(): void
    {
        $this->authenticateAsAdmin();

        $otherUser = User::factory()->create();
        $result = $this->createTokenForUser($otherUser, 'auth_token');
        $token = $result['token'];

        $response = $this->deleteJson('/api/super-admin/security/sessions/' . $token->id);

        $response->assertStatus(403);
    }
}
