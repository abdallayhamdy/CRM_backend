<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\AuditLog;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SuperAdminHealthTest extends TestCase
{
    use TestHelpers;

    private function insertJob(string $queue, ?int $reservedAt = null, ?int $attempts = 0): void
    {
        DB::table('jobs')->insert([
            'queue' => $queue,
            'payload' => '{}',
            'attempts' => $attempts,
            'reserved_at' => $reservedAt,
            'available_at' => time(),
            'created_at' => time(),
        ]);
    }

    private function insertFailedJob(string $queue, ?string $exception = null, ?Carbon $failedAt = null): void
    {
        DB::table('failed_jobs')->insert([
            'uuid' => fake()->uuid(),
            'connection' => 'database',
            'queue' => $queue,
            'payload' => '{}',
            'exception' => $exception ?? 'App\Exceptions\JobException: Test failure',
            'failed_at' => $failedAt ?? now(),
        ]);
    }

    // ── GET /health/summary ──────────────────────────────────────

    public function test_super_admin_can_get_health_summary(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/health/summary');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => ['uptime', 'avg_response_ms', 'error_count_24h', 'active_queues'],
        ]);
    }

    public function test_summary_uptime_based_on_audit_log_activity(): void
    {
        $this->authenticateAsSuperAdmin();

        $workspace = \App\Models\Workspace::factory()->create();
        $user = \App\Models\User::factory()->create(['workspace_id' => $workspace->id]);

        AuditLog::factory()->count(3)->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'created_at' => now()->subDays(5),
        ]);

        $response = $this->getJson('/api/super-admin/health/summary');

        $response->assertStatus(200);
        $uptime = $response->json('data.uptime');
        $this->assertIsFloat($uptime);
        $this->assertGreaterThan(0, $uptime);
        $this->assertLessThanOrEqual(100, $uptime);
    }

    public function test_summary_uptime_100_percent_when_no_audit_logs(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/health/summary');

        $response->assertStatus(200);
        $response->assertJsonPath('data.uptime', 100);
    }

    public function test_summary_error_count_from_failed_jobs(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->insertFailedJob('default', 'Exception: Test', now()->subHours(2));
        $this->insertFailedJob('emails', 'Exception: Email failed', now()->subHours(5));

        $response = $this->getJson('/api/super-admin/health/summary');

        $response->assertStatus(200);
        $response->assertJsonPath('data.error_count_24h', 2);
    }

    public function test_summary_excludes_old_failed_jobs(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->insertFailedJob('default', 'Exception: Old', now()->subDays(3));

        $response = $this->getJson('/api/super-admin/health/summary');

        $response->assertStatus(200);
        $response->assertJsonPath('data.error_count_24h', 0);
    }

    public function test_summary_active_queues_from_jobs_table(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->insertJob('default');
        $this->insertJob('emails');
        $this->insertJob('default');

        $response = $this->getJson('/api/super-admin/health/summary');

        $response->assertStatus(200);
        $response->assertJsonPath('data.active_queues', 2);
    }

    public function test_summary_avg_response_ms_is_numeric(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/health/summary');

        $response->assertStatus(200);
        $this->assertIsNumeric($response->json('data.avg_response_ms'));
        $this->assertGreaterThanOrEqual(0, $response->json('data.avg_response_ms'));
    }

    public function test_non_super_admin_cannot_get_health_summary(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/health/summary');

        $response->assertStatus(403);
    }

    // ── GET /health/uptime ───────────────────────────────────────

    public function test_super_admin_can_get_uptime(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/health/uptime');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['date', 'uptime'],
            ],
        ]);
        $this->assertCount(30, $response->json('data'));
    }

    public function test_uptime_shows_100_for_days_with_activity(): void
    {
        $this->authenticateAsSuperAdmin();

        $workspace = \App\Models\Workspace::factory()->create();
        $user = \App\Models\User::factory()->create(['workspace_id' => $workspace->id]);

        AuditLog::factory()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'created_at' => now()->subDays(10)->setTime(14, 30),
        ]);

        $response = $this->getJson('/api/super-admin/health/uptime');

        $response->assertStatus(200);
        $data = $response->json('data');

        $tenDaysAgo = now()->subDays(10)->format('Y-m-d');
        $entry = collect($data)->firstWhere('date', $tenDaysAgo);
        $this->assertNotNull($entry);
        $this->assertEquals(100.0, $entry['uptime']);
    }

    public function test_uptime_shows_0_for_inactive_days(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/health/uptime');

        $response->assertStatus(200);
        $data = $response->json('data');

        $yesterday = now()->subDay()->format('Y-m-d');
        $entry = collect($data)->firstWhere('date', $yesterday);
        $this->assertNotNull($entry);
        $this->assertEquals(0.0, $entry['uptime']);
    }

    public function test_non_super_admin_cannot_get_uptime(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/health/uptime');

        $response->assertStatus(403);
    }

    // ── GET /health/response-times ───────────────────────────────

    public function test_super_admin_can_get_response_times(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/health/response-times');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['hour', 'avg_ms'],
            ],
        ]);
        $this->assertCount(24, $response->json('data'));
    }

    public function test_response_times_are_numeric(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/health/response-times');

        $response->assertStatus(200);
        foreach ($response->json('data') as $entry) {
            $this->assertArrayHasKey('hour', $entry);
            $this->assertArrayHasKey('avg_ms', $entry);
            $this->assertIsNumeric($entry['avg_ms']);
            $this->assertGreaterThanOrEqual(0, $entry['avg_ms']);
        }
    }

    public function test_response_times_hours_are_formatted(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/health/response-times');

        $response->assertStatus(200);
        foreach ($response->json('data') as $entry) {
            $this->assertMatchesRegularExpression('/^\d{2}:\d{2}$/', $entry['hour']);
        }
    }

    public function test_non_super_admin_cannot_get_response_times(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/health/response-times');

        $response->assertStatus(403);
    }

    // ── GET /health/errors ───────────────────────────────────────

    public function test_super_admin_can_get_error_logs(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/health/errors');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['id', 'timestamp', 'level', 'message', 'source'],
            ],
            'meta' => ['page', 'limit', 'total'],
        ]);
    }

    public function test_error_logs_contain_failed_jobs(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->insertFailedJob(
            'default',
            'App\Exceptions\ConnectionException: Connection timed out',
            now()->subHours(3)
        );

        $response = $this->getJson('/api/super-admin/health/errors');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertNotEmpty($data);

        $firstError = $data[0];
        $this->assertEquals('Error', $firstError['level']);
        $this->assertStringContainsString('Connection timed out', $firstError['message']);
        $this->assertEquals('default', $firstError['source']);
    }

    public function test_error_logs_are_ordered_by_most_recent(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->insertFailedJob('queue-a', 'Exception: First', now()->subHours(5));
        $this->insertFailedJob('queue-b', 'Exception: Second', now()->subHours(1));

        $response = $this->getJson('/api/super-admin/health/errors');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(2, $data);
        $this->assertStringContainsString('Second', $data[0]['message']);
        $this->assertStringContainsString('First', $data[1]['message']);
    }

    public function test_error_logs_meta_includes_total(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->insertFailedJob('default');
        $this->insertFailedJob('emails');

        $response = $this->getJson('/api/super-admin/health/errors');

        $response->assertStatus(200);
        $response->assertJsonPath('meta.total', 2);
        $response->assertJsonPath('meta.page', 1);
        $response->assertJsonPath('meta.limit', 50);
    }

    public function test_error_logs_return_empty_when_no_failed_jobs(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/health/errors');

        $response->assertStatus(200);
        $response->assertJsonPath('data', []);
        $response->assertJsonPath('meta.total', 0);
    }

    public function test_non_super_admin_cannot_get_error_logs(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/health/errors');

        $response->assertStatus(403);
    }

    // ── GET /health/queues ───────────────────────────────────────

    public function test_super_admin_can_get_job_queues(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/health/queues');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => ['name', 'pending_count', 'failed_count_24h', 'avg_process_time', 'status'],
            ],
        ]);
    }

    public function test_queues_reflect_pending_jobs(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->insertJob('default');
        $this->insertJob('default');
        $this->insertJob('emails');

        $response = $this->getJson('/api/super-admin/health/queues');

        $response->assertStatus(200);
        $data = $response->json('data');

        $defaultQueue = collect($data)->firstWhere('name', 'default');
        $this->assertNotNull($defaultQueue);
        $this->assertEquals(2, $defaultQueue['pending_count']);

        $emailsQueue = collect($data)->firstWhere('name', 'emails');
        $this->assertNotNull($emailsQueue);
        $this->assertEquals(1, $emailsQueue['pending_count']);
    }

    public function test_queues_reflect_failed_jobs_24h(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->insertFailedJob('default', 'Exception: Fail 1', now()->subHours(2));
        $this->insertFailedJob('default', 'Exception: Fail 2', now()->subHours(5));
        $this->insertFailedJob('emails', 'Exception: Email fail', now()->subHours(1));

        $response = $this->getJson('/api/super-admin/health/queues');

        $response->assertStatus(200);
        $data = $response->json('data');

        $defaultQueue = collect($data)->firstWhere('name', 'default');
        $this->assertEquals(2, $defaultQueue['failed_count_24h']);

        $emailsQueue = collect($data)->firstWhere('name', 'emails');
        $this->assertEquals(1, $emailsQueue['failed_count_24h']);
    }

    public function test_queue_status_failing_when_errors(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->insertFailedJob('default');

        $response = $this->getJson('/api/super-admin/health/queues');

        $response->assertStatus(200);
        $defaultQueue = collect($response->json('data'))->firstWhere('name', 'default');
        $this->assertEquals('Failing', $defaultQueue['status']);
    }

    public function test_queue_status_delayed_when_pending_high(): void
    {
        $this->authenticateAsSuperAdmin();

        for ($i = 0; $i < 15; $i++) {
            $this->insertJob('default');
        }

        $response = $this->getJson('/api/super-admin/health/queues');

        $response->assertStatus(200);
        $defaultQueue = collect($response->json('data'))->firstWhere('name', 'default');
        $this->assertEquals('Delayed', $defaultQueue['status']);
    }

    public function test_queue_status_healthy_when_no_issues(): void
    {
        $this->authenticateAsSuperAdmin();

        $this->insertJob('default');

        $response = $this->getJson('/api/super-admin/health/queues');

        $response->assertStatus(200);
        $defaultQueue = collect($response->json('data'))->firstWhere('name', 'default');
        $this->assertEquals('Healthy', $defaultQueue['status']);
    }

    public function test_queues_returns_default_when_no_jobs(): void
    {
        $this->authenticateAsSuperAdmin();

        $response = $this->getJson('/api/super-admin/health/queues');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('default', $data[0]['name']);
        $this->assertEquals(0, $data[0]['pending_count']);
        $this->assertEquals(0, $data[0]['failed_count_24h']);
        $this->assertEquals('Healthy', $data[0]['status']);
    }

    public function test_non_super_admin_cannot_get_job_queues(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/super-admin/health/queues');

        $response->assertStatus(403);
    }
}
