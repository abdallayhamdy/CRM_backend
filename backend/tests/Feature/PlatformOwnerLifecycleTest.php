<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlatformOwnerLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function createUser(array $overrides = []): User
    {
        $user = User::create(array_merge([
            'name' => 'Test User',
            'email' => fake()->unique()->safeEmail(),
            'password' => 'password',
        ], $overrides));
        $user->forceFill(['is_super_admin' => true])->save();
        return $user;
    }

    public function test_platform_owner_can_terminate_self_with_correct_password(): void
    {
        $user = $this->createUser(['email' => 'admin@test.com']);
        $this->createUser(['email' => 'other-admin@test.com']);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/super-admin/platform-owners/terminate-self', [
                'password' => 'password',
            ]);

        $response->assertOk()->assertJson([
            'message' => 'Platform Owner account terminated successfully. You can be restored via artisan command.',
        ]);

        $user->refresh();
        $this->assertFalse($user->is_super_admin);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_platform_owner_cannot_terminate_with_wrong_password(): void
    {
        $user = $this->createUser();
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/super-admin/platform-owners/terminate-self', [
                'password' => 'wrong-password',
            ]);

        $response->assertStatus(422)->assertJson([
            'message' => 'The provided password is incorrect.',
        ]);

        $user->refresh();
        $this->assertTrue($user->is_super_admin);
    }

    public function test_platform_owner_cannot_terminate_without_password(): void
    {
        $user = $this->createUser();
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/super-admin/platform-owners/terminate-self', []);

        $response->assertStatus(422);
    }

    public function test_last_platform_owner_cannot_terminate(): void
    {
        $user = $this->createUser();
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/super-admin/platform-owners/terminate-self', [
                'password' => 'password',
            ]);

        $response->assertStatus(403)->assertJson([
            'message' => 'Cannot terminate the last active Platform Owner. Create another one first.',
        ]);

        $user->refresh();
        $this->assertTrue($user->is_super_admin);
    }

    public function test_terminated_platform_owner_can_be_restored(): void
    {
        $user = $this->createUser(['email' => 'restore@test.com']);
        $token = $user->createToken('test-token', ['*'])->plainTextToken;

        $this->createUser();

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/super-admin/platform-owners/terminate-self', [
                'password' => 'password',
            ]);

        $response->assertOk();

        $user->refresh();
        $this->assertFalse($user->is_super_admin);

        $user->forceFill(['is_super_admin' => true])->save();

        $user->refresh();
        $this->assertTrue($user->is_super_admin);
    }
}
