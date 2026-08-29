<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Contact;
use App\Models\Company;
use App\Models\Note;
use App\Models\Property;
use App\Models\Stage;
use App\Models\User;
use App\Services\ContactStageService;

class ContactTest extends TestCase
{
    use TestHelpers;

    private function seedContactProperties(): void
    {
        $definitions = [
            'first_name' => 'single_line_text',
            'last_name' => 'single_line_text',
            'email' => 'email',
            'phone_number' => 'phone_number',
            'lifecycle_stage' => 'dropdown_select',
            'lead_status' => 'dropdown_select',
            'contact_source' => 'dropdown_select',
            'notes' => 'multi_line_text',
            'date_of_birth' => 'date_picker',
            'newsletter_opt_in' => 'boolean_checkbox',
        ];

        foreach ($definitions as $name => $fieldType) {
            Property::firstOrCreate(
                ['workspace_id' => $this->workspace->id, 'object_type' => 'contact', 'name' => $name],
                ['field_type' => $fieldType, 'label' => $name, 'is_archived' => false]
            );
        }
    }

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
        $this->seedContactProperties();

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

    public function test_lifecycle_stage_filter_matches_stage_name(): void
    {
        $this->authenticateAsAdmin();
        $this->seedContactProperties();
        $this->app->make(ContactStageService::class)->ensureStagesExist($this->workspace->id);

        $mqlStage = Stage::where('workspace_id', $this->workspace->id)
            ->where('object_type', 'contact')
            ->where('slug', 'marketing_qualified_lead')
            ->firstOrFail();

        Contact::factory()->count(2)->create([
            'workspace_id' => $this->workspace->id,
            'stage_id' => $mqlStage->id,
        ]);

        $this->assertEquals(2, $this->getJson('/api/contacts?filter[lifecycle_stage]=Marketing%20Qualified%20Lead')->json('meta.total'));
        $this->assertEquals(2, $this->getJson('/api/contacts?filter[lifecycle_stage]=marketing_qualified_lead')->json('meta.total'));
    }

    public function test_custom_property_filters_use_real_columns(): void
    {
        $this->authenticateAsAdmin();
        $this->seedContactProperties();

        Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'first_name' => 'Zaphod',
            'last_name' => 'Beeblebrox',
            'email' => 'zaphod@example.com',
            'phone' => '01120001111',
            'custom_data' => null,
        ]);

        Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'first_name' => 'Trillian',
            'email' => 'trillian@example.com',
        ]);

        $this->assertEquals(1, $this->getJson('/api/contacts?filter[first_name]=Zaphod')->json('meta.total'));
        $this->assertEquals(1, $this->getJson('/api/contacts?filter[last_name]=Beeblebrox')->json('meta.total'));
        $this->assertEquals(1, $this->getJson('/api/contacts?filter[email]=zaphod@example.com')->json('meta.total'));
        $this->assertEquals(1, $this->getJson('/api/contacts?filter[phone_number]=01120001111')->json('meta.total'));
    }

    public function test_boolean_property_filter_maps_labels_to_json_boolean(): void
    {
        $this->authenticateAsAdmin();
        $this->seedContactProperties();

        Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'custom_data' => ['newsletter_opt_in' => true],
        ]);

        $this->assertEquals(1, $this->getJson('/api/contacts?filter[newsletter_opt_in]=Yes')->json('meta.total'));
        $this->assertEquals(1, $this->getJson('/api/contacts?filter[newsletter_opt_in]=true')->json('meta.total'));
        $this->assertEquals(0, $this->getJson('/api/contacts?filter[newsletter_opt_in]=No')->json('meta.total'));
    }

    public function test_lead_status_filter_is_case_insensitive(): void
    {
        $this->authenticateAsAdmin();
        $this->seedContactProperties();

        Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'custom_data' => ['lead_status' => 'Attempted to contact'],
        ]);

        $this->assertEquals(1, $this->getJson('/api/contacts?filter[lead_status]=Attempted%20to%20Contact')->json('meta.total'));
        $this->assertEquals(1, $this->getJson('/api/contacts?filter[lead_status]=attempted%20to%20contact')->json('meta.total'));
    }

    public function test_notes_property_filter_matches_note_content(): void
    {
        $this->authenticateAsAdmin();
        $this->seedContactProperties();

        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'first_name' => 'HasNote',
        ]);

        Note::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
            'notable_type' => Contact::class,
            'notable_id' => $contact->id,
            'content' => 'Wants a demo callback next week',
        ]);

        $this->assertEquals(1, $this->getJson('/api/contacts?filter[notes]=callback')->json('meta.total'));
        $this->assertEquals(0, $this->getJson('/api/contacts?filter[notes]=nonexistent')->json('meta.total'));
    }

    public function test_date_property_filter_supports_from_to_ranges(): void
    {
        $this->authenticateAsAdmin();
        $this->seedContactProperties();

        Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'custom_data' => ['date_of_birth' => '1990-05-10'],
        ]);

        $this->assertEquals(1, $this->getJson('/api/contacts?filter[date_of_birth][from]=1990-01-01&filter[date_of_birth][to]=1990-12-31')->json('meta.total'));
        $this->assertEquals(0, $this->getJson('/api/contacts?filter[date_of_birth][from]=1991-01-01&filter[date_of_birth][to]=1991-12-31')->json('meta.total'));
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
