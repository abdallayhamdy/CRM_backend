<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use App\Models\PlatformSettings;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\Hash;

class IpWhitelistTest extends TestCase
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

    private function enableWhitelist(array $ips): void
    {
        PlatformSettings::instance()->update([
            'ip_whitelist_enabled' => true,
            'whitelisted_ips' => $ips,
        ]);
    }

    public function test_login_allowed_when_whitelist_disabled(): void
    {
        $user = $this->createActiveUser();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.token', fn ($token) => is_string($token) && $token !== '');
    }

    public function test_login_blocked_from_non_whitelisted_ip(): void
    {
        $user = $this->createActiveUser();
        $this->enableWhitelist(['10.0.0.0/8']);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(403);
        $response->assertJson(['status' => 'error']);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_login_allowed_from_exact_whitelisted_ip(): void
    {
        $user = $this->createActiveUser();
        $this->enableWhitelist(['127.0.0.1']);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(200);
    }

    public function test_cidr_whitelist_allows_ip_inside_range(): void
    {
        $user = $this->createActiveUser();
        $this->enableWhitelist(['10.0.0.0/8']);

        $response = $this->withServerVariables(['REMOTE_ADDR' => '10.4.5.6'])
            ->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $response->assertStatus(200);
    }

    public function test_cidr_whitelist_blocks_ip_outside_range(): void
    {
        $user = $this->createActiveUser();
        $this->enableWhitelist(['10.0.0.0/8']);

        $response = $this->withServerVariables(['REMOTE_ADDR' => '192.168.1.5'])
            ->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $response->assertStatus(403);
    }

    public function test_whitelist_enabled_with_empty_list_blocks_all(): void
    {
        $user = $this->createActiveUser();
        $this->enableWhitelist([]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(403);
    }

    public function test_whitelist_blocks_authenticated_requests_too(): void
    {
        $this->enableWhitelist(['10.0.0.0/8']);

        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(403);
    }

    public function test_invalid_cidr_never_matches(): void
    {
        $user = $this->createActiveUser();
        $this->enableWhitelist(['10.0.0.0/33', 'not-an-ip']);

        $response = $this->withServerVariables(['REMOTE_ADDR' => '10.4.5.6'])
            ->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $response->assertStatus(403);
    }

    public function test_login_allowed_from_exact_whitelisted_ipv6(): void
    {
        $user = $this->createActiveUser();
        $this->enableWhitelist(['2001:db8::1']);

        $response = $this->withServerVariables(['REMOTE_ADDR' => '2001:db8::1'])
            ->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $response->assertStatus(200);
    }

    public function test_ipv6_cidr_whitelist_allows_ip_inside_range(): void
    {
        $user = $this->createActiveUser();
        $this->enableWhitelist(['2001:db8::/32']);

        $response = $this->withServerVariables(['REMOTE_ADDR' => '2001:db8:abcd:1234::1'])
            ->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $response->assertStatus(200);
    }

    public function test_ipv6_cidr_whitelist_blocks_ip_outside_range(): void
    {
        $user = $this->createActiveUser();
        $this->enableWhitelist(['2001:db8::/32']);

        $response = $this->withServerVariables(['REMOTE_ADDR' => '2001:db9::1'])
            ->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $response->assertStatus(403);
    }

    public function test_ipv6_mapped_ipv4_matches_ipv4_entry(): void
    {
        $user = $this->createActiveUser();
        $this->enableWhitelist(['10.0.0.0/8']);

        $response = $this->withServerVariables(['REMOTE_ADDR' => '::ffff:10.4.5.6'])
            ->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $response->assertStatus(200);
    }

    public function test_invalid_ipv6_cidr_never_matches(): void
    {
        $user = $this->createActiveUser();
        $this->enableWhitelist(['2001:db8::/129']);

        $response = $this->withServerVariables(['REMOTE_ADDR' => '2001:db8::1'])
            ->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $response->assertStatus(403);
    }
}
