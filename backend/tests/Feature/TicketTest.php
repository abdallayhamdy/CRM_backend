<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Ticket;
use App\Models\Contact;
use App\Models\Company;
use App\Models\Deal;

class TicketTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_list_tickets(): void
    {
        $this->authenticateAsAdmin();
        Ticket::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/tickets');

        $response->assertStatus(200);
    }

    public function test_admin_can_create_ticket(): void
    {
        $this->authenticateAsAdmin();
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->postJson('/api/tickets', [
            'subject' => 'Test Ticket',
            'description' => 'Test description',
            'contact_id' => $contact->id,
            'priority' => 'high',
        ]);

        $this->assertResourceCreated($response);
        $this->assertDatabaseHas('tickets', [
            'subject' => 'Test Ticket',
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_admin_can_show_ticket(): void
    {
        $this->authenticateAsAdmin();
        $ticket = Ticket::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/tickets/' . $ticket->id);

        $this->assertResourceShown($response);
    }

    public function test_admin_can_update_ticket(): void
    {
        $this->authenticateAsAdmin();
        $ticket = Ticket::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->putJson('/api/tickets/' . $ticket->id, [
            'subject' => 'Updated Ticket',
        ]);

        $this->assertResourceUpdated($response);
        $this->assertDatabaseHas('tickets', [
            'id' => $ticket->id,
            'subject' => 'Updated Ticket',
        ]);
    }

    public function test_admin_can_delete_ticket(): void
    {
        $this->authenticateAsAdmin();
        $ticket = Ticket::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->deleteJson('/api/tickets/' . $ticket->id);

        $this->assertResourceDeleted($response);
        $this->assertDatabaseMissing('tickets', ['id' => $ticket->id]);
    }

    public function test_create_ticket_requires_subject(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/tickets', []);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['subject']);
    }

    public function test_create_ticket_invalid_status(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/tickets', [
            'subject' => 'Test',
            'status' => 'invalid_status',
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['status']);
    }

    public function test_create_ticket_invalid_priority(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/tickets', [
            'subject' => 'Test',
            'priority' => 'invalid_priority',
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['priority']);
    }

    public function test_user_cannot_view_another_workspace_ticket(): void
    {
        $this->authenticateAsAdmin();
        $otherTicket = Ticket::factory()->create();

        $response = $this->getJson('/api/tickets/' . $otherTicket->id);

        $this->assertNotFound($response);
    }

    public function test_filter_tickets_by_contact_id(): void
    {
        $this->authenticateAsAdmin();
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $otherContact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        Ticket::factory()->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => $contact->id,
        ]);
        Ticket::factory()->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => $otherContact->id,
        ]);

        $response = $this->getJson('/api/tickets?contact_id=' . $contact->id);

        $response->assertStatus(200);
        $response->assertJsonPath('meta.total', 1);
    }

    public function test_filter_tickets_by_company_id_via_contact(): void
    {
        $this->authenticateAsAdmin();
        $company = Company::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $otherCompany = Company::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        Ticket::factory()->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => Contact::factory()->create([
                'workspace_id' => $this->workspace->id,
                'company_id' => $company->id,
            ])->id,
        ]);
        Ticket::factory()->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => Contact::factory()->create([
                'workspace_id' => $this->workspace->id,
                'company_id' => $otherCompany->id,
            ])->id,
        ]);

        $response = $this->getJson('/api/tickets?company_id=' . $company->id);

        $response->assertStatus(200);
        $response->assertJsonPath('meta.total', 1);
    }

    public function test_filter_tickets_by_deal_id_via_contact(): void
    {
        $this->authenticateAsAdmin();
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $deal = Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => $contact->id,
        ]);
        $otherDeal = Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        Ticket::factory()->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => $contact->id,
        ]);
        Ticket::factory()->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => $otherDeal->contact_id,
        ]);

        $response = $this->getJson('/api/tickets?deal_id=' . $deal->id);

        $response->assertStatus(200);
        $response->assertJsonPath('meta.total', 1);
    }
}
