<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\PlatformSettings;
use App\Models\User;

class PlatformOwnerBootstrapTest extends TestCase
{
    use TestHelpers;

    private function markBootstrapCompleted(): void
    {
        PlatformSettings::instance()->forceFill(['bootstrap_completed_at' => now()])->save();
    }

    // ── GET /bootstrap/status ──────────────────────────────────────

    public function test_bootstrap_status_returns_false_when_not_completed(): void
    {
        $response = $this->getJson('/api/bootstrap/status');

        $response->assertStatus(200);
        $response->assertJsonPath('data.has_platform_owner', false);
    }

    public function test_bootstrap_status_returns_true_when_completed(): void
    {
        $this->markBootstrapCompleted();

        $response = $this->getJson('/api/bootstrap/status');

        $response->assertStatus(200);
        $response->assertJsonPath('data.has_platform_owner', true);
    }

    public function test_bootstrap_status_returns_true_when_completed_even_with_zero_pos(): void
    {
        $this->markBootstrapCompleted();

        $response = $this->getJson('/api/bootstrap/status');

        $response->assertStatus(200);
        $response->assertJsonPath('data.has_platform_owner', true);
    }

    // ── POST /bootstrap ───────────────────────────────────────────

    public function test_can_create_first_platform_owner(): void
    {
        $response = $this->postJson('/api/bootstrap', [
            'name'                  => 'Test Owner',
            'email'                 => 'owner@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => ['message', 'user' => ['id', 'name', 'email'], 'token'],
        ]);
        $response->assertJsonPath('data.user.email', 'owner@test.com');

        $this->assertDatabaseHas('users', [
            'email' => 'owner@test.com',
            'is_super_admin' => true,
        ]);

        $settings = PlatformSettings::instance();
        $this->assertNotNull($settings->bootstrap_completed_at);
    }

    public function test_bootstrap_rejected_when_already_completed(): void
    {
        $this->markBootstrapCompleted();

        $response = $this->postJson('/api/bootstrap', [
            'name'                  => 'Second Owner',
            'email'                 => 'second@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('users', ['email' => 'second@test.com']);
    }

    public function test_bootstrap_permanently_disabled_even_when_all_pos_removed(): void
    {
        $this->markBootstrapCompleted();

        $response = $this->postJson('/api/bootstrap', [
            'name'                  => 'Recovery Owner',
            'email'                 => 'recovery@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'Bootstrap has already been completed. Use the admin dashboard or Artisan command to manage Platform Owners.');
    }

    public function test_bootstrap_validates_required_fields(): void
    {
        $response = $this->postJson('/api/bootstrap', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_bootstrap_validates_email_uniqueness(): void
    {
        User::factory()->create(['email' => 'existing@test.com']);

        $response = $this->postJson('/api/bootstrap', [
            'name'                  => 'Test',
            'email'                 => 'existing@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_bootstrap_validates_password_confirmation(): void
    {
        $response = $this->postJson('/api/bootstrap', [
            'name'                  => 'Test',
            'email'                 => 'test@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'different123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_bootstrap_validates_password_minimum_length(): void
    {
        $response = $this->postJson('/api/bootstrap', [
            'name'                  => 'Test',
            'email'                 => 'test@test.com',
            'password'              => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    // ── Regression: bootstrap must stay closed even if the flag is NULL ──

    public function test_bootstrap_rejected_when_platform_owner_exists_but_flag_missing(): void
    {
        User::factory()->superAdmin()->create(['email' => 'owner@test.com']);

        $response = $this->postJson('/api/bootstrap', [
            'name'                  => 'Attacker',
            'email'                 => 'attacker@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'Bootstrap has already been completed. Use the admin dashboard or Artisan command to manage Platform Owners.');
        $this->assertDatabaseMissing('users', ['email' => 'attacker@test.com']);
    }

    public function test_bootstrap_status_true_when_platform_owner_exists_but_flag_missing(): void
    {
        User::factory()->superAdmin()->create(['email' => 'owner@test.com']);

        $response = $this->getJson('/api/bootstrap/status');

        $response->assertStatus(200);
        $response->assertJsonPath('data.has_platform_owner', true);
    }

    public function test_database_seeder_sets_bootstrap_completed_at(): void
    {
        $this->seed(\Database\Seeders\DatabaseSeeder::class);

        $this->assertNotNull(PlatformSettings::instance()->bootstrap_completed_at);

        $response = $this->postJson('/api/bootstrap', [
            'name'                  => 'Attacker',
            'email'                 => 'attacker@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('users', ['email' => 'attacker@test.com']);
    }

    // ── GET /super-admin/platform-owners ───────────────────────────

    public function test_super_admin_can_list_platform_owners(): void
    {
        $this->authenticateAsSuperAdmin();
        User::factory()->superAdmin()->create(['name' => 'Owner Two']);

        $response = $this->getJson('/api/super-admin/platform-owners');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'name', 'email', 'created_at'],
            ],
            'meta' => ['total'],
        ]);
        $this->assertGreaterThanOrEqual(2, $response->json('meta.total'));
    }

    public function test_non_super_admin_cannot_list_platform_owners(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/platform-owners');

        $response->assertStatus(403);
    }

    // ── POST /super-admin/platform-owners ──────────────────────────

    public function test_super_admin_can_create_platform_owner(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->postJson('/api/super-admin/platform-owners', [
            'name'                  => 'New Owner',
            'email'                 => 'newowner@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.email', 'newowner@test.com');

        $this->assertDatabaseHas('users', [
            'email' => 'newowner@test.com',
            'is_super_admin' => true,
        ]);
    }

    public function test_non_super_admin_cannot_create_platform_owner(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/super-admin/platform-owners', [
            'name'                  => 'New Owner',
            'email'                 => 'newowner@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(403);
    }

    // ── POST /super-admin/platform-owners/{user}/deactivate ────────

    public function test_super_admin_can_deactivate_platform_owner(): void
    {
        $this->authenticateAsSuperAdmin();
        $owner = User::factory()->superAdmin()->create();

        $response = $this->postJson("/api/super-admin/platform-owners/{$owner->id}/deactivate");

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $owner->id,
            'is_super_admin' => false,
        ]);
    }

    public function test_cannot_deactivate_self(): void
    {
        $admin = User::factory()->superAdmin()->create();
        \Laravel\Sanctum\Sanctum::actingAs($admin);

        $response = $this->postJson("/api/super-admin/platform-owners/{$admin->id}/deactivate");

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'Cannot deactivate the last active Platform Owner. Create another one first.');
        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'is_super_admin' => true,
        ]);
    }

    public function test_cannot_deactivate_self_when_other_pos_exist(): void
    {
        $admin = User::factory()->superAdmin()->create();
        User::factory()->superAdmin()->create();
        \Laravel\Sanctum\Sanctum::actingAs($admin);

        $response = $this->postJson("/api/super-admin/platform-owners/{$admin->id}/deactivate");

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'You cannot deactivate your own account.');
    }

    public function test_cannot_deactivate_last_active_platform_owner(): void
    {
        $admin = User::factory()->superAdmin()->create();
        $other = User::factory()->superAdmin()->create();
        \Laravel\Sanctum\Sanctum::actingAs($other);

        $response = $this->postJson("/api/super-admin/platform-owners/{$admin->id}/deactivate");
        $response->assertStatus(200);

        $response = $this->postJson("/api/super-admin/platform-owners/{$other->id}/deactivate");
        $response->assertStatus(403);
        $response->assertJsonPath('message', 'Cannot deactivate the last active Platform Owner. Create another one first.');
    }

    public function test_non_super_admin_cannot_deactivate_platform_owner(): void
    {
        $this->authenticateAsAdmin();
        $owner = User::factory()->superAdmin()->create();

        $response = $this->postJson("/api/super-admin/platform-owners/{$owner->id}/deactivate");

        $response->assertStatus(403);
    }

    public function test_deactivating_non_super_admin_returns_404(): void
    {
        $this->authenticateAsSuperAdmin();
        $user = User::factory()->create();

        $response = $this->postJson("/api/super-admin/platform-owners/{$user->id}/deactivate");

        $response->assertStatus(404);
    }

    public function test_deactivation_revokes_tokens(): void
    {
        $this->authenticateAsSuperAdmin();
        $owner = User::factory()->superAdmin()->create();
        $owner->createToken('test-token');

        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->postJson("/api/super-admin/platform-owners/{$owner->id}/deactivate");

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
