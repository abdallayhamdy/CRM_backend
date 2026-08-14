<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Order;
use App\Models\Contact;
use App\Models\Product;
use App\Models\User;

class OrderTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_list_orders(): void
    {
        $this->authenticateAsAdmin();
        Order::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => Contact::factory()->create(['workspace_id' => $this->workspace->id])->id,
            'owner_id' => $this->adminUser->id,
        ]);

        $response = $this->getJson('/api/orders');

        $response->assertStatus(200);
    }

    public function test_admin_can_create_order(): void
    {
        $this->authenticateAsAdmin();
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->postJson('/api/orders', [
            'title' => 'Test Order',
            'contact_id' => $contact->id,
            'status' => 'open',
            'currency' => 'USD',
            'total' => 150.00,
        ]);

        $this->assertResourceCreated($response);
        $this->assertDatabaseHas('orders', [
            'title' => 'Test Order',
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_admin_can_create_order_with_line_items(): void
    {
        $this->authenticateAsAdmin();
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $product = Product::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->postJson('/api/orders', [
            'title' => 'Order With Items',
            'contact_id' => $contact->id,
            'line_items' => [
                [
                    'product_id' => $product->id,
                    'name' => 'Item 1',
                    'quantity' => 2,
                    'unit_price' => 50,
                    'total' => 100,
                ],
            ],
        ]);

        $this->assertResourceCreated($response);
    }

    public function test_admin_can_show_order(): void
    {
        $this->authenticateAsAdmin();
        $order = Order::factory()->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => Contact::factory()->create(['workspace_id' => $this->workspace->id])->id,
            'owner_id' => $this->adminUser->id,
        ]);

        $response = $this->getJson('/api/orders/' . $order->id);

        $response->assertStatus(200);
    }

    public function test_admin_can_update_order(): void
    {
        $this->authenticateAsAdmin();
        $order = Order::factory()->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => Contact::factory()->create(['workspace_id' => $this->workspace->id])->id,
            'owner_id' => $this->adminUser->id,
        ]);

        $response = $this->putJson('/api/orders/' . $order->id, [
            'title' => 'Updated Order',
        ]);

        $this->assertResourceUpdated($response);
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'title' => 'Updated Order',
        ]);
    }

    public function test_admin_can_delete_order(): void
    {
        $this->authenticateAsAdmin();
        $order = Order::factory()->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => Contact::factory()->create(['workspace_id' => $this->workspace->id])->id,
            'owner_id' => $this->adminUser->id,
        ]);

        $response = $this->deleteJson('/api/orders/' . $order->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
    }

    public function test_create_order_requires_title(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/orders', []);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['title']);
    }

    public function test_create_order_invalid_status(): void
    {
        $this->authenticateAsAdmin();
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->postJson('/api/orders', [
            'title' => 'Test',
            'contact_id' => $contact->id,
            'status' => 'invalid_status',
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['status']);
    }

    public function test_user_cannot_view_another_workspace_order(): void
    {
        $this->authenticateAsAdmin();
        $otherOrder = Order::factory()->create();

        $response = $this->getJson('/api/orders/' . $otherOrder->id);

        $this->assertNotFound($response);
    }
}
