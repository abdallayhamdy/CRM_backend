<?php

namespace Database\Factories;

use App\Models\Deal;
use App\Models\Workspace;
use App\Models\Contact;
use Illuminate\Database\Eloquent\Factories\Factory;

class DealFactory extends Factory
{
    protected $model = Deal::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'contact_id' => Contact::factory(),
            'title' => fake()->sentence(3),
            'amount' => fake()->randomFloat(2, 1000, 100000),
            'status' => 'open',
        ];
    }
}
