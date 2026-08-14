<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\UserViewPreference;

class PreferenceTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_list_preferences(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/preferences');

        $response->assertStatus(200);
    }

    public function test_admin_can_create_preference(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/preferences', [
            'object_type' => 'contacts',
            'visible_columns' => ['id', 'name', 'email'],
            'column_order' => ['name', 'email', 'id'],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('user_view_preferences', [
            'user_id' => $this->adminUser->id,
            'object_type' => 'contacts',
        ]);
    }

    public function test_admin_can_show_preference(): void
    {
        $this->authenticateAsAdmin();
        $preference = UserViewPreference::factory()->create([
            'user_id' => $this->adminUser->id,
        ]);

        $response = $this->getJson('/api/preferences/' . $preference->id);

        $response->assertStatus(200);
    }

    public function test_admin_can_update_preference(): void
    {
        $this->authenticateAsAdmin();
        $preference = UserViewPreference::factory()->create([
            'user_id' => $this->adminUser->id,
        ]);

        $response = $this->putJson('/api/preferences/' . $preference->id, [
            'object_type' => 'deals',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('user_view_preferences', [
            'id' => $preference->id,
            'object_type' => 'deals',
        ]);
    }

    public function test_admin_can_delete_preference(): void
    {
        $this->authenticateAsAdmin();
        $preference = UserViewPreference::factory()->create([
            'user_id' => $this->adminUser->id,
        ]);

        $response = $this->deleteJson('/api/preferences/' . $preference->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('user_view_preferences', ['id' => $preference->id]);
    }

    public function test_create_preference_requires_object_type(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/preferences', []);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['object_type']);
    }

    public function test_create_preference_invalid_object_type(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/preferences', [
            'object_type' => 'invalid_type',
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['object_type']);
    }

    public function test_user_cannot_view_another_users_preference(): void
    {
        $this->authenticateAsAdmin();
        $otherUserPreference = UserViewPreference::factory()->create();

        $response = $this->getJson('/api/preferences/' . $otherUserPreference->id);

        $this->assertForbidden($response);
    }
}
