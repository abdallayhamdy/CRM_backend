<?php

namespace Database\Factories;

use App\Models\Stage;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

class StageFactory extends Factory
{
    protected $model = Stage::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'object_type' => 'deal',
            'name' => fake()->word(),
            'color' => fake()->hexColor(),
            'order' => fake()->numberBetween(1, 10),
        ];
    }
}
