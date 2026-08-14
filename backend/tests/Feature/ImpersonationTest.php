<?php

namespace Tests\Feature;

use App\Models\ImpersonationSession;
use App\Models\PlatformAuditLog;
use App\Models\User;
use App\Models\Workspace;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;
use Tests\Traits\TestHelpers;

class ImpersonationTest extends TestCase
{
    use TestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
    }

    private function createWorkspaceWithUser(): array
    {
        $workspace = Workspace::factory()->create();
        $user = User::factory()->create([
            'workspace_id' => $workspace->id,
        ]);
        $user->workspaces()->attach($workspace->id, [
            'role_name' => 'Workspace Member',
            'is_active' => true,
        ]);

        return ['workspace' => $workspace, 'user' => $user];
    }

    private function createSuperAdminToken(): array
    {
        $admin = User::factory()->superAdmin()->create();
        $token = $admin->createToken('admin-token')->plainTextToken;
        return ['admin' => $admin, 'token' => $token];
    }

    private function postAsToken(string $token, string $uri, array $data = []): \Illuminate\Testing\TestResponse
    {
        return $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])->postJson($uri, $data);
    }

    private function getAsToken(string $token, string $uri): \Illuminate\Testing\TestResponse
    {
        return $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ])->getJson($uri);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Starting Impersonation
    // ═══════════════════════════════════════════════════════════════════

    public function test_super_admin_can_start_impersonation(): void
    {
        ['token' => $adminToken, 'admin' => $admin] = $this->createSuperAdminToken();
        ['workspace' => $workspace, 'user' => $user] = $this->createWorkspaceWithUser();

        $response = $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'token',
                'expires_at',
                'session_id',
                'target_user' => ['id', 'name', 'email'],
                'workspace' => ['id', 'name'],
            ],
        ]);

        $this->assertDatabaseHas('impersonation_sessions', [
            'admin_id' => $admin->id,
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ]);

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'is_impersonation' => 1,
        ]);

        $this->assertDatabaseHas('platform_audit_logs', [
            'admin_id' => $admin->id,
            'target_user_id' => $user->id,
            'workspace_id' => $workspace->id,
            'action' => 'impersonation_started',
        ]);
    }

    public function test_non_super_admin_cannot_start_impersonation(): void
    {
        $this->authenticateAsAdmin();
        ['workspace' => $workspace, 'user' => $user] = $this->createWorkspaceWithUser();

        $response = $this->postJson('/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ]);

        $response->assertStatus(403);
    }

    public function test_cannot_impersonate_another_platform_owner(): void
    {
        ['token' => $adminToken] = $this->createSuperAdminToken();
        $workspace = Workspace::factory()->create();
        $target = User::factory()->superAdmin()->create(['workspace_id' => $workspace->id]);

        $response = $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $target->id,
            'target_workspace_id' => $workspace->id,
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'Cannot impersonate another Platform Owner.');
    }

    public function test_cannot_impersonate_user_not_in_workspace(): void
    {
        ['token' => $adminToken] = $this->createSuperAdminToken();
        $workspace = Workspace::factory()->create();
        $user = User::factory()->create();

        $response = $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'User is not a member of this workspace.');
    }

    // ═══════════════════════════════════════════════════════════════════
    // No Nested Impersonation (409 Conflict)
    // ═══════════════════════════════════════════════════════════════════

    public function test_cannot_start_second_impersonation_while_one_is_active(): void
    {
        ['token' => $adminToken] = $this->createSuperAdminToken();
        ['workspace' => $workspace1, 'user' => $user1] = $this->createWorkspaceWithUser();
        ['workspace' => $workspace2, 'user' => $user2] = $this->createWorkspaceWithUser();

        $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user1->id,
            'target_workspace_id' => $workspace1->id,
        ])->assertStatus(201);

        $response = $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user2->id,
            'target_workspace_id' => $workspace2->id,
        ]);

        $response->assertStatus(409);
        $response->assertJsonPath('message', 'An impersonation session is already active.');
    }

    public function test_can_start_new_impersonation_after_stopping_current(): void
    {
        ['token' => $adminToken] = $this->createSuperAdminToken();
        ['workspace' => $workspace1, 'user' => $user1] = $this->createWorkspaceWithUser();
        ['workspace' => $workspace2, 'user' => $user2] = $this->createWorkspaceWithUser();

        $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user1->id,
            'target_workspace_id' => $workspace1->id,
        ])->assertStatus(201);

        $this->postAsToken($adminToken, '/api/super-admin/impersonate/stop')->assertStatus(200);

        $response = $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user2->id,
            'target_workspace_id' => $workspace2->id,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.target_user.id', $user2->id);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Stopping Impersonation
    // ═══════════════════════════════════════════════════════════════════

    public function test_can_stop_impersonation(): void
    {
        ['token' => $adminToken, 'admin' => $admin] = $this->createSuperAdminToken();
        ['workspace' => $workspace, 'user' => $user] = $this->createWorkspaceWithUser();

        $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ]);

        $response = $this->postAsToken($adminToken, '/api/super-admin/impersonate/stop');

        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Impersonation session ended.');

        $this->assertDatabaseHas('impersonation_sessions', [
            'admin_id' => $admin->id,
            'revoked_at' => now()->toDateTimeString(),
        ]);

        $this->assertDatabaseHas('platform_audit_logs', [
            'admin_id' => $admin->id,
            'action' => 'impersonation_ended',
        ]);
    }

    public function test_stop_without_active_session_returns_404(): void
    {
        ['token' => $adminToken] = $this->createSuperAdminToken();

        $response = $this->postAsToken($adminToken, '/api/super-admin/impersonate/stop');

        $response->assertStatus(404);
        $response->assertJsonPath('message', 'No active impersonation session found.');
    }

    // ═══════════════════════════════════════════════════════════════════
    // Impersonation Status
    // ═══════════════════════════════════════════════════════════════════

    public function test_status_returns_inactive_when_no_session(): void
    {
        ['token' => $adminToken] = $this->createSuperAdminToken();

        $response = $this->getAsToken($adminToken, '/api/super-admin/impersonate/status');

        $response->assertStatus(200);
        $response->assertJsonPath('data.active', false);
    }

    public function test_status_returns_active_when_impersonating(): void
    {
        ['token' => $adminToken] = $this->createSuperAdminToken();
        ['workspace' => $workspace, 'user' => $user] = $this->createWorkspaceWithUser();

        $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ]);

        $response = $this->getAsToken($adminToken, '/api/super-admin/impersonate/status');

        $response->assertStatus(200);
        $response->assertJsonPath('data.active', true);
        $response->assertJsonPath('data.target_user.id', $user->id);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Impersonation Token Authentication (via Sanctum actingAs)
    // ═══════════════════════════════════════════════════════════════════

    public function test_impersonation_token_authenticates_as_target_user(): void
    {
        $adminToken = $this->createSuperAdminToken()['token'];
        ['workspace' => $workspace, 'user' => $user] = $this->createWorkspaceWithUser();

        $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ])->assertStatus(201);

        $session = ImpersonationSession::where('target_user_id', $user->id)->first();
        $pat = PersonalAccessToken::find($session->token_id);
        $this->assertNotNull($pat, 'Impersonation token should exist in personal_access_tokens');
        $this->assertEquals($user->id, $pat->tokenable_id);
        $this->assertTrue((bool) $pat->is_impersonation);
        $this->assertNotNull($pat->expires_at);

        \Laravel\Sanctum\Sanctum::actingAs($user);

        $meResponse = $this->getJson('/api/auth/me');
        $meResponse->assertStatus(200);
        $meResponse->assertJsonPath('data.id', $user->id);
        $this->assertFalse($meResponse->json('data.is_super_admin'));
    }

    public function test_impersonation_token_cannot_access_super_admin_routes(): void
    {
        ['token' => $adminToken] = $this->createSuperAdminToken();
        ['workspace' => $workspace, 'user' => $user] = $this->createWorkspaceWithUser();

        $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ])->assertStatus(201);

        \Laravel\Sanctum\Sanctum::actingAs($user);

        $adminResponse = $this->getJson('/api/super-admin/workspaces');
        $adminResponse->assertStatus(403);
    }

    public function test_impersonation_token_gets_workspace_data(): void
    {
        ['token' => $adminToken] = $this->createSuperAdminToken();
        ['workspace' => $workspace, 'user' => $user] = $this->createWorkspaceWithUser();

        $response = $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ]);

        $response->assertStatus(201);
        $this->assertEquals($workspace->id, $response->json('data.workspace.id'));
        $this->assertEquals($workspace->name, $response->json('data.workspace.name'));
        $this->assertEquals($user->id, $response->json('data.target_user.id'));
    }

    // ═══════════════════════════════════════════════════════════════════
    // Token Expiration (database-level verification)
    // ═══════════════════════════════════════════════════════════════════

    public function test_expired_impersonation_token_session_is_detected(): void
    {
        $adminToken = $this->createSuperAdminToken()['token'];
        $admin = User::where('is_super_admin', true)->first();
        ['workspace' => $workspace, 'user' => $user] = $this->createWorkspaceWithUser();

        $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ]);

        $session = ImpersonationSession::where('admin_id', $admin->id)->first();
        $this->assertTrue($session->isActive());

        $session->update(['expires_at' => now()->subMinute()]);
        $session->refresh();
        $this->assertTrue($session->isExpired());
        $this->assertFalse($session->isActive());
    }

    public function test_expired_session_is_revoked_on_status_check(): void
    {
        ['token' => $adminToken, 'admin' => $admin] = $this->createSuperAdminToken();
        ['workspace' => $workspace, 'user' => $user] = $this->createWorkspaceWithUser();

        $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ]);

        $session = ImpersonationSession::where('admin_id', $admin->id)->first();
        $session->update(['expires_at' => now()->subMinute()]);

        $response = $this->getAsToken($adminToken, '/api/super-admin/impersonate/status');
        $response->assertStatus(200);
        $response->assertJsonPath('data.active', false);

        $session->refresh();
        $this->assertNotNull($session->revoked_at);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Revoked Sessions (database-level verification)
    // ═══════════════════════════════════════════════════════════════════

    public function test_revoked_session_has_revoked_token_deleted(): void
    {
        ['token' => $adminToken, 'admin' => $admin] = $this->createSuperAdminToken();
        ['workspace' => $workspace, 'user' => $user] = $this->createWorkspaceWithUser();

        $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ]);

        $session = ImpersonationSession::where('admin_id', $admin->id)->first();
        $tokenId = $session->token_id;

        $this->assertDatabaseHas('personal_access_tokens', ['id' => $tokenId]);

        $session->revoke();

        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId]);
        $this->assertNotNull($session->fresh()->revoked_at);
    }

    public function test_stop_returns_404_when_no_active_session(): void
    {
        ['token' => $adminToken] = $this->createSuperAdminToken();

        $response = $this->postAsToken($adminToken, '/api/super-admin/impersonate/stop');
        $response->assertStatus(404);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Auto-Revocation: Platform Owner Deleted
    // ═══════════════════════════════════════════════════════════════════

    public function test_impersonation_session_revoked_when_admin_deleted(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $adminToken = $admin->createToken('admin-token')->plainTextToken;

        ['workspace' => $workspace, 'user' => $user] = $this->createWorkspaceWithUser();

        $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ])->assertStatus(201);

        $this->assertDatabaseHas('impersonation_sessions', [
            'admin_id' => $admin->id,
            'revoked_at' => null,
        ]);

        $admin->delete();

        $this->assertDatabaseMissing('impersonation_sessions', [
            'admin_id' => $admin->id,
            'revoked_at' => null,
        ]);

        $this->assertDatabaseHas('platform_audit_logs', [
            'admin_id' => $admin->id,
            'action' => 'impersonation_user_deleted',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Auto-Revocation: Platform Owner Deactivated
    // ═══════════════════════════════════════════════════════════════════

    public function test_impersonation_session_revoked_when_admin_deactivated(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $adminToken = $admin->createToken('admin-token')->plainTextToken;

        ['workspace' => $workspace, 'user' => $user] = $this->createWorkspaceWithUser();

        $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ])->assertStatus(201);

        $admin->forceFill(['is_super_admin' => false])->save();

        $this->assertDatabaseMissing('impersonation_sessions', [
            'admin_id' => $admin->id,
            'revoked_at' => null,
        ]);

        $this->assertDatabaseHas('platform_audit_logs', [
            'admin_id' => $admin->id,
            'action' => 'impersonation_platform_owner_deactivated',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Auto-Revocation: Target User Deleted
    // ═══════════════════════════════════════════════════════════════════

    public function test_impersonation_session_revoked_when_target_user_deleted(): void
    {
        ['token' => $adminToken, 'admin' => $admin] = $this->createSuperAdminToken();
        ['workspace' => $workspace, 'user' => $user] = $this->createWorkspaceWithUser();

        $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ])->assertStatus(201);

        $user->delete();

        $this->assertDatabaseMissing('impersonation_sessions', [
            'admin_id' => $admin->id,
            'revoked_at' => null,
        ]);

        $this->assertDatabaseHas('platform_audit_logs', [
            'admin_id' => $admin->id,
            'action' => 'impersonation_user_deleted',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Auto-Revocation: Target User Deactivated
    // ═══════════════════════════════════════════════════════════════════

    public function test_impersonation_session_revoked_when_target_user_deactivated(): void
    {
        ['token' => $adminToken, 'admin' => $admin] = $this->createSuperAdminToken();
        ['workspace' => $workspace, 'user' => $user] = $this->createWorkspaceWithUser();

        $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ])->assertStatus(201);

        $user->forceFill(['workspace_id' => null])->save();

        $this->assertDatabaseMissing('impersonation_sessions', [
            'admin_id' => $admin->id,
            'revoked_at' => null,
        ]);

        $this->assertDatabaseHas('platform_audit_logs', [
            'admin_id' => $admin->id,
            'action' => 'impersonation_user_deactivated',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Platform Owner Isolation
    // ═══════════════════════════════════════════════════════════════════

    public function test_platform_owner_never_receives_workspace_id(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $this->assertNull($admin->workspace_id);
    }

    public function test_platform_owner_never_in_workspace_user_pivot(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $workspace = Workspace::factory()->create();

        $hasPivot = \DB::table('workspace_user')
            ->where('user_id', $admin->id)
            ->where('workspace_id', $workspace->id)
            ->exists();

        $this->assertFalse($hasPivot);
    }

    public function test_platform_owner_never_receives_workspace_role(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $roles = $admin->getRoleNames();
        $this->assertTrue($roles->isEmpty());
    }

    // ═══════════════════════════════════════════════════════════════════
    // One Active Session Per Admin (Application-Level)
    // ═══════════════════════════════════════════════════════════════════

    public function test_application_enforces_one_active_session_per_admin(): void
    {
        ['token' => $adminToken] = $this->createSuperAdminToken();
        ['workspace' => $workspace1, 'user' => $user1] = $this->createWorkspaceWithUser();
        ['workspace' => $workspace2, 'user' => $user2] = $this->createWorkspaceWithUser();

        $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user1->id,
            'target_workspace_id' => $workspace1->id,
        ])->assertStatus(201);

        $this->postAsToken($adminToken, '/api/super-admin/impersonate', [
            'target_user_id' => $user2->id,
            'target_workspace_id' => $workspace2->id,
        ])->assertStatus(409);
    }
}
