<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Team;
use App\Models\User;

class TeamTest extends TestCase
{
    use TestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpWorkspace();
        $this->adminUser->syncRoles('Workspace Owner');
        $this->standardUser->syncRoles('Workspace Member');
    }

    public function test_admin_can_list_teams(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        Team::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/teams');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
    }

    public function test_standard_user_cannot_list_teams(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->standardUser);

        $response = $this->getJson('/api/teams');

        $response->assertStatus(403);
    }

    public function test_admin_can_create_team(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);

        $response = $this->postJson('/api/teams', [
            'name' => 'Engineering',
            'description' => 'Backend and frontend engineers',
        ]);

        $response->assertStatus(201);
        $response->assertJsonFragment(['name' => 'Engineering']);
        $this->assertDatabaseHas('teams', [
            'name' => 'Engineering',
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_create_team_requires_name(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);

        $response = $this->postJson('/api/teams', []);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_create_team_validates_name_max_length(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);

        $response = $this->postJson('/api/teams', [
            'name' => str_repeat('a', 256),
        ]);

        $this->assertValidationError($response);
    }

    public function test_admin_can_update_team(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $team = Team::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->putJson("/api/teams/{$team->id}", [
            'name' => 'Updated Team',
            'description' => 'Updated description',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'Updated Team']);
        $this->assertDatabaseHas('teams', [
            'id' => $team->id,
            'name' => 'Updated Team',
        ]);
    }

    public function test_admin_can_delete_team(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $team = Team::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->deleteJson("/api/teams/{$team->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('teams', ['id' => $team->id]);
    }

    public function test_standard_user_cannot_create_team(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->standardUser);

        $response = $this->postJson('/api/teams', [
            'name' => 'Should Fail',
        ]);

        $response->assertStatus(403);
    }

    public function test_standard_user_cannot_update_team(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->standardUser);
        $team = Team::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->putJson("/api/teams/{$team->id}", [
            'name' => 'Should Fail',
        ]);

        $response->assertStatus(403);
    }

    public function test_standard_user_cannot_delete_team(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->standardUser);
        $team = Team::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->deleteJson("/api/teams/{$team->id}");

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_access_teams(): void
    {
        $response = $this->getJson('/api/teams');

        $response->assertStatus(401);
    }

    public function test_list_teams_includes_member_count(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $team = Team::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $user = User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $team->users()->attach($user->id);

        $response = $this->getJson('/api/teams');

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'id' => $team->id,
            'member_count' => 1,
        ]);
    }

    public function test_teams_are_workspace_scoped(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $otherWorkspace = \App\Models\Workspace::factory()->create();
        Team::factory()->create(['workspace_id' => $this->workspace->id]);
        Team::factory()->create(['workspace_id' => $otherWorkspace->id]);

        $response = $this->getJson('/api/teams');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
    }

    public function test_admin_can_view_single_team(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
        $team = Team::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson("/api/teams/{$team->id}");

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $team->id]);
    }

    public function test_create_team_with_description(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);

        $response = $this->postJson('/api/teams', [
            'name' => 'Design Team',
            'description' => 'UI/UX designers',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('teams', [
            'name' => 'Design Team',
            'description' => 'UI/UX designers',
        ]);
    }

    public function test_create_team_with_null_description(): void
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);

        $response = $this->postJson('/api/teams', [
            'name' => 'QA Team',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('teams', [
            'name' => 'QA Team',
            'description' => null,
        ]);
    }
}
