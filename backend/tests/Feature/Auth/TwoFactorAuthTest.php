<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use App\Mail\TwoFactorCodeMail;
use App\Models\PlatformSettings;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class TwoFactorAuthTest extends TestCase
{
    private function createActiveUser(): User
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

        return $user;
    }

    private function enableTwoFactor(): void
    {
        PlatformSettings::instance()->update(['two_factor_required' => true]);
    }

    public function test_login_issues_token_immediately_when_two_factor_disabled(): void
    {
        $user = $this->createActiveUser();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.token', fn ($token) => is_string($token) && $token !== '');
        $response->assertJsonMissingPath('data.two_factor_required');
    }

    public function test_login_requires_code_when_two_factor_enabled(): void
    {
        Mail::fake();
        $user = $this->createActiveUser();
        $this->enableTwoFactor();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.two_factor_required', true);
        $response->assertJsonMissingPath('data.token');
        $this->assertDatabaseCount('personal_access_tokens', 0);
        Mail::assertSent(TwoFactorCodeMail::class, function (TwoFactorCodeMail $mail) use ($user) {
            return $mail->hasTo($user->email);
        });
        $this->assertNotNull(Cache::get('two_factor_code:'.$user->id));
    }

    public function test_two_factor_verification_succeeds(): void
    {
        Mail::fake();
        $user = $this->createActiveUser();
        $this->enableTwoFactor();

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertStatus(200);

        $code = Cache::get('two_factor_code:'.$user->id)['code'];

        $response = $this->postJson('/api/auth/2fa/verify', [
            'email' => $user->email,
            'code' => $code,
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => ['user', 'token'],
        ]);
        $response->assertJson(['status' => 'success']);
        $this->assertDatabaseCount('personal_access_tokens', 1);
        $this->assertNull(Cache::get('two_factor_code:'.$user->id));
    }

    public function test_two_factor_verification_rejects_wrong_code(): void
    {
        Mail::fake();
        $user = $this->createActiveUser();
        $this->enableTwoFactor();

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertStatus(200);

        $response = $this->postJson('/api/auth/2fa/verify', [
            'email' => $user->email,
            'code' => '000000',
        ]);

        $response->assertStatus(401);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_two_factor_verification_rejects_unknown_email(): void
    {
        $response = $this->postJson('/api/auth/2fa/verify', [
            'email' => 'nobody@test.com',
            'code' => '123456',
        ]);

        $response->assertStatus(401);
    }

    public function test_two_factor_verification_rejects_expired_code(): void
    {
        Mail::fake();
        $user = $this->createActiveUser();
        $this->enableTwoFactor();

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertStatus(200);

        Cache::forget('two_factor_code:'.$user->id);

        $response = $this->postJson('/api/auth/2fa/verify', [
            'email' => $user->email,
            'code' => '123456',
        ]);

        $response->assertStatus(401);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_two_factor_verification_requires_code(): void
    {
        $user = $this->createActiveUser();

        $response = $this->postJson('/api/auth/2fa/verify', [
            'email' => $user->email,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['code']);
    }

    public function test_two_factor_verify_throttled_after_five_attempts(): void
    {
        $user = $this->createActiveUser();

        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/auth/2fa/verify', [
                'email' => $user->email,
                'code' => '000000',
            ]);
            $response->assertStatus(401);
        }

        $response = $this->postJson('/api/auth/2fa/verify', [
            'email' => $user->email,
            'code' => '000000',
        ]);

        $response->assertStatus(429);
    }
}
