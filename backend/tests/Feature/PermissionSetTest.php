<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\PermissionSet;
use App\Models\User;
use App\Models\Workspace;

class PermissionSetTest extends TestCase
{
    use TestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpWorkspace();
        $this->adminUser->syncRoles('Workspace Owner');
        $this->standardUser->syncRoles('Workspace Member');
    }

    private function createPermissionSet(array $attributes = []): PermissionSet
    {
        return PermissionSet::create(array_merge([
            'workspace_id' => $this->workspace->id,
            'name' => 'Sales Team Access',
            'created_by' => $this->adminUser->id,
        ], $attributes));
    }

    public function test_admin_can_list_permission_sets(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $this->createPermissionSet(['name' => 'Set A']);
        $this->createPermissionSet(['name' => 'Set B']);
        $this->createPermissionSet(['name' => 'Set C']);

        $response = $this->getJson("/api/workspaces/{$this->workspace->id}/permission-sets");

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
    }

    public function test_standard_user_cannot_list_permission_sets(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->standardUser);

        $response = $this->getJson("/api/workspaces/{$this->workspace->id}/permission-sets");

        $response->assertStatus(403);
    }

    public function test_admin_can_create_permission_set_with_permissions(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);

        $response = $this->postJson("/api/workspaces/{$this->workspace->id}/permission-sets", [
            'name' => 'Sales Team Access',
            'description' => 'Read all, edit own',
            'permissions' => [
                ['object' => 'contacts', 'key' => 'view', 'value' => 'all', 'scope' => 'CRM objects'],
                ['object' => 'contacts', 'key' => 'edit', 'value' => 'their', 'scope' => 'CRM objects'],
            ],
        ]);

        $response->assertStatus(201);
        $response->assertJsonFragment(['name' => 'Sales Team Access']);
        $this->assertDatabaseHas('permission_sets', [
            'name' => 'Sales Team Access',
            'workspace_id' => $this->workspace->id,
            'created_by' => $this->adminUser->id,
        ]);
        $this->assertDatabaseHas('permission_set_permissions', [
            'object' => 'contacts',
            'key' => 'view',
            'value' => 'all',
            'scope' => 'CRM objects',
        ]);
    }

    public function test_create_permission_set_requires_name(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);

        $response = $this->postJson("/api/workspaces/{$this->workspace->id}/permission-sets", []);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_create_permission_set_requires_object_and_key_for_permissions(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);

        $response = $this->postJson("/api/workspaces/{$this->workspace->id}/permission-sets", [
            'name' => 'Broken Set',
            'permissions' => [
                ['value' => 'all'],
            ],
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['permissions.0.object', 'permissions.0.key']);
    }

    public function test_permission_set_name_must_be_unique_within_workspace(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $this->createPermissionSet(['name' => 'Duplicate Name']);

        $response = $this->postJson("/api/workspaces/{$this->workspace->id}/permission-sets", [
            'name' => 'Duplicate Name',
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_same_name_allowed_in_another_workspace(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $otherWorkspace = Workspace::factory()->create();
        PermissionSet::create([
            'workspace_id' => $otherWorkspace->id,
            'name' => 'Shared Name',
        ]);

        $response = $this->postJson("/api/workspaces/{$this->workspace->id}/permission-sets", [
            'name' => 'Shared Name',
        ]);

        $response->assertStatus(201);
    }

    public function test_admin_can_view_permission_set_with_permissions(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $set = $this->createPermissionSet();
        $set->permissions()->create([
            'object' => 'deals',
            'key' => 'view',
            'value' => 'all',
            'scope' => 'CRM objects',
        ]);

        $response = $this->getJson("/api/workspaces/{$this->workspace->id}/permission-sets/{$set->id}");

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $set->id]);
        $response->assertJsonFragment(['object' => 'deals', 'key' => 'view']);
    }

    public function test_cannot_view_permission_set_from_another_workspace(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $otherWorkspace = Workspace::factory()->create();
        $otherSet = PermissionSet::create([
            'workspace_id' => $otherWorkspace->id,
            'name' => 'Other Workspace Set',
        ]);

        $response = $this->getJson("/api/workspaces/{$this->workspace->id}/permission-sets/{$otherSet->id}");

        $this->assertNotFound($response);
    }

    public function test_admin_can_update_permission_set_and_sync_permissions(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $set = $this->createPermissionSet(['name' => 'Before']);
        $set->permissions()->create([
            'object' => 'contacts',
            'key' => 'view',
            'value' => 'all',
        ]);

        $response = $this->putJson("/api/workspaces/{$this->workspace->id}/permission-sets/{$set->id}", [
            'name' => 'After',
            'permissions' => [
                ['object' => 'deals', 'key' => 'view', 'value' => 'none'],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'After']);
        $this->assertDatabaseHas('permission_sets', ['id' => $set->id, 'name' => 'After']);
        $this->assertDatabaseHas('permission_set_permissions', [
            'permission_set_id' => $set->id,
            'object' => 'deals',
            'key' => 'view',
        ]);
        $this->assertDatabaseMissing('permission_set_permissions', [
            'permission_set_id' => $set->id,
            'object' => 'contacts',
        ]);
    }

    public function test_admin_can_delete_permission_set_and_cascade_permissions(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $set = $this->createPermissionSet();
        $set->permissions()->create([
            'object' => 'contacts',
            'key' => 'view',
            'value' => 'all',
        ]);

        $response = $this->deleteJson("/api/workspaces/{$this->workspace->id}/permission-sets/{$set->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('permission_sets', ['id' => $set->id]);
        $this->assertDatabaseMissing('permission_set_permissions', ['permission_set_id' => $set->id]);
    }

    public function test_standard_user_cannot_delete_permission_set(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->standardUser);
        $set = $this->createPermissionSet();

        $response = $this->deleteJson("/api/workspaces/{$this->workspace->id}/permission-sets/{$set->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('permission_sets', ['id' => $set->id]);
    }

    public function test_admin_can_assign_users_to_permission_set(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $set = $this->createPermissionSet();

        $memberOne = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $memberOne->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Member',
            'is_active' => true,
        ]);
        $memberTwo = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $memberTwo->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Member',
            'is_active' => true,
        ]);

        $response = $this->postJson("/api/workspaces/{$this->workspace->id}/permission-sets/{$set->id}/assign", [
            'user_ids' => [$memberOne->id, $memberTwo->id],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('permission_set_user', [
            'permission_set_id' => $set->id,
            'user_id' => $memberOne->id,
        ]);
        $this->assertDatabaseHas('permission_set_user', [
            'permission_set_id' => $set->id,
            'user_id' => $memberTwo->id,
        ]);
    }

    public function test_assign_rejects_user_not_in_workspace(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $set = $this->createPermissionSet();
        $nonMember = User::factory()->create();

        $response = $this->postJson("/api/workspaces/{$this->workspace->id}/permission-sets/{$set->id}/assign", [
            'user_ids' => [$nonMember->id],
        ]);

        $this->assertValidationError($response);
        $this->assertDatabaseMissing('permission_set_user', ['permission_set_id' => $set->id]);
    }

    public function test_assign_requires_user_ids(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $set = $this->createPermissionSet();

        $response = $this->postJson("/api/workspaces/{$this->workspace->id}/permission-sets/{$set->id}/assign", []);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['user_ids']);
    }

    public function test_list_includes_users_count(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $set = $this->createPermissionSet();
        $set->users()->attach($this->standardUser->id);

        $response = $this->getJson("/api/workspaces/{$this->workspace->id}/permission-sets");

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'id' => $set->id,
            'users_count' => 1,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_permission_sets(): void
    {
        $response = $this->getJson("/api/workspaces/{$this->workspace->id}/permission-sets");

        $this->assertUnauthenticated($response);
    }
}