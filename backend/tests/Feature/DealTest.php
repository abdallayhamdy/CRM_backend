<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Deal;
use App\Models\Contact;
use App\Models\Company;
use App\Models\Pipeline;
use App\Models\PipelineStage;

class DealTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_list_deals(): void
    {
        $this->authenticateAsAdmin();
        Deal::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/deals');

        $response->assertStatus(200);
        $response->assertJsonStructure(['status', 'data', 'meta']);
    }

    public function test_admin_can_create_deal(): void
    {
        $this->authenticateAsAdmin();
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->postJson('/api/deals', [
            'title' => 'Test Deal',
            'amount' => 50000,
            'status' => 'open',
            'contact_id' => $contact->id,
        ]);

        $this->assertResourceCreated($response);
        $this->assertDatabaseHas('deals', [
            'title' => 'Test Deal',
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_admin_can_show_deal(): void
    {
        $this->authenticateAsAdmin();
        $deal = Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/deals/' . $deal->id);

        $this->assertResourceShown($response);
    }

    public function test_admin_can_update_deal(): void
    {
        $this->authenticateAsAdmin();
        $deal = Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->putJson('/api/deals/' . $deal->id, [
            'title' => 'Updated Deal',
        ]);

        $this->assertResourceUpdated($response);
        $this->assertDatabaseHas('deals', [
            'id' => $deal->id,
            'title' => 'Updated Deal',
        ]);
    }

    public function test_admin_can_delete_deal(): void
    {
        $this->authenticateAsAdmin();
        $deal = Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->deleteJson('/api/deals/' . $deal->id);

        $this->assertResourceDeleted($response);
        $this->assertSoftDeleted('deals', ['id' => $deal->id]);
    }

    public function test_admin_can_move_deal_stage(): void
    {
        $this->authenticateAsAdmin();
        $pipeline = Pipeline::factory()->create([
            'workspace_id' => $this->workspace->id,
            'is_default' => true,
        ]);
        $stage = PipelineStage::factory()->create([
            'pipeline_id' => $pipeline->id,
        ]);
        $deal = Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->patchJson('/api/deals/' . $deal->id . '/move-stage', [
            'pipeline_stage_id' => $stage->id,
        ]);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'success']);
        $this->assertDatabaseHas('deals', [
            'id' => $deal->id,
            'pipeline_stage_id' => $stage->id,
        ]);
    }

    public function test_move_stage_invalid_pipeline_stage_id(): void
    {
        $this->authenticateAsAdmin();
        $deal = Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->patchJson('/api/deals/' . $deal->id . '/move-stage', [
            'pipeline_stage_id' => '00000000-0000-0000-0000-000000000000',
        ]);

        $response->assertStatus(422);
    }

    public function test_deal_stage_returns_underscore_slug_of_stage_name(): void
    {
        $this->authenticateAsAdmin();
        $pipeline = Pipeline::factory()->create([
            'workspace_id' => $this->workspace->id,
            'is_default' => true,
        ]);
        $stage = PipelineStage::factory()->create([
            'pipeline_id' => $pipeline->id,
            'name' => 'Closed Won',
        ]);
        $deal = Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
            'pipeline_stage_id' => $stage->id,
        ]);

        $response = $this->getJson('/api/deals/' . $deal->id);

        $response->assertStatus(200);
        $response->assertJsonPath('data.stage', 'closed_won');
    }

    public function test_deal_stage_returns_slug_of_arabic_stage_name(): void
    {
        // The frontend board builds its column ids with
        // name.toLowerCase().replace(/\s+/g, '_'), so the API slug must
        // produce the same value without transliterating Arabic away.
        $this->authenticateAsAdmin();
        $pipeline = Pipeline::factory()->create([
            'workspace_id' => $this->workspace->id,
            'is_default' => true,
        ]);
        $stage = PipelineStage::factory()->create([
            'pipeline_id' => $pipeline->id,
            'name' => 'مغلقة (مكسب)',
        ]);
        $deal = Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
            'pipeline_stage_id' => $stage->id,
        ]);

        $response = $this->getJson('/api/deals/' . $deal->id);

        $response->assertStatus(200);
        $response->assertJsonPath('data.stage', 'مغلقة_(مكسب)');
    }

    public function test_admin_can_associate_contact(): void
    {
        $this->authenticateAsAdmin();
        $deal = Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->patchJson('/api/deals/' . $deal->id . '/associate-contact', [
            'contact_id' => $contact->id,
        ]);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'success']);
    }

    public function test_associate_contact_cross_workspace_is_forbidden(): void
    {
        $this->authenticateAsAdmin();
        $deal = Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $otherContact = Contact::factory()->create();

        $response = $this->patchJson('/api/deals/' . $deal->id . '/associate-contact', [
            'contact_id' => $otherContact->id,
        ]);

        $response->assertStatus(422);
    }

    public function test_create_deal_requires_title(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/deals', []);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['title']);
    }

    public function test_create_deal_invalid_status(): void
    {
        $this->authenticateAsAdmin();
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->postJson('/api/deals', [
            'title' => 'Test',
            'status' => 'invalid_status',
            'contact_id' => $contact->id,
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['status']);
    }

    public function test_create_deal_without_status_succeeds(): void
    {
        $this->authenticateAsAdmin();
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->postJson('/api/deals', [
            'title' => 'No Status Deal',
            'amount' => 100,
            'contact_id' => $contact->id,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('deals', [
            'title' => 'No Status Deal',
        ]);
    }

    public function test_create_deal_invalid_contact_id(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/deals', [
            'title' => 'Test',
            'contact_id' => '00000000-0000-0000-0000-000000000000',
        ]);

        $this->assertValidationError($response);
    }

    public function test_unauthenticated_user_cannot_access_deals(): void
    {
        $response = $this->getJson('/api/deals');
        $this->assertUnauthenticated($response);
    }

    public function test_user_cannot_view_another_workspace_deal(): void
    {
        $this->authenticateAsAdmin();
        $otherDeal = Deal::factory()->create();

        $response = $this->getJson('/api/deals/' . $otherDeal->id);

        $this->assertNotFound($response);
    }

    public function test_user_cannot_update_another_workspace_deal(): void
    {
        $this->authenticateAsAdmin();
        $otherDeal = Deal::factory()->create();

        $response = $this->putJson('/api/deals/' . $otherDeal->id, [
            'title' => 'Hacked',
        ]);

        $this->assertNotFound($response);
    }

    public function test_user_cannot_delete_another_workspace_deal(): void
    {
        $this->authenticateAsAdmin();
        $otherDeal = Deal::factory()->create();

        $response = $this->deleteJson('/api/deals/' . $otherDeal->id);

        $this->assertNotFound($response);
    }
}
