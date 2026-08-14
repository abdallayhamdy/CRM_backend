<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\PropertyGroup;

class PropertyGroupTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_create_group(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/property-groups', [
            'name' => 'Contact information',
            'object_type' => 'contact',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.name', 'Contact information');

        $this->assertDatabaseHas('property_groups', [
            'workspace_id' => $this->workspace->id,
            'name' => 'Contact information',
            'object_type' => 'contact',
        ]);
    }

    public function test_member_without_manage_properties_cannot_create_group(): void
    {
        $this->authenticateAsStandardUser();

        $response = $this->postJson('/api/property-groups', [
            'name' => 'Contact information',
            'object_type' => 'contact',
        ]);

        $this->assertForbidden($response);
    }

    public function test_index_returns_persisted_groups(): void
    {
        $this->authenticateAsAdmin();

        PropertyGroup::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Contact information',
            'object_type' => 'contact',
        ]);

        $response = $this->getJson('/api/property-groups');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.name', 'Contact information');
    }

    public function test_destroy_deletes_group(): void
    {
        $this->authenticateAsAdmin();

        $group = PropertyGroup::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Temp group',
            'object_type' => 'deal',
        ]);

        $response = $this->deleteJson('/api/property-groups/' . rawurlencode('Temp group') . '?object_type=deal');

        $response->assertStatus(200);
        $this->assertDatabaseMissing('property_groups', ['id' => $group->id]);
    }

    public function test_rename_updates_group(): void
    {
        $this->authenticateAsAdmin();

        PropertyGroup::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Old name',
            'object_type' => 'contact',
        ]);

        $response = $this->patchJson('/api/property-groups/rename', [
            'from' => 'Old name',
            'to' => 'New name',
            'object_type' => 'contact',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('property_groups', [
            'workspace_id' => $this->workspace->id,
            'name' => 'New name',
            'object_type' => 'contact',
        ]);
    }
}
