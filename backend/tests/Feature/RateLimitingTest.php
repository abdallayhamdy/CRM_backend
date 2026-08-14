<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\Hash;

class RateLimitingTest extends TestCase
{
    public function test_login_throttle_after_5_attempts(): void
    {
        $workspace = Workspace::factory()->create();
        $user = User::factory()->create([
            'workspace_id' => $workspace->id,
            'password' => Hash::make('password'),
        ]);

        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'wrong-password',
            ]);
        }

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(429);
    }

    public function test_forgot_password_throttle_after_3_attempts(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $response = $this->postJson('/api/forgot-password', [
                'email' => 'test@test.com',
            ]);
        }

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'test@test.com',
        ]);

        $response->assertStatus(429);
    }
}
