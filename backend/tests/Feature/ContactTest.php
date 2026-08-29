<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Contact;
use App\Models\Company;
use App\Models\Property;
use App\Models\Stage;
use App\Models\User;
use App\Services\ContactStageService;

class ContactTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_list_contacts(): void
    {
        $this->authenticateAsAdmin();
        Contact::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/contacts');

        $response->assertStatus(200);
    }

    public function test_lifecycle_stage_filter_filters_by_stage_slug(): void
    {
        $this->authenticateAsAdmin();

        $this->app->make(ContactStageService::class)->ensureStagesExist($this->workspace->id);

        $leadStage = Stage::where('workspace_id', $this->workspace->id)
            ->where('object_type', 'contact')
            ->where('slug', 'lead')
            ->firstOrFail();

        $subscriberStage = Stage::where('workspace_id', $this->workspace->id)
            ->where('object_type', 'contact')
            ->where('slug', 'subscriber')
            ->firstOrFail();

        // A property named lifecycle_stage exists in the properties table; the
        // dedicated stage-slug filter must win and not be AND-ed with an empty
        // custom_data JSON filter.
        Property::factory()->create([
            'workspace_id' => $this->workspace->id,
            'object_type' => 'contact',
            'name' => 'lifecycle_stage',
            'is_archived' => false,
        ]);

        Contact::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
            'stage_id' => $leadStage->id,
        ]);

        Contact::factory()->count(2)->create([
            'workspace_id' => $this->workspace->id,
            'stage_id' => $subscriberStage->id,
        ]);

        $response = $this->getJson('/api/contacts?filter[lifecycle_stage]=lead');
        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
        $this->assertEquals(3, $response->json('meta.total'));

        $response = $this->getJson('/api/contacts?filter[lifecycle_stage]=lead,subscriber');
        $response->assertStatus(200);
        $this->assertEquals(5, $response->json('meta.total'));
    }

    public function test_admin_can_create_contact(): void
    {
        $this->authenticateAsAdmin();
        $company = Company::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->postJson('/api/contacts', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@test.com',
            'phone' => '01234567890',
            'company_id' => $company->id,
        ]);

        $this->assertResourceCreated($response);
        $this->assertDatabaseHas('contacts', [
            'email' => 'john@test.com',
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_admin_can_show_contact(): void
    {
        $this->authenticateAsAdmin();
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/contacts/' . $contact->id);

        $this->assertResourceShown($response);
    }

    public function test_admin_can_update_contact(): void
    {
        $this->authenticateAsAdmin();
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->putJson('/api/contacts/' . $contact->id, [
            'first_name' => 'Jane',
        ]);

        $this->assertResourceUpdated($response);
        $this->assertDatabaseHas('contacts', [
            'id' => $contact->id,
            'first_name' => 'Jane',
        ]);
    }

    public function test_email_opt_out_toggle_persists_and_is_exposed(): void
    {
        $this->authenticateAsAdmin();
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->putJson('/api/contacts/' . $contact->id, [
            'emailOptOut' => true,
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.emailOptOut', true);

        $this->assertDatabaseHas('contacts', [
            'id' => $contact->id,
        ]);
        $this->assertTrue(
            (bool) ($contact->refresh()->custom_data['email_opt_out'] ?? false)
        );
    }

    public function test_partial_update_preserves_existing_custom_data(): void
    {
        $this->authenticateAsAdmin();
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'custom_data' => ['source' => 'website', 'lead_status' => 'hot'],
        ]);

        $response = $this->putJson('/api/contacts/' . $contact->id, [
            'emailOptOut' => true,
        ]);

        $response->assertStatus(200);
        $customData = $contact->refresh()->custom_data;
        $this->assertSame('website', $customData['source']);
        $this->assertSame('hot', $customData['lead_status']);
        $this->assertTrue((bool) $customData['email_opt_out']);
    }

    public function test_admin_can_delete_contact(): void
    {
        $this->authenticateAsAdmin();
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->deleteJson('/api/contacts/' . $contact->id);

        $this->assertResourceDeleted($response);
        $this->assertSoftDeleted('contacts', ['id' => $contact->id]);
    }

    public function test_create_contact_requires_first_name(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/contacts', []);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['first_name']);
    }

    public function test_create_contact_without_last_name_succeeds(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/contacts', [
            'first_name' => 'John',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('contacts', [
            'first_name' => 'John',
            'last_name' => null,
        ]);
    }

    public function test_create_contact_invalid_email(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/contacts', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'not-an-email',
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_create_contact_invalid_company_id(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/contacts', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'company_id' => 'invalid-uuid',
        ]);

        $this->assertValidationError($response);
    }

    public function test_create_contact_nonexistent_company_id(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/contacts', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'company_id' => '00000000-0000-0000-0000-000000000000',
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['company_id']);
    }

    public function test_unauthenticated_user_cannot_access_contacts(): void
    {
        $response = $this->getJson('/api/contacts');
        $this->assertUnauthenticated($response);
    }

    public function test_user_cannot_view_another_workspace_contact(): void
    {
        $this->authenticateAsAdmin();
        $otherContact = Contact::factory()->create();

        $response = $this->getJson('/api/contacts/' . $otherContact->id);

        $this->assertNotFound($response);
    }

    public function test_user_cannot_update_another_workspace_contact(): void
    {
        $this->authenticateAsAdmin();
        $otherContact = Contact::factory()->create();

        $response = $this->putJson('/api/contacts/' . $otherContact->id, [
            'first_name' => 'Hacked',
        ]);

        $this->assertNotFound($response);
    }

    public function test_user_cannot_delete_another_workspace_contact(): void
    {
        $this->authenticateAsAdmin();
        $otherContact = Contact::factory()->create();

        $response = $this->deleteJson('/api/contacts/' . $otherContact->id);

        $this->assertNotFound($response);
    }
}
