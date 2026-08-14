<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Deal;
use App\Models\Ticket;
use App\Models\Activity;
use App\Models\Workspace;

class DashboardTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_view_dashboard_overview(): void
    {
        $this->authenticateAsAdmin();

        Deal::factory()->count(5)->create([
            'workspace_id' => $this->workspace->id,
            'status' => 'open',
            'amount' => 10000,
        ]);
        Deal::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
            'status' => 'won',
            'amount' => 20000,
        ]);
        Deal::factory()->count(2)->create([
            'workspace_id' => $this->workspace->id,
            'status' => 'lost',
            'amount' => 5000,
        ]);

        Ticket::factory()->count(4)->create([
            'workspace_id' => $this->workspace->id,
            'status' => 'open',
        ]);
        Ticket::factory()->count(1)->create([
            'workspace_id' => $this->workspace->id,
            'status' => 'pending',
        ]);
        Ticket::factory()->count(1)->create([
            'workspace_id' => $this->workspace->id,
            'status' => 'resolved',
        ]);
        Ticket::factory()->count(2)->create([
            'workspace_id' => $this->workspace->id,
            'status' => 'closed',
        ]);

        $response = $this->getJson('/api/dashboard/overview');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => ['totalRevenue', 'pipelineValue', 'openDeals', 'conversionRate', 'openTickets'],
        ]);
        $response->assertJson([
            'status' => 'success',
            'data' => [
                'totalRevenue' => 60000,
                'pipelineValue' => 50000,
                'openDeals' => 5,
                'conversionRate' => 30.0,
                'openTickets' => 5,
            ],
        ]);
    }

    public function test_admin_can_view_recent_activity(): void
    {
        $this->authenticateAsAdmin();

        Activity::factory()->count(12)->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
        ]);

        $response = $this->getJson('/api/dashboard/recent-activity');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                '*' => ['id', 'type', 'title', 'entity_type', 'entity_name', 'activity_date', 'created_at'],
            ],
        ]);
        $this->assertCount(10, $response->json('data'));
    }

    public function test_dashboard_overview_returns_zero_when_no_data(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/dashboard/overview');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'data' => [
                'totalRevenue' => 0.0,
                'pipelineValue' => 0.0,
                'openDeals' => 0,
                'wonDeals' => 0,
                'conversionRate' => 0,
                'openTickets' => 0,
                'activeTasks' => 0,
                'contactsCount' => 0,
                'companiesCount' => 0,
            ],
        ]);
    }

    public function test_recent_activity_returns_empty_array_when_no_activity(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/dashboard/recent-activity');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'data' => [],
        ]);
    }

    public function test_unauthenticated_user_cannot_access_dashboard(): void
    {
        $response = $this->getJson('/api/dashboard/overview');
        $this->assertUnauthenticated($response);

        $response = $this->getJson('/api/dashboard/recent-activity');
        $this->assertUnauthenticated($response);
    }

    public function test_dashboard_overview_is_isolated_by_workspace(): void
    {
        $this->authenticateAsAdmin();

        Deal::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
            'status' => 'open',
            'amount' => 10000,
        ]);

        $otherWorkspace = Workspace::factory()->create();
        Deal::factory()->count(5)->create([
            'workspace_id' => $otherWorkspace->id,
            'status' => 'open',
            'amount' => 99999,
        ]);

        $response = $this->getJson('/api/dashboard/overview');

        $response->assertStatus(200);
        $this->assertEquals(30000, $response->json('data.pipelineValue'));
        $this->assertEquals(3, $response->json('data.openDeals'));
    }

    public function test_dashboard_recent_activity_is_isolated_by_workspace(): void
    {
        $this->authenticateAsAdmin();

        Activity::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
        ]);

        $otherWorkspace = Workspace::factory()->create();
        $otherUser = \App\Models\User::factory()->create([
            'workspace_id' => $otherWorkspace->id,
        ]);
        Activity::factory()->count(5)->create([
            'workspace_id' => $otherWorkspace->id,
            'user_id' => $otherUser->id,
        ]);

        $response = $this->getJson('/api/dashboard/recent-activity');

        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
    }
}
