<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Order;
use App\Models\Contact;

class OrderFinancialIntegrityTest extends TestCase
{
    use TestHelpers;

    private function contact(): Contact
    {
        return Contact::factory()->create(['workspace_id' => $this->workspace->id]);
    }

    public function test_create_order_recomputes_line_item_totals_server_side(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/orders', [
            'title' => 'Integrity Order',
            'contact_id' => $this->contact()->id,
            'total' => 1.00,
            'subtotal' => 1.00,
            'line_items' => [
                [
                    'name' => 'Item A',
                    'quantity' => 3,
                    'unit_price' => 50,
                    'total' => 1.00,
                ],
            ],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('order_line_items', [
            'name' => 'Item A',
            'total' => 150.00,
        ]);
        $this->assertDatabaseHas('orders', [
            'title' => 'Integrity Order',
            'subtotal' => 150.00,
            'total' => 150.00,
        ]);
    }

    public function test_create_order_recomputes_with_discount_and_tax(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/orders', [
            'title' => 'Discount Order',
            'contact_id' => $this->contact()->id,
            'line_items' => [
                [
                    'name' => 'Item B',
                    'quantity' => 2,
                    'unit_price' => 100,
                    'discount' => 10,
                    'tax' => 5,
                    'total' => 1.00,
                ],
            ],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('order_line_items', [
            'name' => 'Item B',
            'total' => 185.00,
        ]);
        $this->assertDatabaseHas('orders', [
            'title' => 'Discount Order',
            'subtotal' => 180.00,
            'discount' => 20.00,
            'tax' => 5.00,
            'total' => 185.00,
        ]);
    }

    public function test_add_line_items_recomputes_order_totals(): void
    {
        $this->authenticateAsAdmin();
        $order = Order::factory()->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => $this->contact()->id,
            'owner_id' => $this->adminUser->id,
        ]);

        $this->postJson('/api/orders/' . $order->id . '/line-items', [
            ['name' => 'Item A', 'quantity' => 2, 'unit_price' => 10, 'total' => 999],
            ['name' => 'Item B', 'quantity' => 1, 'unit_price' => 5, 'total' => 999],
        ])->assertStatus(201);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'subtotal' => 25.00,
            'total' => 25.00,
        ]);
    }

    public function test_replace_line_items_recomputes_order_totals(): void
    {
        $this->authenticateAsAdmin();
        $order = Order::factory()->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => $this->contact()->id,
            'owner_id' => $this->adminUser->id,
        ]);

        $this->putJson('/api/orders/' . $order->id . '/line-items', [
            ['name' => 'New Item', 'quantity' => 3, 'unit_price' => 8, 'total' => 1],
        ])->assertStatus(200);

        $this->assertDatabaseHas('order_line_items', ['name' => 'New Item', 'total' => 24.00]);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'subtotal' => 24.00, 'total' => 24.00]);
    }

    public function test_update_cannot_tamper_with_totals(): void
    {
        $this->authenticateAsAdmin();
        $order = Order::factory()->create([
            'workspace_id' => $this->workspace->id,
            'contact_id' => $this->contact()->id,
            'owner_id' => $this->adminUser->id,
        ]);
        $order->lineItems()->create([
            'name' => 'Item',
            'quantity' => 2,
            'unit_price' => 25,
            'total' => 50,
        ]);

        $this->patchJson('/api/orders/' . $order->id, [
            'total' => 0.01,
            'subtotal' => 0.01,
        ])->assertStatus(200);

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'subtotal' => 50.00, 'total' => 50.00]);
    }

    public function test_discount_over_100_percent_is_capped(): void
    {
        $this->authenticateAsAdmin();

        $this->postJson('/api/orders', [
            'title' => 'Capped Order',
            'contact_id' => $this->contact()->id,
            'line_items' => [
                [
                    'name' => 'Item',
                    'quantity' => 1,
                    'unit_price' => 100,
                    'discount' => 500,
                    'total' => 0,
                ],
            ],
        ])->assertStatus(201);

        $this->assertDatabaseHas('order_line_items', ['name' => 'Item', 'total' => 0.00]);
        $this->assertDatabaseHas('orders', ['title' => 'Capped Order', 'total' => 0.00]);
    }
}
