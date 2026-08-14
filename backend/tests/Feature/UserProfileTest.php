<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use Illuminate\Support\Facades\DB;

class UserProfileTest extends TestCase
{
    use TestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpWorkspace();
    }

    public function test_authenticated_user_can_get_profile(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/user/profile');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'first_name',
                'last_name',
                'email',
                'language',
                'date_format',
                'phone_country',
                'phone_number',
                'default_landing_page',
                'work_start_day',
                'work_end_day',
                'work_start_time',
                'work_end_time',
            ],
        ]);
    }

    public function test_unauthenticated_user_cannot_get_profile(): void
    {
        $response = $this->getJson('/api/user/profile');

        $response->assertStatus(401);
    }

    public function test_user_can_update_name(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->putJson('/api/user/profile', [
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);

        $this->assertDatabaseHas('users', [
            'id' => $this->adminUser->id,
            'name' => 'John Doe',
        ]);
    }

    public function test_user_can_update_name_without_last_name(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->putJson('/api/user/profile', [
            'first_name' => 'John',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'id' => $this->adminUser->id,
            'name' => 'John',
        ]);
    }

    public function test_user_can_update_preferences(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->putJson('/api/user/profile', [
            'language' => 'fr',
            'date_format' => 'gb',
            'phone_country' => 'gb',
            'phone_number' => '1234567890',
            'default_landing_page' => 'contacts',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $this->adminUser->id,
            'language' => 'fr',
            'date_format' => 'gb',
            'phone_country' => 'gb',
            'phone_number' => '1234567890',
            'default_landing_page' => 'contacts',
        ]);
    }

    public function test_user_can_update_work_schedule(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->putJson('/api/user/profile', [
            'work_start_day' => 'Monday',
            'work_end_day' => 'Friday',
            'work_start_time' => '09:00',
            'work_end_time' => '17:00',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $this->adminUser->id,
            'work_start_day' => 'Monday',
            'work_end_day' => 'Friday',
            'work_start_time' => '09:00',
            'work_end_time' => '17:00',
        ]);
    }

    public function test_user_can_update_all_fields_at_once(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->putJson('/api/user/profile', [
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'language' => 'de',
            'date_format' => 'de',
            'phone_country' => 'de',
            'phone_number' => '9876543210',
            'default_landing_page' => 'deals',
            'work_start_day' => 'Monday',
            'work_end_day' => 'Thursday',
            'work_start_time' => '08:00',
            'work_end_time' => '16:00',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $this->adminUser->id,
            'name' => 'Jane Smith',
            'language' => 'de',
            'date_format' => 'de',
            'phone_country' => 'de',
            'phone_number' => '9876543210',
            'default_landing_page' => 'deals',
            'work_start_day' => 'Monday',
            'work_end_day' => 'Thursday',
            'work_start_time' => '08:00',
            'work_end_time' => '16:00',
        ]);
    }

    public function test_profile_returns_default_values(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/user/profile');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'first_name',
                'last_name',
                'email',
                'language',
                'date_format',
                'phone_country',
                'phone_number',
                'default_landing_page',
                'work_start_day',
                'work_end_day',
                'work_start_time',
                'work_end_time',
            ],
        ]);
    }

    public function test_profile_defaults_applied_after_save(): void
    {
        $this->authenticateAsAdmin();

        $this->putJson('/api/user/profile', [
            'language' => 'fr',
            'date_format' => 'gb',
        ]);

        $response = $this->getJson('/api/user/profile');

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'language' => 'fr',
            'date_format' => 'gb',
        ]);
    }

    public function test_change_password_writes_security_audit_log(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->putJson('/api/user/password', [
            'current_password' => 'password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
            'action' => 'updated',
            'category' => 'Security',
            'subcategory' => 'Password Changed',
        ]);
    }

    public function test_logout_all_revokes_tokens_and_web_sessions(): void
    {
        $this->authenticateAsAdmin();

        $this->adminUser->createToken('test-token');
        $this->assertCount(1, $this->adminUser->tokens()->get());

        DB::table('sessions')->insert([
            'id' => 'session-logout-all-1',
            'user_id' => $this->adminUser->id,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'phpunit',
            'payload' => json_encode([]),
            'last_activity' => now()->timestamp,
        ]);

        $response = $this->postJson('/api/user/logout-all');

        $response->assertStatus(200);
        $response->assertJsonFragment(['message' => 'Logged out of all sessions.']);

        $this->assertCount(0, $this->adminUser->tokens()->get());
        $this->assertDatabaseMissing('sessions', ['user_id' => $this->adminUser->id]);
    }
}
