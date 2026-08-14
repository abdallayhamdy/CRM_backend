<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Stage;
use App\Models\Contact;
use App\Models\ObjectConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\PermissionRegistrar;

class ObjectConfigTest extends TestCase
{
    use RefreshDatabase;

    protected $workspace;
    protected $owner;
    protected $member;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspace = \App\Models\Workspace::factory()->create(['status' => 'active']);

        app(PermissionRegistrar::class)->setPermissionsTeamId($this->workspace->id);
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $this->owner = $this->createUserWithRole('Workspace Owner');
        $this->member = $this->createUserWithRole('Workspace Member');
    }

    protected function createUserWithRole(string $roleName): \App\Models\User
    {
        $user = \App\Models\User::factory()->create([
            'workspace_id' => $this->workspace->id,
            'is_super_admin' => false,
        ]);

        $user->assignRole($roleName);

        $user->workspaces()->attach($this->workspace->id, [
            'role_name' => $roleName,
            'is_active' => true,
        ]);

        return $user;
    }

    protected function as(\App\Models\User $user): self
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->workspace->id);
        Sanctum::actingAs($user);
        return $this;
    }

    protected function stagePayload(array $stages): array
    {
        return [
            'object_type' => 'contact',
            'display_style' => 'colored_badge',
            'lifecycle_stages' => $stages,
        ];
    }

    protected function makeStage(string $id, string $name, string $color, int $order, bool $isDefault = false, bool $isActive = true): array
    {
        return [
            'id' => $id,
            'name' => $name,
            'color' => $color,
            'order' => $order,
            'is_default' => $isDefault,
            'is_active' => $isActive,
            'calculated_props' => true,
            'used_in' => 0,
        ];
    }

    public function test_owner_can_view_object_config(): void
    {
        $this->as($this->owner);

        $response = $this->getJson('/api/settings/object-configs?object_type=contact');

        $response->assertOk();
    }

    public function test_member_cannot_view_object_config(): void
    {
        $this->as($this->member);

        $response = $this->getJson('/api/settings/object-configs?object_type=contact');

        $response->assertStatus(403);
    }

    public function test_member_cannot_update_object_config(): void
    {
        $this->as($this->member);

        $response = $this->putJson('/api/settings/object-configs', $this->stagePayload([
            $this->makeStage('lead', 'Lead', '#ef4444', 0, true),
        ]));

        $response->assertStatus(403);
    }

    public function test_saving_config_creates_stage_rows(): void
    {
        $this->as($this->owner);

        $response = $this->putJson('/api/settings/object-configs', $this->stagePayload([
            $this->makeStage('lead', 'Lead', '#ef4444', 0, true),
            $this->makeStage('opportunity', 'Opportunity', '#f59e0b', 1),
        ]));

        $response->assertOk();

        $this->assertDatabaseHas('stages', [
            'workspace_id' => $this->workspace->id,
            'object_type' => 'contact',
            'slug' => 'lead',
            'name' => 'Lead',
            'order' => 0,
        ]);

        $this->assertDatabaseHas('stages', [
            'workspace_id' => $this->workspace->id,
            'object_type' => 'contact',
            'slug' => 'opportunity',
            'name' => 'Opportunity',
            'order' => 1,
        ]);
    }

    public function test_saving_config_renames_and_reorders_stages(): void
    {
        $this->as($this->owner);

        $this->putJson('/api/settings/object-configs', $this->stagePayload([
            $this->makeStage('lead', 'Lead', '#ef4444', 0, true),
            $this->makeStage('opportunity', 'Opportunity', '#f59e0b', 1),
        ]));

        $this->putJson('/api/settings/object-configs', $this->stagePayload([
            $this->makeStage('lead', 'Prospect', '#3b82f6', 1, true),
            $this->makeStage('opportunity', 'Opportunity', '#f59e0b', 0),
        ]));

        $this->assertDatabaseHas('stages', [
            'workspace_id' => $this->workspace->id,
            'object_type' => 'contact',
            'slug' => 'lead',
            'name' => 'Prospect',
            'color' => '#3b82f6',
            'order' => 1,
        ]);

        $this->assertDatabaseHas('stages', [
            'workspace_id' => $this->workspace->id,
            'object_type' => 'contact',
            'slug' => 'opportunity',
            'order' => 0,
        ]);
    }

    public function test_saving_config_deletes_removed_stages_and_cleans_assignments(): void
    {
        $this->as($this->owner);

        $this->putJson('/api/settings/object-configs', $this->stagePayload([
            $this->makeStage('lead', 'Lead', '#ef4444', 0, true),
            $this->makeStage('opportunity', 'Opportunity', '#f59e0b', 1),
        ]));

        $leadStageId = Stage::where('workspace_id', $this->workspace->id)
            ->where('object_type', 'contact')
            ->where('slug', 'lead')
            ->value('id');

        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'stage_id' => $leadStageId,
        ]);

        $this->putJson('/api/settings/object-configs', $this->stagePayload([
            $this->makeStage('opportunity', 'Opportunity', '#f59e0b', 0),
        ]));

        $this->assertDatabaseMissing('stages', [
            'workspace_id' => $this->workspace->id,
            'object_type' => 'contact',
            'slug' => 'lead',
        ]);

        $this->assertNull($contact->fresh()->stage_id);
    }

    public function test_new_stage_can_be_assigned_to_contact(): void
    {
        $this->as($this->owner);

        $this->putJson('/api/settings/object-configs', $this->stagePayload([
            $this->makeStage('lead', 'Lead', '#ef4444', 0, true),
            $this->makeStage('hotlead', 'Hot Lead', '#8b5cf6', 1),
        ]));

        $response = $this->postJson('/api/contacts', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@test.com',
            'lifecycle_stage' => 'hotlead',
        ]);

        $response->assertStatus(201);

        $stageId = Stage::where('workspace_id', $this->workspace->id)
            ->where('object_type', 'contact')
            ->where('slug', 'hotlead')
            ->value('id');

        $this->assertNotNull($stageId);

        $this->assertDatabaseHas('contacts', [
            'email' => 'john@test.com',
            'workspace_id' => $this->workspace->id,
            'stage_id' => $stageId,
        ]);
    }

    public function test_saving_company_config_syncs_company_stages(): void
    {
        $this->as($this->owner);

        $response = $this->putJson('/api/settings/object-configs', [
            'object_type' => 'company',
            'display_style' => 'colored_badge',
            'lifecycle_stages' => [
                $this->makeStage('lead', 'Lead', '#3b82f6', 0, true),
                $this->makeStage('churned', 'Churned', '#ef4444', 1),
            ],
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('stages', [
            'workspace_id' => $this->workspace->id,
            'object_type' => 'company',
            'slug' => 'churned',
            'name' => 'Churned',
        ]);
    }

    public function test_saved_config_is_returned_on_get(): void
    {
        $this->as($this->owner);

        $this->putJson('/api/settings/object-configs', $this->stagePayload([
            $this->makeStage('lead', 'Lead', '#ef4444', 0, true),
            $this->makeStage('hotlead', 'Hot Lead', '#8b5cf6', 1),
        ]));

        $response = $this->getJson('/api/settings/object-configs?object_type=contact');

        $response->assertOk()
            ->assertJsonCount(2, 'lifecycle_stages')
            ->assertJsonFragment(['id' => 'hotlead']);
    }
}
