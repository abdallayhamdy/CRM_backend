<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Order;
use App\Models\Contact;

class OrderLineItemTest extends TestCase
{
    use TestHelpers;

    protected function createOrder(): Order
    {
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        return Order::factory()->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => $contact->id,
            'owner_id' => $this->adminUser->id,
        ]);
    }

    public function test_admin_can_add_line_items(): void
    {
        $this->authenticateAsAdmin();
        $order = $this->createOrder();

        $response = $this->postJson('/api/orders/' . $order->id . '/line-items', [
            ['name' => 'Item A', 'quantity' => 2, 'unit_price' => 10, 'total' => 20],
            ['name' => 'Item B', 'quantity' => 1, 'unit_price' => 5, 'total' => 5],
        ]);

        $response->assertStatus(201);
        $response->assertJsonCount(2, 'data.line_items');
        $this->assertDatabaseHas('order_line_items', [
            'order_id' => $order->id,
            'name' => 'Item A',
        ]);
    }

    public function test_add_line_items_requires_valid_fields(): void
    {
        $this->authenticateAsAdmin();
        $order = $this->createOrder();

        $response = $this->postJson('/api/orders/' . $order->id . '/line-items', [
            ['name' => '', 'quantity' => 0, 'unit_price' => 'x', 'total' => null],
        ]);

        $this->assertValidationError($response);
    }

    public function test_admin_can_replace_line_items(): void
    {
        $this->authenticateAsAdmin();
        $order = $this->createOrder();

        $this->postJson('/api/orders/' . $order->id . '/line-items', [
            ['name' => 'Old Item', 'quantity' => 1, 'unit_price' => 5, 'total' => 5],
        ]);

        $response = $this->putJson('/api/orders/' . $order->id . '/line-items', [
            ['name' => 'New Item', 'quantity' => 3, 'unit_price' => 8, 'total' => 24],
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('order_line_items', [
            'order_id' => $order->id,
            'name' => 'Old Item',
        ]);
        $this->assertDatabaseHas('order_line_items', [
            'order_id' => $order->id,
            'name' => 'New Item',
        ]);
    }

    public function test_member_cannot_modify_order_line_items(): void
    {
        $this->authenticateAsStandardUser();
        $order = $this->createOrder();

        $response = $this->postJson('/api/orders/' . $order->id . '/line-items', [
            ['name' => 'Item A', 'quantity' => 1, 'unit_price' => 10, 'total' => 10],
        ]);

        $this->assertForbidden($response);
    }
}
