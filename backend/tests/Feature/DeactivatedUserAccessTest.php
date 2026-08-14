<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workspace;
use Database\Seeders\RolesAndPermissionsSeeder;
use Spatie\Permission\PermissionRegistrar;
use Laravel\Sanctum\Sanctum;

class DeactivatedUserAccessTest extends TestCase
{
    use \Illuminate\Foundation\Testing\RefreshDatabase;

    public function test_deactivated_user_is_blocked_by_middleware(): void
    {
        $workspace = Workspace::factory()->create();
        $user = User::factory()->create([
            'workspace_id' => $workspace->id,
        ]);

        app(PermissionRegistrar::class)->setPermissionsTeamId($workspace->id);
        $this->seed(RolesAndPermissionsSeeder::class);
        $user->assignRole('Workspace Member');

        $user->workspaces()->attach($workspace->id, [
            'role_name' => 'Workspace Member',
            'is_active' => false,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/workspace/members');

        $response->assertStatus(403);
    }

    public function test_active_user_passes_middleware(): void
    {
        $workspace = Workspace::factory()->create();
        $user = User::factory()->create([
            'workspace_id' => $workspace->id,
        ]);

        app(PermissionRegistrar::class)->setPermissionsTeamId($workspace->id);
        $this->seed(RolesAndPermissionsSeeder::class);
        $user->assignRole('Workspace Owner');

        $user->workspaces()->attach($workspace->id, [
            'role_name' => 'Workspace Owner',
            'is_active' => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/workspace/members');

        $response->assertStatus(200);
    }
}
