<?php

namespace Database\Factories;

use App\Models\OrderLineItem;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderLineItemFactory extends Factory
{
    protected $model = OrderLineItem::class;

    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'name' => fake()->word(),
            'quantity' => fake()->numberBetween(1, 10),
            'unit_price' => fake()->randomFloat(2, 10, 1000),
            'total' => 0,
        ];
    }
}
