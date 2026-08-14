<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'name' => fake()->word(),
            'sku' => fake()->unique()->ean8(),
            'unit_price' => fake()->randomFloat(2, 10, 1000),
            'status' => 'Active',
        ];
    }
}
