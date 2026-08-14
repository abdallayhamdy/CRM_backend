<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Workspace;
use App\Models\User;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Product;
use App\Models\Ticket;
use App\Models\Order;
use App\Models\Activity;
use App\Models\Note;
use App\Models\Task;
use App\Models\Document;
use Illuminate\Http\UploadedFile;

class MultiTenancyIsolationTest extends TestCase
{
    use TestHelpers;

    protected Workspace $workspaceA;
    protected Workspace $workspaceB;
    protected User $userA;
    protected User $userB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpWorkspace(); // sets up $this->workspace, standardUser, adminUser (Workspace A)
        $this->workspaceA = $this->workspace;
        $this->userA = $this->adminUser; // Workspace A Admin

        // Create Workspace B
        $this->workspaceB = Workspace::factory()->create();
        $this->userB = User::factory()->create([
            'workspace_id' => $this->workspaceB->id,
        ]);
        $this->userB->workspaces()->attach($this->workspaceB->id, [
            'role_name' => 'Workspace Owner',
            'is_active' => true,
        ]);
    }

    public function test_product_sku_uniqueness_is_workspace_scoped(): void
    {
        $this->authenticateAsAdmin(); // Authenticated as User A in Workspace A

        // Create a product in Workspace B with SKU "SKU-123"
        Product::factory()->create([
            'workspace_id' => $this->workspaceB->id,
            'sku' => 'SKU-123',
        ]);

        // Creating product in Workspace A with same SKU "SKU-123" should succeed (workspace-scoped uniqueness)
        $response = $this->postJson('/api/products', [
            'name' => 'Product A',
            'sku' => 'SKU-123',
            'unit_price' => 10.0,
            'status' => 'Active',
        ]);

        $this->assertResourceCreated($response);

        // Creating another product in Workspace A with same SKU "SKU-123" should fail validation
        $response2 = $this->postJson('/api/products', [
            'name' => 'Product A Duplicate',
            'sku' => 'SKU-123',
            'unit_price' => 12.0,
            'status' => 'Active',
        ]);

        $this->assertValidationError($response2);
        $response2->assertJsonValidationErrors(['sku']);
    }

    public function test_cannot_create_task_linked_to_foreign_workspace_record(): void
    {
        $this->authenticateAsAdmin(); // Workspace A

        // Create a company in Workspace B
        $companyB = Company::factory()->create([
            'workspace_id' => $this->workspaceB->id,
        ]);

        // Try to create a task in Workspace A linked to the company in Workspace B
        $response = $this->postJson('/api/tasks', [
            'title' => 'Task A',
            'taskable_type' => 'company',
            'taskable_id' => $companyB->id,
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['taskable_id']);
    }

    public function test_cannot_create_note_linked_to_foreign_workspace_record(): void
    {
        $this->authenticateAsAdmin();

        $contactB = Contact::factory()->create([
            'workspace_id' => $this->workspaceB->id,
        ]);

        $response = $this->postJson('/api/notes', [
            'content' => 'Note A content',
            'notable_type' => 'contact',
            'notable_id' => $contactB->id,
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['notable_id']);
    }

    public function test_cannot_create_document_linked_to_foreign_workspace_record(): void
    {
        $this->authenticateAsAdmin();

        $dealB = Deal::factory()->create([
            'workspace_id' => $this->workspaceB->id,
        ]);

        $file = UploadedFile::fake()->create('contract.pdf', 500);

        $response = $this->postJson('/api/documents', [
            'file' => $file,
            'documentable_type' => 'deal',
            'documentable_id' => $dealB->id,
            'name' => 'My Document',
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['documentable_id']);
    }

    public function test_cannot_update_activity_with_foreign_workspace_relationships(): void
    {
        $this->authenticateAsAdmin();

        // Create an activity in Workspace A
        $activity = Activity::factory()->create([
            'workspace_id' => $this->workspaceA->id,
            'user_id' => $this->userA->id,
        ]);

        // Create a contact in Workspace B
        $contactB = Contact::factory()->create([
            'workspace_id' => $this->workspaceB->id,
        ]);

        // Try updating activity to reference the foreign contact
        $response = $this->patchJson("/api/activities/{$activity->id}", [
            'contact_id' => $contactB->id,
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['contact_id']);
    }

    public function test_cannot_create_ticket_assigned_to_foreign_user(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/tickets', [
            'subject' => 'Ticket A',
            'assigned_to' => $this->userB->id, // User B is in Workspace B
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['assigned_to']);
    }

    public function test_cannot_create_order_owned_by_foreign_user(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/orders', [
            'title' => 'Order A',
            'owner_id' => $this->userB->id,
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['owner_id']);
    }

    public function test_cannot_update_company_associated_with_foreign_contact(): void
    {
        $this->authenticateAsAdmin();

        $companyA = Company::factory()->create([
            'workspace_id' => $this->workspaceA->id,
        ]);

        $contactB = Contact::factory()->create([
            'workspace_id' => $this->workspaceB->id,
        ]);

        $response = $this->putJson("/api/companies/{$companyA->id}", [
            'name' => 'Company A Updated',
            'contacts' => [
                ['id' => $contactB->id]
            ]
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['contacts.0.id']);
    }

    public function test_order_report_does_not_leak_cross_tenant_line_items(): void
    {
        $this->authenticateAsAdmin(); // Workspace A

        // Create an order and line item in Workspace B
        $orderB = Order::factory()->create([
            'workspace_id' => $this->workspaceB->id,
            'total' => 1000.0,
        ]);
        \App\Models\OrderLineItem::create([
            'order_id' => $orderB->id,
            'product_id' => null,
            'name' => 'Foreign Product',
            'quantity' => 1,
            'unit_price' => 1000.0,
            'total' => 1000.0,
        ]);

        // Get orders report in Workspace A (should not show Workspace B's data)
        $response = $this->getJson('/api/reports/orders');

        $response->assertStatus(200);
        $this->assertEquals('$0', $response->json('data.kpis.2.value')); // Avg Revenue per Product
    }
}
