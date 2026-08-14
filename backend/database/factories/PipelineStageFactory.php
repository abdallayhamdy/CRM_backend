<?php

namespace Database\Factories;

use App\Models\PipelineStage;
use App\Models\Pipeline;
use Illuminate\Database\Eloquent\Factories\Factory;

class PipelineStageFactory extends Factory
{
    protected $model = PipelineStage::class;

    public function definition(): array
    {
        return [
            'pipeline_id' => Pipeline::factory(),
            'name' => fake()->word(),
            'display_order' => fake()->numberBetween(1, 10),
            'win_probability' => fake()->numberBetween(0, 100),
        ];
    }
}
