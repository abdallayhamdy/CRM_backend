<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Activity;
use App\Models\Company;
use App\Models\Ticket;
use App\Models\Contact;

class ActivityTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_list_activities(): void
    {
        $this->authenticateAsAdmin();
        Activity::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
        ]);

        $response = $this->getJson('/api/activities');

        $response->assertStatus(200);
    }

    public function test_unauthenticated_user_cannot_access_activities(): void
    {
        $response = $this->getJson('/api/activities');
        $this->assertUnauthenticated($response);
    }

    public function test_filter_activities_by_company_id(): void
    {
        $this->authenticateAsAdmin();
        $company = Company::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $otherCompany = Company::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        Activity::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
            'activitable_type' => \App\Models\Company::class,
            'activitable_id' => $company->id,
        ]);
        Activity::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
            'activitable_type' => \App\Models\Company::class,
            'activitable_id' => $otherCompany->id,
        ]);

        $expectedTotal = Activity::query()
            ->where('workspace_id', $this->workspace->id)
            ->where('activitable_type', \App\Models\Company::class)
            ->where('activitable_id', $company->id)
            ->count();

        $response = $this->getJson('/api/activities?company_id=' . $company->id);

        $response->assertStatus(200);
        $response->assertJsonPath('meta.total', $expectedTotal);
        $response->assertJsonMissing(['company_id' => $otherCompany->id]);
    }

    public function test_filter_activities_by_ticket_id(): void
    {
        $this->authenticateAsAdmin();
        $ticket = Ticket::factory()->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => Contact::factory()->create([
                'workspace_id' => $this->workspace->id,
            ])->id,
        ]);
        $otherTicket = Ticket::factory()->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => Contact::factory()->create([
                'workspace_id' => $this->workspace->id,
            ])->id,
        ]);

        Activity::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
            'activitable_type' => \App\Models\Ticket::class,
            'activitable_id' => $ticket->id,
        ]);
        Activity::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
            'activitable_type' => \App\Models\Ticket::class,
            'activitable_id' => $otherTicket->id,
        ]);

        $expectedTotal = Activity::query()
            ->where('workspace_id', $this->workspace->id)
            ->where('activitable_type', \App\Models\Ticket::class)
            ->where('activitable_id', $ticket->id)
            ->count();

        $response = $this->getJson('/api/activities?ticket_id=' . $ticket->id);

        $response->assertStatus(200);
        $response->assertJsonPath('meta.total', $expectedTotal);
        $response->assertJsonMissing(['ticket_id' => $otherTicket->id]);
    }
}
