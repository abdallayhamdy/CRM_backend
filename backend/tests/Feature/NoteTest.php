<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Note;
use App\Models\Company;

class NoteTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_list_notes(): void
    {
        $this->authenticateAsAdmin();
        Note::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/notes');

        $response->assertStatus(200);
    }

    public function test_admin_can_create_note(): void
    {
        $this->authenticateAsAdmin();
        $company = Company::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->postJson('/api/notes', [
            'content' => 'Test note content',
            'notable_type' => 'company',
            'notable_id' => $company->id,
        ]);

        $this->assertResourceCreated($response);
        $this->assertDatabaseHas('notes', [
            'content' => 'Test note content',
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_admin_can_show_note(): void
    {
        $this->authenticateAsAdmin();
        $note = Note::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/notes/' . $note->id);

        $this->assertResourceShown($response);
    }

    public function test_admin_can_update_note(): void
    {
        $this->authenticateAsAdmin();
        $note = Note::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->putJson('/api/notes/' . $note->id, [
            'content' => 'Updated content',
        ]);

        $this->assertResourceUpdated($response);
        $this->assertDatabaseHas('notes', [
            'id' => $note->id,
            'content' => 'Updated content',
        ]);
    }

    public function test_admin_can_delete_note(): void
    {
        $this->authenticateAsAdmin();
        $note = Note::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->deleteJson('/api/notes/' . $note->id);

        $this->assertResourceDeleted($response);
        $this->assertDatabaseMissing('notes', ['id' => $note->id]);
    }

    public function test_create_note_requires_content(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/notes', []);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['content']);
    }

    public function test_create_note_without_notable_type(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/notes', [
            'content' => 'Test',
        ]);

        $this->assertResourceCreated($response);
        $this->assertDatabaseHas('notes', [
            'content' => 'Test',
            'notable_type' => null,
        ]);
    }

    public function test_create_note_invalid_notable_type(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/notes', [
            'content' => 'Test',
            'notable_type' => 'invalid',
            'notable_id' => '00000000-0000-0000-0000-000000000000',
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['notable_type']);
    }

    public function test_create_note_requires_uuid_notable_id(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/notes', [
            'content' => 'Test',
            'notable_type' => 'company',
            'notable_id' => 'not-a-uuid',
        ]);

        $this->assertValidationError($response);
    }

    public function test_user_cannot_view_another_workspace_note(): void
    {
        $this->authenticateAsAdmin();
        $otherNote = Note::factory()->create();

        $response = $this->getJson('/api/notes/' . $otherNote->id);

        $this->assertNotFound($response);
    }

    public function test_filter_notes_by_contact_id_returns_only_that_records_notes(): void
    {
        $this->authenticateAsAdmin();
        $contact = \App\Models\Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $otherContact = \App\Models\Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        Note::factory()->create([
            'workspace_id' => $this->workspace->id,
            'notable_type' => \App\Models\Contact::class,
            'notable_id' => $contact->id,
        ]);
        Note::factory()->create([
            'workspace_id' => $this->workspace->id,
            'notable_type' => \App\Models\Contact::class,
            'notable_id' => $otherContact->id,
        ]);

        $response = $this->getJson('/api/notes?contact_id=' . $contact->id);

        $response->assertStatus(200);
        $response->assertJsonPath('meta.total', 1);
    }

    public function test_filter_notes_by_deal_id_returns_only_that_records_notes(): void
    {
        $this->authenticateAsAdmin();
        $deal = \App\Models\Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $otherDeal = \App\Models\Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        Note::factory()->create([
            'workspace_id' => $this->workspace->id,
            'notable_type' => \App\Models\Deal::class,
            'notable_id' => $deal->id,
        ]);
        Note::factory()->create([
            'workspace_id' => $this->workspace->id,
            'notable_type' => \App\Models\Deal::class,
            'notable_id' => $otherDeal->id,
        ]);

        $response = $this->getJson('/api/notes?deal_id=' . $deal->id);

        $response->assertStatus(200);
        $response->assertJsonPath('meta.total', 1);
    }
}
