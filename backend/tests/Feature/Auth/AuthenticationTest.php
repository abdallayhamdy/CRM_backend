<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\User;
use App\Models\Workspace;
use Database\Seeders\RolesAndPermissionsSeeder;
use Spatie\Permission\PermissionRegistrar;
use Illuminate\Support\Facades\Hash;

class AuthenticationTest extends TestCase
{
    use TestHelpers;

    public function test_login_success(): void
    {
        $workspace = Workspace::factory()->create();
        $user = User::factory()->create([
            'workspace_id' => $workspace->id,
            'password' => Hash::make('password'),
        ]);

        $user->workspaces()->attach($workspace->id, [
            'role_name' => 'Workspace Owner',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => ['user', 'token'],
        ]);
        $response->assertJson(['status' => 'success']);
    }

    public function test_deactivated_user_cannot_login(): void
    {
        $workspace = Workspace::factory()->create();
        $user = User::factory()->create([
            'workspace_id' => $workspace->id,
            'password' => Hash::make('password'),
        ]);

        $user->workspaces()->attach($workspace->id, [
            'role_name' => 'Workspace Member',
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(403);
        $response->assertJson(['status' => 'error']);
    }

    public function test_successful_login_writes_login_audit_log(): void
    {
        $workspace = Workspace::factory()->create();
        $user = User::factory()->create([
            'workspace_id' => $workspace->id,
            'password' => Hash::make('password'),
        ]);

        $user->workspaces()->attach($workspace->id, [
            'role_name' => 'Workspace Owner',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'action' => 'login',
            'category' => 'Login',
            'subcategory' => 'Login Succeeded',
        ]);
    }

    public function test_failed_login_writes_failed_login_audit_log(): void
    {
        $workspace = Workspace::factory()->create();
        $user = User::factory()->create([
            'workspace_id' => $workspace->id,
            'password' => Hash::make('password'),
        ]);

        $user->workspaces()->attach($workspace->id, [
            'role_name' => 'Workspace Owner',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401);

        $this->assertDatabaseHas('audit_logs', [
            'workspace_id' => $workspace->id,
            'action' => 'login',
            'category' => 'Login',
            'subcategory' => 'Login Failed',
        ]);
    }


    public function test_login_with_invalid_credentials(): void
    {
        $workspace = Workspace::factory()->create();
        $user = User::factory()->create([
            'workspace_id' => $workspace->id,
            'password' => Hash::make('password'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401);
        $response->assertJson(['status' => 'error']);
    }

    public function test_login_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'nonexistent@test.com',
            'password' => 'password',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_validation_requires_email(): void
    {
        $response = $this->postJson('/api/login', [
            'password' => 'password',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_login_validation_requires_password(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'test@test.com',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_login_validation_invalid_email_format(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'not-an-email',
            'password' => 'password',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_logout_success(): void
    {
        $workspace = Workspace::factory()->create();
        $user = User::factory()->create([
            'workspace_id' => $workspace->id,
            'password' => Hash::make('password'),
        ]);

        $user->workspaces()->attach($workspace->id, [
            'role_name' => 'Workspace Member',
            'is_active' => true,
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/logout');

        $response->assertStatus(200);
        $response->assertJson(['status' => 'success']);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_logout_unauthenticated(): void
    {
        $response = $this->postJson('/api/logout');

        $this->assertUnauthenticated($response);
    }

    public function test_current_user_authenticated(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => ['id', 'name', 'email', 'workspace_id'],
        ]);
    }

    public function test_current_user_unauthenticated(): void
    {
        $response = $this->getJson('/api/auth/me');

        $this->assertUnauthenticated($response);
    }
}
