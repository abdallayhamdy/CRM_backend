<?php

namespace Tests\Feature;

use App\Models\Contact;
use App\Models\Company;
use App\Models\Deal;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ImpersonationDataAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
    }

    public function test_impersonated_user_can_see_crm_data_in_target_workspace(): void
    {
        $workspace = Workspace::factory()->create(['name' => 'Acme Corp']);

        $user = User::factory()->create(['workspace_id' => $workspace->id]);
        $user->workspaces()->attach($workspace->id, [
            'role_name' => 'Workspace Admin',
            'is_active' => true,
        ]);

        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($workspace->id);
        $user->assignRole('Workspace Admin');

        Contact::factory()->count(5)->create(['workspace_id' => $workspace->id]);
        Company::factory()->count(3)->create(['workspace_id' => $workspace->id]);
        Deal::factory()->count(4)->create(['workspace_id' => $workspace->id]);

        $admin = User::factory()->superAdmin()->create();
        $adminToken = $admin->createToken('admin-token')->plainTextToken;

        $impersonateResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $adminToken,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])->postJson('/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ]);

        $impersonateResponse->assertStatus(201);
        $impersonationToken = $impersonateResponse->json('data.token');
        $targetWorkspaceId = $impersonateResponse->json('data.workspace.id');

        $this->assertNotNull($impersonationToken);
        $this->assertEquals($workspace->id, $targetWorkspaceId);

        $this->app['auth']->forgetGuards();

        $meResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $impersonationToken,
            'X-Workspace-Id' => $targetWorkspaceId,
            'Accept' => 'application/json',
        ])->getJson('/api/auth/me');

        $meResponse->assertStatus(200);
        $meResponse->assertJsonPath('data.id', $user->id);
        $authWorkspaceId = $meResponse->json('data.workspace_id');

        $this->app['auth']->forgetGuards();

        $contactsResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $impersonationToken,
            'X-Workspace-Id' => $targetWorkspaceId,
            'Accept' => 'application/json',
        ])->getJson('/api/contacts');

        $this->app['auth']->forgetGuards();

        $companiesResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $impersonationToken,
            'X-Workspace-Id' => $targetWorkspaceId,
            'Accept' => 'application/json',
        ])->getJson('/api/companies');

        $this->app['auth']->forgetGuards();

        $dealsResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $impersonationToken,
            'X-Workspace-Id' => $targetWorkspaceId,
            'Accept' => 'application/json',
        ])->getJson('/api/deals');

        $contactCount = count($contactsResponse->json('data', []));
        $companyCount = count($companiesResponse->json('data', []));
        $dealCount = count($dealsResponse->json('data', []));

        $this->assertEquals($workspace->id, $authWorkspaceId, 'auth/me must return the target workspace_id');
        $this->assertEquals(5, $contactCount, 'Impersonated user must see 5 contacts');
        $this->assertEquals(3, $companyCount, 'Impersonated user must see 3 companies');
        $this->assertEquals(4, $dealCount, 'Impersonated user must see 4 deals');
    }

    public function test_impersonated_user_rejected_when_x_workspace_header_is_wrong(): void
    {
        $workspace = Workspace::factory()->create();
        $wrongWorkspace = Workspace::factory()->create();

        $user = User::factory()->create(['workspace_id' => $workspace->id]);
        $user->workspaces()->attach($workspace->id, [
            'role_name' => 'Workspace Admin',
            'is_active' => true,
        ]);

        $admin = User::factory()->superAdmin()->create();
        $adminToken = $admin->createToken('admin-token')->plainTextToken;

        $impersonateResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $adminToken,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])->postJson('/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ])->assertStatus(201);

        $impersonationToken = $impersonateResponse->json('data.token');

        $this->app['auth']->forgetGuards();

        $contactsResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $impersonationToken,
            'X-Workspace-Id' => $wrongWorkspace->id,
            'Accept' => 'application/json',
        ])->getJson('/api/contacts');

        $this->assertEquals(403, $contactsResponse->status(), 'Should return 403 for wrong workspace');
    }

    public function test_impersonated_user_falls_back_to_own_workspace_without_header(): void
    {
        $workspace = Workspace::factory()->create();

        $user = User::factory()->create(['workspace_id' => $workspace->id]);
        $user->workspaces()->attach($workspace->id, [
            'role_name' => 'Workspace Admin',
            'is_active' => true,
        ]);

        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($workspace->id);
        $user->assignRole('Workspace Admin');

        Contact::factory()->count(5)->create(['workspace_id' => $workspace->id]);

        $admin = User::factory()->superAdmin()->create();
        $adminToken = $admin->createToken('admin-token')->plainTextToken;

        $impersonateResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $adminToken,
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ])->postJson('/api/super-admin/impersonate', [
            'target_user_id' => $user->id,
            'target_workspace_id' => $workspace->id,
        ])->assertStatus(201);

        $impersonationToken = $impersonateResponse->json('data.token');

        $this->app['auth']->forgetGuards();
        $this->app[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $contactsResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $impersonationToken,
            'Accept' => 'application/json',
        ])->getJson('/api/contacts');

        $this->assertEquals(200, $contactsResponse->status(),
            'Without header, should fall back to user workspace_id. Response: ' . $contactsResponse->content());
        $this->assertEquals(5, count($contactsResponse->json('data', [])),
            'Should see contacts from own workspace');
    }
}
