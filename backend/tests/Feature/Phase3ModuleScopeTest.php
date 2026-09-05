<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Activity;
use App\Models\Contact;
use App\Models\Document;
use App\Models\Note;
use App\Models\Order;
use App\Models\PermissionSet;
use App\Models\Pipeline;
use App\Models\Product;
use App\Models\Ticket;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

class Phase3ModuleScopeTest extends TestCase
{
    use TestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpWorkspace();
        $this->adminUser->syncRoles('Workspace Owner');
        $this->standardUser->syncRoles('Workspace Member');
    }

    private function makeTicket(User $owner): Ticket
    {
        return Ticket::factory()->create([
            'workspace_id' => $this->workspace->id,
            'assigned_to' => $owner->id,
            'contact_id' => Contact::factory()->create(['workspace_id' => $this->workspace->id])->id,
        ]);
    }

    private function makeOrder(User $owner): Order
    {
        return Order::factory()->create([
            'workspace_id' => $this->workspace->id,
            'owner_id' => $owner->id,
        ]);
    }

    private function makeDocument(User $owner): Document
    {
        return Document::factory()->create([
            'workspace_id' => $this->workspace->id,
            'uploaded_by' => $owner->id,
        ]);
    }

    private function makeNote(User $owner): Note
    {
        return Note::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $owner->id,
        ]);
    }

    private function makeActivity(User $owner): Activity
    {
        return Activity::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $owner->id,
        ]);
    }

    private function assignSet(User $user, array $permissions): PermissionSet
    {
        $set = PermissionSet::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Set ' . fake()->unique()->words(2, true),
            'created_by' => $this->adminUser->id,
        ]);

        foreach ($permissions as $permission) {
            $set->permissions()->create($permission);
        }

        $set->users()->attach($user->id);

        return $set;
    }

    // ── Tickets: ownership via assigned_to ─────────────────────────────────

    public function test_ticket_their_scope_restricts_index(): void
    {
        Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $myTicket = $this->makeTicket($this->adminUser);
        $bobTicket = $this->makeTicket($bob);

        $this->assignSet($this->adminUser, [
            ['object' => 'tickets', 'key' => 'view', 'value' => 'their'],
            ['object' => 'tickets', 'key' => 'edit', 'value' => 'their'],
        ]);

        $response = $this->getJson('/api/tickets');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $myTicket->id]);
        $response->assertJsonMissing(['id' => $bobTicket->id]);
    }

    public function test_ticket_their_scope_denies_other_users_ticket_record(): void
    {
        Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $myTicket = $this->makeTicket($this->adminUser);
        $bobTicket = $this->makeTicket($bob);

        $this->assignSet($this->adminUser, [
            ['object' => 'tickets', 'key' => 'view', 'value' => 'their'],
            ['object' => 'tickets', 'key' => 'edit', 'value' => 'their'],
        ]);

        $this->getJson('/api/tickets/' . $myTicket->id)->assertStatus(200);
        $this->assertForbidden($this->getJson('/api/tickets/' . $bobTicket->id));
        $this->assertForbidden($this->putJson('/api/tickets/' . $bobTicket->id, ['subject' => 'Hacked']));
    }

    // ── Orders: ownership via owner_id ─────────────────────────────────────

    public function test_order_their_scope_restricts_index(): void
    {
        Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $myOrder = $this->makeOrder($this->adminUser);
        $bobOrder = $this->makeOrder($bob);

        $this->assignSet($this->adminUser, [
            ['object' => 'orders', 'key' => 'view', 'value' => 'their'],
            ['object' => 'orders', 'key' => 'edit', 'value' => 'their'],
        ]);

        $response = $this->getJson('/api/orders');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $myOrder->id]);
        $response->assertJsonMissing(['id' => $bobOrder->id]);
    }

    // ── Documents: ownership via uploaded_by ───────────────────────────────

    public function test_document_their_scope_restricts_index(): void
    {
        Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $myDocument = $this->makeDocument($this->adminUser);
        $bobDocument = $this->makeDocument($bob);

        $this->assignSet($this->adminUser, [
            ['object' => 'documents', 'key' => 'view', 'value' => 'their'],
            ['object' => 'documents', 'key' => 'edit', 'value' => 'their'],
        ]);

        $response = $this->getJson('/api/documents');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $myDocument->id]);
        $response->assertJsonMissing(['id' => $bobDocument->id]);
    }

    // ── Notes: ownership via user_id ───────────────────────────────────────

    public function test_note_their_scope_restricts_index(): void
    {
        Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $myNote = $this->makeNote($this->adminUser);
        $bobNote = $this->makeNote($bob);

        $this->assignSet($this->adminUser, [
            ['object' => 'notes', 'key' => 'view', 'value' => 'their'],
            ['object' => 'notes', 'key' => 'edit', 'value' => 'their'],
        ]);

        $response = $this->getJson('/api/notes');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $myNote->id]);
        $response->assertJsonMissing(['id' => $bobNote->id]);
    }

    // ── Activities: ownership via user_id ──────────────────────────────────

    public function test_activity_their_scope_restricts_index(): void
    {
        Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $myActivity = $this->makeActivity($this->adminUser);
        $bobActivity = $this->makeActivity($bob);

        $this->assignSet($this->adminUser, [
            ['object' => 'activities', 'key' => 'view', 'value' => 'their'],
            ['object' => 'activities', 'key' => 'edit', 'value' => 'their'],
        ]);

        $response = $this->getJson('/api/activities');

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $myActivity->id]);
        $response->assertJsonMissing(['id' => $bobActivity->id]);
    }

    public function test_activity_their_scope_restricts_composite_search(): void
    {
        Sanctum::actingAs($this->adminUser);
        $bob = User::factory()->create(['workspace_id' => $this->workspace->id]);
        $myActivity = $this->makeActivity($this->adminUser);
        $bobActivity = $this->makeActivity($bob);

        $this->assignSet($this->adminUser, [
            ['object' => 'activities', 'key' => 'view', 'value' => 'their'],
        ]);

        $response = $this->getJson('/api/search?q=' . $myActivity->subject);

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $myActivity->id]);
        $response->assertJsonMissing(['id' => $bobActivity->id]);
    }

    // ── Products: no ownership columns, 'their' fails closed ───────────────

    public function test_product_their_scope_fails_closed_to_empty_list(): void
    {
        Sanctum::actingAs($this->adminUser);
        $product = Product::factory()->create(['workspace_id' => $this->workspace->id]);

        $this->assignSet($this->adminUser, [
            ['object' => 'products', 'key' => 'view', 'value' => 'their'],
        ]);

        $response = $this->getJson('/api/products');

        $response->assertStatus(200);
        $response->assertJsonMissing(['id' => $product->id]);
        $response->assertJsonCount(0, 'data');
    }

    // ── Pipelines: no ownership columns, 'their' fails closed ──────────────

    public function test_pipeline_their_scope_fails_closed_to_empty_list(): void
    {
        Sanctum::actingAs($this->adminUser);
        $pipeline = Pipeline::factory()->create(['workspace_id' => $this->workspace->id]);

        $this->assignSet($this->adminUser, [
            ['object' => 'pipelines', 'key' => 'view', 'value' => 'their'],
        ]);

        $response = $this->getJson('/api/pipelines');

        $response->assertStatus(200);
        $response->assertJsonMissing(['id' => $pipeline->id]);
        $response->assertJsonCount(0, 'pipelines.data');
    }

    // ── 'none' scope denies the module entirely ────────────────────────────

    public function test_ticket_none_scope_forbids_index(): void
    {
        Sanctum::actingAs($this->adminUser);
        $myTicket = $this->makeTicket($this->adminUser);

        $this->assignSet($this->adminUser, [
            ['object' => 'tickets', 'key' => 'view', 'value' => 'none'],
        ]);

        $this->assertForbidden($this->getJson('/api/tickets'));
        $this->assertForbidden($this->getJson('/api/tickets/' . $myTicket->id));
    }
}