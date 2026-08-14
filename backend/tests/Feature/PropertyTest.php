<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Property;
use App\Models\AuditLog;

class PropertyTest extends TestCase
{
    use TestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpWorkspace();
    }

    public function test_admin_can_list_properties(): void
    {
        $this->authenticateAsAdmin();
        Property::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/properties');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'properties' => [],
                'meta' => ['totalPages', 'total'],
            ],
        ]);
    }

    public function test_list_filters_by_object_type(): void
    {
        $this->authenticateAsAdmin();
        Property::factory()->create([
            'workspace_id' => $this->workspace->id,
            'object_type' => 'contact',
        ]);
        Property::factory()->create([
            'workspace_id' => $this->workspace->id,
            'object_type' => 'deal',
        ]);

        $response = $this->getJson('/api/properties?object_type=deal');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.properties'));
    }

    public function test_admin_can_create_property(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/properties', [
            'name' => 'test_property',
            'label' => 'Test Property',
            'field_type' => 'single_line_text',
            'object_type' => 'contact',
        ]);

        $this->assertResourceCreated($response);
        $this->assertDatabaseHas('properties', [
            'name' => 'test_property',
            'label' => 'Test Property',
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_create_creates_audit_log(): void
    {
        $this->authenticateAsAdmin();

        $this->postJson('/api/properties', [
            'name' => 'audited_property',
            'label' => 'Audited Property',
            'field_type' => 'number',
            'object_type' => 'deal',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
            'action' => 'created',
            'category' => 'properties',
            'subcategory' => 'deal',
        ]);
    }

    public function test_admin_can_show_property(): void
    {
        $this->authenticateAsAdmin();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/properties/' . $property->id);

        $this->assertResourceShown($response);
        $response->assertJsonPath('data.id', $property->id);
    }

    public function test_admin_can_update_property(): void
    {
        $this->authenticateAsAdmin();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->patchJson('/api/properties/' . $property->id, [
            'label' => 'Updated Label',
        ]);

        $this->assertResourceUpdated($response);
        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'label' => 'Updated Label',
        ]);
    }

    public function test_update_creates_audit_log(): void
    {
        $this->authenticateAsAdmin();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $this->patchJson('/api/properties/' . $property->id, [
            'label' => 'Audited Update',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
            'action' => 'updated',
            'category' => 'properties',
        ]);
    }

    public function test_admin_can_archive_property(): void
    {
        $this->authenticateAsAdmin();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->deleteJson('/api/properties/' . $property->id);

        $this->assertResourceDeleted($response);
        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'is_archived' => true,
        ]);
    }

    public function test_archive_creates_audit_log(): void
    {
        $this->authenticateAsAdmin();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $this->deleteJson('/api/properties/' . $property->id);

        $this->assertDatabaseHas('audit_logs', [
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
            'action' => 'archived',
            'category' => 'properties',
        ]);
    }

    public function test_admin_can_restore_archived_property(): void
    {
        $this->authenticateAsAdmin();
        $property = Property::factory()->create([
            'workspace_id' => $this->workspace->id,
            'is_archived' => true,
        ]);

        $response = $this->patchJson('/api/properties/' . $property->id, [
            'restore' => true,
        ]);

        $this->assertResourceUpdated($response);
        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'is_archived' => false,
        ]);
    }

    public function test_create_property_requires_name(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/properties', []);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_unauthenticated_user_cannot_access_properties(): void
    {
        $response = $this->getJson('/api/properties');

        $this->assertUnauthenticated($response);
    }

    public function test_user_cannot_view_another_workspace_property(): void
    {
        $this->authenticateAsAdmin();
        $otherProperty = Property::factory()->create();

        $response = $this->getJson('/api/properties/' . $otherProperty->id);

        $this->assertNotFound($response);
    }

    public function test_list_paginates(): void
    {
        $this->authenticateAsAdmin();
        Property::factory()->count(15)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/properties?limit=5');

        $response->assertStatus(200);
        $this->assertCount(5, $response->json('data.properties'));
        $this->assertEquals(3, $response->json('data.meta.totalPages'));
    }

    public function test_list_searches_by_label(): void
    {
        $this->authenticateAsAdmin();
        Property::factory()->create([
            'workspace_id' => $this->workspace->id,
            'label' => 'Special Widget',
        ]);
        Property::factory()->create([
            'workspace_id' => $this->workspace->id,
            'label' => 'Other Thing',
        ]);

        $response = $this->getJson('/api/properties?search=Special');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.properties'));
    }

    public function test_counts_only_returns_counts(): void
    {
        $this->authenticateAsAdmin();
        Property::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
            'object_type' => 'contact',
            'is_archived' => false,
        ]);
        Property::factory()->create([
            'workspace_id' => $this->workspace->id,
            'object_type' => 'contact',
            'is_archived' => true,
        ]);

        $response = $this->getJson('/api/properties?object_type=contact&counts_only=true');

        $response->assertStatus(200);
        $response->assertJson([
            'data' => [
                'activeCount' => 3,
                'archivedCount' => 1,
            ],
        ]);
    }
}
