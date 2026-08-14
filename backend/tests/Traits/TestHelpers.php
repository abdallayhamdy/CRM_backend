<?php

namespace Tests\Traits;

use App\Models\User;
use App\Models\Workspace;
use Database\Seeders\RolesAndPermissionsSeeder;
use Spatie\Permission\PermissionRegistrar;

trait TestHelpers
{
    protected ?User $adminUser = null;
    protected ?User $standardUser = null;
    protected ?Workspace $workspace = null;

    protected function setUpWorkspace(): void
    {
        $this->workspace = Workspace::factory()->create();

        $this->adminUser = User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $this->standardUser = User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        app(PermissionRegistrar::class)->setPermissionsTeamId($this->workspace->id);
        $this->seed(RolesAndPermissionsSeeder::class);

        $this->adminUser->assignRole('Workspace Owner');
        $this->standardUser->assignRole('Workspace Member');

        $this->adminUser->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Owner',
            'is_active' => true,
        ]);
        $this->standardUser->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Member',
            'is_active' => true,
        ]);
    }

    protected function authenticateAsAdmin(): void
    {
        if (!$this->adminUser) {
            $this->setUpWorkspace();
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($this->workspace->id);
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
    }

    protected function authenticateAsStandardUser(): void
    {
        if (!$this->standardUser) {
            $this->setUpWorkspace();
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($this->workspace->id);
        \Laravel\Sanctum\Sanctum::actingAs($this->standardUser);
    }

    protected function authenticateAsSuperAdmin(): void
    {
        $user = User::factory()->superAdmin()->create();
        \Laravel\Sanctum\Sanctum::actingAs($user);
    }

    protected function assertResourceCreated($response): void
    {
        $response->assertStatus(201);
    }

    protected function assertResourceShown($response): void
    {
        $response->assertStatus(200);
    }

    protected function assertResourceUpdated($response): void
    {
        $response->assertStatus(200);
    }

    protected function assertResourceDeleted($response): void
    {
        $response->assertStatus(200);
    }

    protected function assertValidationError($response): void
    {
        $response->assertStatus(422);
    }

    protected function assertForbidden($response): void
    {
        $response->assertStatus(403);
    }

    protected function assertNotFound($response): void
    {
        $response->assertStatus(404);
    }

    protected function assertUnauthenticated($response): void
    {
        $response->assertStatus(401);
    }
}
