<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Product;

class ProductTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_list_products(): void
    {
        $this->authenticateAsAdmin();
        Product::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/products');

        $response->assertStatus(200);
    }

    public function test_admin_can_create_product(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/products', [
            'name' => 'Test Product',
            'sku' => 'TST-001',
            'unit_price' => 99.99,
            'status' => 'Active',
        ]);

        $this->assertResourceCreated($response);
        $this->assertDatabaseHas('products', [
            'name' => 'Test Product',
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_admin_can_show_product(): void
    {
        $this->authenticateAsAdmin();
        $product = Product::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/products/' . $product->id);

        $this->assertResourceShown($response);
    }

    public function test_admin_can_update_product(): void
    {
        $this->authenticateAsAdmin();
        $product = Product::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->putJson('/api/products/' . $product->id, [
            'name' => 'Updated Product',
        ]);

        $this->assertResourceUpdated($response);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Updated Product',
        ]);
    }

    public function test_admin_can_delete_product(): void
    {
        $this->authenticateAsAdmin();
        $product = Product::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->deleteJson('/api/products/' . $product->id);

        $this->assertResourceDeleted($response);
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_admin_can_search_products(): void
    {
        $this->authenticateAsAdmin();
        Product::factory()->create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Searchable Product',
        ]);

        $response = $this->getJson('/api/products/search?q=Searchable');

        $response->assertStatus(200);
    }

    public function test_create_product_requires_name(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/products', []);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_create_product_invalid_status(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/products', [
            'name' => 'Test',
            'status' => 'InvalidStatus',
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['status']);
    }

    public function test_create_product_unique_sku(): void
    {
        $this->authenticateAsAdmin();
        Product::factory()->create([
            'workspace_id' => $this->workspace->id,
            'sku' => 'UNIQUE-SKU',
        ]);

        $response = $this->postJson('/api/products', [
            'name' => 'Test',
            'sku' => 'UNIQUE-SKU',
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['sku']);
    }

    public function test_user_cannot_view_another_workspace_product(): void
    {
        $this->authenticateAsAdmin();
        $otherProduct = Product::factory()->create();

        $response = $this->getJson('/api/products/' . $otherProduct->id);

        $this->assertNotFound($response);
    }
}
