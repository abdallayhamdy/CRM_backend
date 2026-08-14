<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class TokenLifecycleTest extends TestCase
{
    private function makeLoginableUser(): array
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

        return [$workspace, $user];
    }

    public function test_login_issues_token_with_explicit_expiry(): void
    {
        [, $user] = $this->makeLoginableUser();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['data' => ['token', 'expires_at']]);

        $this->assertDatabaseHas('personal_access_tokens', ['tokenable_id' => $user->id]);

        $token = DB::table('personal_access_tokens')->where('tokenable_id', $user->id)->first();
        $this->assertNotNull($token->expires_at);
    }

    public function test_logging_in_revokes_previous_tokens(): void
    {
        [, $user] = $this->makeLoginableUser();
        $user->createToken('old-token');

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertStatus(200);

        $this->assertDatabaseCount('personal_access_tokens', 1);
        $this->assertDatabaseMissing('personal_access_tokens', ['name' => 'old-token']);
    }

    public function test_login_preserves_active_impersonation_tokens(): void
    {
        [, $user] = $this->makeLoginableUser();

        $impersonation = $user->createToken('impersonation-admin', ['impersonate'], now()->addMinutes(30));
        DB::table('personal_access_tokens')
            ->where('id', $impersonation->accessToken->id)
            ->update(['is_impersonation' => true]);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertStatus(200);

        $this->assertDatabaseHas('personal_access_tokens', [
            'id' => $impersonation->accessToken->id,
            'is_impersonation' => true,
        ]);
        $this->assertDatabaseCount('personal_access_tokens', 2);
    }

    public function test_password_reset_revokes_all_tokens(): void
    {
        [, $user] = $this->makeLoginableUser();
        $user->createToken('auth_token');

        $resetToken = Password::broker()->createToken($user);

        $response = $this->postJson('/api/reset-password', [
            'token' => $resetToken,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
    }
}
