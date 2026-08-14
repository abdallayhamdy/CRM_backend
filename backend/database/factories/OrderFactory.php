<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Workspace;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'contact_id' => Contact::factory(),
            'owner_id' => User::factory(),
            'title' => fake()->sentence(3),
            'status' => 'open',
            'currency' => 'USD',
            'subtotal' => 0,
            'total' => 0,
        ];
    }
}
