<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Property;
use App\Models\Workspace;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

class PropertyAuthorizationTest extends TestCase
{
    use TestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpWorkspace();
    }

    // ─── Workspace Member: can view, cannot mutate ──────────────────────

    public function test_standard_user_can_list_properties(): void
    {
        $this->authenticateAsStandardUser();
        Property::factory()->count(2)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/properties');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data.properties'));
    }

    public function test_standard_user_can_show_property(): void
    {
        $this->authenticateAsStandardUser();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson("/api/properties/{$property->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $property->id);
    }

    public function test_standard_user_cannot_create_property(): void
    {
        $this->authenticateAsStandardUser();

        $response = $this->postJson('/api/properties', [
            'name' => 'unauthorized_prop',
            'label' => 'Unauthorized',
            'field_type' => 'single_line_text',
            'object_type' => 'contact',
        ]);

        $this->assertForbidden($response);
        $this->assertDatabaseMissing('properties', ['name' => 'unauthorized_prop']);
    }

    public function test_standard_user_cannot_update_property(): void
    {
        $this->authenticateAsStandardUser();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->patchJson("/api/properties/{$property->id}", [
            'label' => 'Hacked',
        ]);

        $this->assertForbidden($response);
        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'label' => $property->label,
        ]);
    }

    public function test_standard_user_cannot_delete_property(): void
    {
        $this->authenticateAsStandardUser();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->deleteJson("/api/properties/{$property->id}");

        $this->assertForbidden($response);
        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'is_archived' => false,
        ]);
    }

    public function test_standard_user_cannot_update_rules(): void
    {
        $this->authenticateAsStandardUser();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->patchJson("/api/properties/{$property->id}/rules", [
            'validation' => ['required'],
        ]);

        $this->assertForbidden($response);
    }

    public function test_standard_user_cannot_update_access(): void
    {
        $this->authenticateAsStandardUser();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->patchJson("/api/properties/{$property->id}/access", [
            'access' => ['type' => 'restricted'],
        ]);

        $this->assertForbidden($response);
    }

    public function test_standard_user_can_view_rules(): void
    {
        $this->authenticateAsStandardUser();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson("/api/properties/{$property->id}/rules");

        $response->assertStatus(200);
    }

    public function test_standard_user_can_view_access(): void
    {
        $this->authenticateAsStandardUser();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson("/api/properties/{$property->id}/access");

        $response->assertStatus(200);
    }

    // ─── Workspace Owner: full CRUD ─────────────────────────────────

    public function test_owner_can_create_property(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/properties', [
            'name' => 'owner_prop',
            'label' => 'Owner Property',
            'field_type' => 'number',
            'object_type' => 'deal',
        ]);

        $this->assertResourceCreated($response);
        $this->assertDatabaseHas('properties', [
            'name' => 'owner_prop',
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_owner_can_update_property(): void
    {
        $this->authenticateAsAdmin();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->patchJson("/api/properties/{$property->id}", [
            'label' => 'Updated by Owner',
        ]);

        $this->assertResourceUpdated($response);
        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'label' => 'Updated by Owner',
        ]);
    }

    public function test_owner_can_delete_property(): void
    {
        $this->authenticateAsAdmin();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->deleteJson("/api/properties/{$property->id}");

        $this->assertResourceDeleted($response);
        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'is_archived' => true,
        ]);
    }

    public function test_owner_can_force_delete_property(): void
    {
        $this->authenticateAsAdmin();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->deleteJson("/api/properties/{$property->id}?force=true");

        $this->assertResourceDeleted($response);
        $this->assertDatabaseMissing('properties', ['id' => $property->id]);
    }

    public function test_owner_can_update_rules(): void
    {
        $this->authenticateAsAdmin();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->patchJson("/api/properties/{$property->id}/rules", [
            'validation' => ['min:3', 'max:50'],
            'case_sensitivity' => 'insensitive',
        ]);

        $response->assertStatus(200);
        $property->refresh();
        $this->assertEquals(['min:3', 'max:50'], $property->settings['rules']['validation']);
    }

    public function test_owner_can_update_access(): void
    {
        $this->authenticateAsAdmin();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->patchJson("/api/properties/{$property->id}/access", [
            'access' => ['type' => 'restricted'],
        ]);

        $response->assertStatus(200);
    }

    // ─── Workspace Isolation ─────────────────────────────────────────

    public function test_user_cannot_view_property_from_another_workspace(): void
    {
        $this->authenticateAsAdmin();

        $otherWorkspace = Workspace::factory()->create();
        $otherProperty = Property::factory()->create([
            'workspace_id' => $otherWorkspace->id,
        ]);

        $response = $this->getJson("/api/properties/{$otherProperty->id}");

        $this->assertNotFound($response);
    }

    public function test_user_cannot_update_property_from_another_workspace(): void
    {
        $this->authenticateAsAdmin();

        $otherWorkspace = Workspace::factory()->create();
        $otherProperty = Property::factory()->create([
            'workspace_id' => $otherWorkspace->id,
        ]);

        $response = $this->patchJson("/api/properties/{$otherProperty->id}", [
            'label' => 'Cross-workspace hack',
        ]);

        $this->assertNotFound($response);
    }

    public function test_user_cannot_delete_property_from_another_workspace(): void
    {
        $this->authenticateAsAdmin();

        $otherWorkspace = Workspace::factory()->create();
        $otherProperty = Property::factory()->create([
            'workspace_id' => $otherWorkspace->id,
        ]);

        $response = $this->deleteJson("/api/properties/{$otherProperty->id}");

        $this->assertNotFound($response);
    }

    public function test_list_only_shows_own_workspace_properties(): void
    {
        $this->authenticateAsAdmin();
        Property::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $otherWorkspace = Workspace::factory()->create();
        Property::factory()->count(5)->create([
            'workspace_id' => $otherWorkspace->id,
        ]);

        $response = $this->getJson('/api/properties');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data.properties'));
    }

    public function test_user_cannot_view_rules_from_another_workspace(): void
    {
        $this->authenticateAsAdmin();

        $otherWorkspace = Workspace::factory()->create();
        $otherProperty = Property::factory()->create([
            'workspace_id' => $otherWorkspace->id,
        ]);

        $response = $this->getJson("/api/properties/{$otherProperty->id}/rules");

        $this->assertNotFound($response);
    }

    public function test_user_cannot_update_rules_from_another_workspace(): void
    {
        $this->authenticateAsAdmin();

        $otherWorkspace = Workspace::factory()->create();
        $otherProperty = Property::factory()->create([
            'workspace_id' => $otherWorkspace->id,
        ]);

        $response = $this->patchJson("/api/properties/{$otherProperty->id}/rules", [
            'validation' => ['hacked'],
        ]);

        $this->assertNotFound($response);
    }

    public function test_user_cannot_view_access_from_another_workspace(): void
    {
        $this->authenticateAsAdmin();

        $otherWorkspace = Workspace::factory()->create();
        $otherProperty = Property::factory()->create([
            'workspace_id' => $otherWorkspace->id,
        ]);

        $response = $this->getJson("/api/properties/{$otherProperty->id}/access");

        $this->assertNotFound($response);
    }

    public function test_user_cannot_update_access_from_another_workspace(): void
    {
        $this->authenticateAsAdmin();

        $otherWorkspace = Workspace::factory()->create();
        $otherProperty = Property::factory()->create([
            'workspace_id' => $otherWorkspace->id,
        ]);

        $response = $this->patchJson("/api/properties/{$otherProperty->id}/access", [
            'access' => ['type' => 'hacked'],
        ]);

        $this->assertNotFound($response);
    }

    public function test_user_cannot_add_assignment_from_another_workspace(): void
    {
        $this->authenticateAsAdmin();

        $otherWorkspace = Workspace::factory()->create();
        $otherProperty = Property::factory()->create([
            'workspace_id' => $otherWorkspace->id,
        ]);

        $response = $this->postJson("/api/properties/{$otherProperty->id}/access/assignments", [
            'entity_type' => 'user',
            'entity_id' => $this->adminUser->id,
        ]);

        $this->assertNotFound($response);
    }

    public function test_user_cannot_remove_assignment_from_another_workspace(): void
    {
        $this->authenticateAsAdmin();

        $otherWorkspace = Workspace::factory()->create();
        $otherProperty = Property::factory()->create([
            'workspace_id' => $otherWorkspace->id,
        ]);

        $response = $this->deleteJson("/api/properties/{$otherProperty->id}/access/assignments/fake-id");

        $this->assertNotFound($response);
    }

    public function test_user_cannot_update_assignment_from_another_workspace(): void
    {
        $this->authenticateAsAdmin();

        $otherWorkspace = Workspace::factory()->create();
        $otherProperty = Property::factory()->create([
            'workspace_id' => $otherWorkspace->id,
        ]);

        $response = $this->patchJson("/api/properties/{$otherProperty->id}/access/assignments/fake-id", [
            'access_level' => 'view_only',
        ]);

        $this->assertNotFound($response);
    }

    // ─── Unique Constraint ───────────────────────────────────────────

    public function test_same_name_same_workspace_same_object_type_rejected(): void
    {
        $this->authenticateAsAdmin();

        $this->postJson('/api/properties', [
            'name' => 'annual_revenue',
            'label' => 'Revenue',
            'field_type' => 'number',
            'object_type' => 'contact',
        ]);

        $response = $this->postJson('/api/properties', [
            'name' => 'annual_revenue',
            'label' => 'Revenue Again',
            'field_type' => 'currency',
            'object_type' => 'contact',
        ]);

        $response->assertStatus(500);
    }

    public function test_same_name_different_object_type_allowed(): void
    {
        $this->authenticateAsAdmin();

        $this->postJson('/api/properties', [
            'name' => 'annual_revenue',
            'label' => 'Revenue',
            'field_type' => 'number',
            'object_type' => 'contact',
        ]);

        $response = $this->postJson('/api/properties', [
            'name' => 'annual_revenue',
            'label' => 'Revenue for Deal',
            'field_type' => 'number',
            'object_type' => 'deal',
        ]);

        $this->assertResourceCreated($response);
    }

    public function test_same_name_different_workspaces_allowed(): void
    {
        $this->authenticateAsAdmin();

        $this->postJson('/api/properties', [
            'name' => 'annual_revenue',
            'label' => 'Revenue',
            'field_type' => 'number',
            'object_type' => 'contact',
        ]);

        $otherWorkspace = Workspace::factory()->create();
        $otherUser = User::factory()->create(['workspace_id' => $otherWorkspace->id]);
        app(PermissionRegistrar::class)->setPermissionsTeamId($otherWorkspace->id);
        $this->seed(RolesAndPermissionsSeeder::class);
        $otherUser->assignRole('Workspace Owner');
        $otherUser->workspaces()->attach($otherWorkspace->id, [
            'role_name' => 'Workspace Owner',
            'is_active' => true,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($otherUser);
        app(PermissionRegistrar::class)->setPermissionsTeamId($otherWorkspace->id);

        $response = $this->postJson('/api/properties', [
            'name' => 'annual_revenue',
            'label' => 'Revenue Other Workspace',
            'field_type' => 'number',
            'object_type' => 'contact',
        ]);

        $this->assertResourceCreated($response);
        $this->assertDatabaseHas('properties', [
            'name' => 'annual_revenue',
            'workspace_id' => $otherWorkspace->id,
        ]);
    }

    public function test_archived_property_still_enforces_uniqueness(): void
    {
        $this->authenticateAsAdmin();

        Property::factory()->create([
            'workspace_id' => $this->workspace->id,
            'name' => 'archived_prop',
            'object_type' => 'contact',
            'is_archived' => true,
        ]);

        $response = $this->postJson('/api/properties', [
            'name' => 'archived_prop',
            'label' => 'Try Duplicate',
            'field_type' => 'text',
            'object_type' => 'contact',
        ]);

        $response->assertStatus(500);
    }

    // ─── PropertyGroupController Authorization ───────────────────────

    public function test_standard_user_can_list_property_groups(): void
    {
        $this->authenticateAsStandardUser();
        Property::factory()->create([
            'workspace_id' => $this->workspace->id,
            'group_name' => 'Contact Info',
            'object_type' => 'contact',
        ]);

        $response = $this->getJson('/api/property-groups?object_type=contact');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_standard_user_cannot_create_property_group(): void
    {
        $this->authenticateAsStandardUser();

        $response = $this->postJson('/api/property-groups', [
            'name' => 'New Group',
            'object_type' => 'contact',
        ]);

        $this->assertForbidden($response);
    }

    public function test_standard_user_cannot_rename_property_group(): void
    {
        $this->authenticateAsStandardUser();

        $response = $this->patchJson('/api/property-groups/rename', [
            'from' => 'Old Name',
            'to' => 'New Name',
            'object_type' => 'contact',
        ]);

        $this->assertForbidden($response);
    }

    public function test_standard_user_cannot_merge_property_groups(): void
    {
        $this->authenticateAsStandardUser();

        $response = $this->postJson('/api/property-groups/merge', [
            'source' => 'Group A',
            'target' => 'Group B',
            'object_type' => 'contact',
        ]);

        $this->assertForbidden($response);
    }

    public function test_standard_user_cannot_delete_property_group(): void
    {
        $this->authenticateAsStandardUser();

        $response = $this->deleteJson('/api/property-groups/SomeGroup?object_type=contact');

        $this->assertForbidden($response);
    }

    public function test_owner_can_create_property_group(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/property-groups', [
            'name' => 'Owner Group',
            'object_type' => 'contact',
        ]);

        $response->assertStatus(201);
    }

    public function test_owner_can_rename_property_group(): void
    {
        $this->authenticateAsAdmin();
        Property::factory()->create([
            'workspace_id' => $this->workspace->id,
            'group_name' => 'Old Name',
            'object_type' => 'contact',
        ]);

        $response = $this->patchJson('/api/property-groups/rename', [
            'from' => 'Old Name',
            'to' => 'Renamed',
            'object_type' => 'contact',
        ]);

        $response->assertStatus(200);
    }

    public function test_owner_can_delete_property_group(): void
    {
        $this->authenticateAsAdmin();
        Property::factory()->create([
            'workspace_id' => $this->workspace->id,
            'group_name' => 'ToDelete',
            'object_type' => 'contact',
        ]);

        $response = $this->deleteJson('/api/property-groups/ToDelete?object_type=contact');

        $response->assertStatus(200);
    }

    // ─── Super Admin Bypass ──────────────────────────────────────────

    public function test_super_admin_can_manage_properties(): void
    {
        $superAdmin = User::factory()->superAdmin()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $superAdmin->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Owner',
            'is_active' => true,
        ]);
        \Laravel\Sanctum\Sanctum::actingAs($superAdmin);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->workspace->id);

        $response = $this->postJson('/api/properties', [
            'name' => 'super_admin_prop',
            'label' => 'Super Admin Property',
            'field_type' => 'text',
            'object_type' => 'contact',
        ]);

        $this->assertResourceCreated($response);
    }

    // ─── Unauthenticated ────────────────────────────────────────────

    public function test_unauthenticated_cannot_list_properties(): void
    {
        $response = $this->getJson('/api/properties');

        $this->assertUnauthenticated($response);
    }

    public function test_unauthenticated_cannot_create_property(): void
    {
        $response = $this->postJson('/api/properties', [
            'name' => 'test',
            'label' => 'Test',
            'field_type' => 'text',
            'object_type' => 'contact',
        ]);

        $this->assertUnauthenticated($response);
    }

    public function test_unauthenticated_cannot_list_property_groups(): void
    {
        $response = $this->getJson('/api/property-groups');

        $this->assertUnauthenticated($response);
    }
}
