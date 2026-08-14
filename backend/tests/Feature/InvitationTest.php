<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use App\Mail\InvitationMail;

class InvitationTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_list_roles(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/roles');

        $response->assertStatus(200);
    }

    public function test_admin_can_create_invitation(): void
    {
        Mail::fake();
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/invitations', [
            'email' => 'invited@test.com',
            'role_name' => 'Workspace Member',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('invitations', [
            'email' => 'invited@test.com',
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_create_invitation_requires_email(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/invitations', []);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_create_invitation_invalid_email(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/invitations', [
            'email' => 'not-an-email',
            'role_name' => 'Workspace Member',
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_cannot_invite_existing_user(): void
    {
        $this->authenticateAsAdmin();
        User::factory()->create(['email' => 'existing@test.com']);

        $response = $this->postJson('/api/invitations', [
            'email' => 'existing@test.com',
            'role_name' => 'Workspace Member',
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_cannot_invite_already_invited_email(): void
    {
        $this->authenticateAsAdmin();
        Invitation::factory()->create([
            'workspace_id' => $this->workspace->id,
            'email' => 'invited@test.com',
        ]);

        $response = $this->postJson('/api/invitations', [
            'email' => 'invited@test.com',
            'role_name' => 'Workspace Member',
        ]);

        $this->assertValidationError($response);
    }

    public function test_accept_invitation_with_valid_token(): void
    {
        $invitation = Invitation::factory()->create([
            'expires_at' => now()->addDays(7),
        ]);

        $workspace = $invitation->workspace;
        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($workspace->id);
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $response = $this->postJson('/api/invitations/accept', [
            'token' => $invitation->token,
            'name' => 'New User',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'success']);
        $this->assertDatabaseHas('users', [
            'email' => $invitation->email,
            'name' => 'New User',
        ]);
    }

    public function test_accept_invitation_preserves_role_name_on_pivot(): void
    {
        $invitation = Invitation::factory()->create([
            'role_name' => 'Workspace Admin',
            'expires_at' => now()->addDays(7),
        ]);

        $workspace = $invitation->workspace;
        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($workspace->id);
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

        $response = $this->postJson('/api/invitations/accept', [
            'token' => $invitation->token,
            'name' => 'New Admin',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('workspace_user', [
            'workspace_id' => $invitation->workspace_id,
            'role_name' => 'Workspace Admin',
            'is_active' => true,
        ]);

        $user = User::where('email', $invitation->email)->first();
        $this->assertTrue($user->hasRole('Workspace Admin'));

        $this->assertDatabaseMissing('invitations', ['token' => $invitation->token]);
    }

    public function test_owner_can_invite_another_owner(): void
    {
        Mail::fake();
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/invitations', [
            'email' => 'coowner@test.com',
            'role_name' => 'Workspace Owner',
        ]);

        $response->assertStatus(201);
    }

    public function test_admin_cannot_invite_with_role_higher_than_own(): void
    {
        $this->authenticateAsAdmin();

        $admin = User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $admin->assignRole('Workspace Admin');
        $admin->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Admin',
            'is_active' => true,
        ]);

        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($this->workspace->id);
        \Laravel\Sanctum\Sanctum::actingAs($admin);

        $response = $this->postJson('/api/invitations', [
            'email' => 'newowner@test.com',
            'role_name' => 'Workspace Owner',
        ]);

        $response->assertStatus(403);
    }

    public function test_accept_invitation_invalid_token(): void
    {
        $response = $this->postJson('/api/invitations/accept', [
            'token' => 'invalid-token',
            'name' => 'New User',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(422);
    }

    public function test_accept_invitation_expired_token(): void
    {
        $invitation = Invitation::factory()->create([
            'expires_at' => now()->subDay(),
        ]);

        $response = $this->postJson('/api/invitations/accept', [
            'token' => $invitation->token,
            'name' => 'New User',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(400);
    }

    public function test_accept_invitation_throttled_after_five_attempts(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/invitations/accept', [
                'token' => 'invalid-token',
                'name' => 'New User',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);
            $response->assertStatus(422);
        }

        $response = $this->postJson('/api/invitations/accept', [
            'token' => 'invalid-token',
            'name' => 'New User',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(429);
    }

    public function test_accept_invitation_requires_password_confirmation(): void
    {
        $invitation = Invitation::factory()->create();

        $response = $this->postJson('/api/invitations/accept', [
            'token' => $invitation->token,
            'name' => 'New User',
            'password' => 'new-password',
            'password_confirmation' => 'wrong',
        ]);

        $response->assertStatus(422);
    }
}
