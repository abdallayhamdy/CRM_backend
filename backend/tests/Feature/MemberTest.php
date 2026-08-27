<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\User;
use App\Models\Workspace;

class MemberTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_list_members(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/workspace/members');

        $response->assertStatus(200);
    }

    public function test_list_members_includes_workspace_users(): void
    {
        $this->authenticateAsAdmin();
        $user = User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $user->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Member',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/workspace/members');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $user->id]);
        $response->assertJsonFragment([
            'id' => $user->id,
            'is_active' => 1,
            'role_name' => 'Workspace Member',
        ]);
    }

    public function test_cannot_list_members_of_another_workspace(): void
    {
        $this->authenticateAsAdmin();
        $otherWorkspace = Workspace::factory()->create();
        $otherUser = User::factory()->create([
            'workspace_id' => $otherWorkspace->id,
        ]);
        $otherUser->workspaces()->attach($otherWorkspace->id, [
            'role_name' => 'Workspace Member',
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/workspace/members');

        $response->assertStatus(200);
        $response->assertJsonMissing(['id' => $otherUser->id]);
    }

    public function test_admin_can_update_member_role(): void
    {
        $this->authenticateAsAdmin();
        $user = User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $user->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Member',
            'is_active' => true,
        ]);

        $response = $this->patchJson('/api/workspace/members/' . $user->id . '/role', [
            'role_name' => 'Workspace Member',
        ]);

        $response->assertStatus(200);
    }

    public function test_update_member_role_validates_role_exists(): void
    {
        $this->authenticateAsAdmin();
        $user = User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $user->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Member',
            'is_active' => true,
        ]);

        $response = $this->patchJson('/api/workspace/members/' . $user->id . '/role', [
            'role_name' => 'Nonexistent Role',
        ]);

        $this->assertValidationError($response);
    }

    // ── Regression: privilege escalation via updateRole ──────────────

    private function createAdminUser(): User
    {
        $admin = User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($this->workspace->id);
        $admin->assignRole('Workspace Admin');
        $admin->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Admin',
            'is_active' => true,
        ]);
        return $admin;
    }

    public function test_workspace_admin_cannot_promote_self_to_workspace_owner(): void
    {
        $this->setUpWorkspace();
        $admin = $this->createAdminUser();
        \Laravel\Sanctum\Sanctum::actingAs($admin);

        $response = $this->patchJson('/api/workspace/members/' . $admin->id . '/role', [
            'role_name' => 'Workspace Owner',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('workspace_user', [
            'user_id' => $admin->id,
            'workspace_id' => $this->workspace->id,
            'role_name' => 'Workspace Admin',
        ]);
    }

    public function test_workspace_admin_cannot_assign_owner_role_to_another_member(): void
    {
        $this->setUpWorkspace();
        $admin = $this->createAdminUser();
        \Laravel\Sanctum\Sanctum::actingAs($admin);

        $member = User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $member->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Member',
            'is_active' => true,
        ]);

        $response = $this->patchJson('/api/workspace/members/' . $member->id . '/role', [
            'role_name' => 'Workspace Owner',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('workspace_user', [
            'user_id' => $member->id,
            'workspace_id' => $this->workspace->id,
            'role_name' => 'Workspace Member',
        ]);
    }

    public function test_workspace_owner_can_promote_member_to_workspace_owner(): void
    {
        $this->authenticateAsAdmin();

        $member = User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $member->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Member',
            'is_active' => true,
        ]);

        $response = $this->patchJson('/api/workspace/members/' . $member->id . '/role', [
            'role_name' => 'Workspace Owner',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('workspace_user', [
            'user_id' => $member->id,
            'workspace_id' => $this->workspace->id,
            'role_name' => 'Workspace Owner',
        ]);
    }

    public function test_workspace_owner_can_demote_another_owner_when_one_remains(): void
    {
        $this->authenticateAsAdmin();

        $secondOwner = User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($this->workspace->id);
        $secondOwner->assignRole('Workspace Owner');
        $secondOwner->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Owner',
            'is_active' => true,
        ]);

        $response = $this->patchJson('/api/workspace/members/' . $secondOwner->id . '/role', [
            'role_name' => 'Workspace Admin',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('workspace_user', [
            'user_id' => $secondOwner->id,
            'workspace_id' => $this->workspace->id,
            'role_name' => 'Workspace Admin',
        ]);
    }

    public function test_owner_cannot_demote_last_workspace_owner(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->patchJson('/api/workspace/members/' . $this->adminUser->id . '/role', [
            'role_name' => 'Workspace Member',
        ]);

        $this->assertForbidden($response);
        $this->assertDatabaseHas('workspace_user', [
            'user_id' => $this->adminUser->id,
            'workspace_id' => $this->workspace->id,
            'role_name' => 'Workspace Owner',
        ]);
    }

    public function test_cannot_update_super_admin_role(): void
    {
        $this->authenticateAsAdmin();
        $superAdmin = User::factory()->superAdmin()->create();

        $response = $this->patchJson('/api/workspace/members/' . $superAdmin->id . '/role', [
            'role_name' => 'Workspace Member',
        ]);

        $this->assertForbidden($response);
    }

    public function test_admin_can_deactivate_member(): void
    {
        $this->authenticateAsAdmin();
        $user = User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $user->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Member',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/workspace/members/' . $user->id . '/deactivate');

        $response->assertStatus(200);
        $this->assertDatabaseHas('workspace_user', [
            'user_id' => $user->id,
            'workspace_id' => $this->workspace->id,
            'is_active' => false,
        ]);
    }

    public function test_cannot_deactivate_last_workspace_owner(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/workspace/members/' . $this->adminUser->id . '/deactivate');

        $this->assertForbidden($response);
    }

    public function test_admin_can_activate_member(): void
    {
        $this->authenticateAsAdmin();
        $user = User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $user->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Member',
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/workspace/members/' . $user->id . '/activate');

        $response->assertStatus(200);
        $this->assertDatabaseHas('workspace_user', [
            'user_id' => $user->id,
            'workspace_id' => $this->workspace->id,
            'is_active' => true,
        ]);
    }

    public function test_admin_can_remove_member(): void
    {
        $this->authenticateAsAdmin();
        $user = User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $user->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Member',
            'is_active' => true,
        ]);

        $response = $this->deleteJson('/api/workspace/members/' . $user->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('workspace_user', [
            'user_id' => $user->id,
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_cannot_remove_last_workspace_owner(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->deleteJson('/api/workspace/members/' . $this->adminUser->id);

        $this->assertForbidden($response);
    }

    public function test_unauthenticated_user_cannot_access_members(): void
    {
        $response = $this->getJson('/api/workspace/members');
        $this->assertUnauthenticated($response);
    }

    public function test_user_without_role_cannot_list_members(): void
    {
        $this->setUpWorkspace();
        $user = User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        \Laravel\Sanctum\Sanctum::actingAs($user);

        $response = $this->getJson('/api/workspace/members');

        $this->assertForbidden($response);
    }

    public function test_cannot_deactivate_member_not_in_workspace(): void
    {
        $this->authenticateAsAdmin();
        $otherUser = User::factory()->create();

        $response = $this->postJson('/api/workspace/members/' . $otherUser->id . '/deactivate');

        $this->assertForbidden($response);
    }

    public function test_cannot_remove_member_not_in_workspace(): void
    {
        $this->authenticateAsAdmin();
        $otherUser = User::factory()->create();

        $response = $this->deleteJson('/api/workspace/members/' . $otherUser->id);

        $this->assertForbidden($response);
    }
}
