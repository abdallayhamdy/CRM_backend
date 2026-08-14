<?php

namespace Database\Factories;

use App\Models\Property;
use App\Models\Workspace;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PropertyFactory extends Factory
{
    protected $model = Property::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'created_by' => User::factory(),
            'name' => fake()->unique()->word() . '_' . fake()->randomNumber(3),
            'label' => fake()->words(2, true),
            'field_type' => fake()->randomElement(['single_line_text', 'multi_line_text', 'number', 'date', 'dropdown', 'boolean']),
            'object_type' => fake()->randomElement(['contact', 'deal', 'company', 'ticket', 'product']),
            'group_name' => fake()->optional()->word(),
            'description' => fake()->optional()->sentence(),
            'is_required' => false,
            'is_archived' => false,
            'show_in_forms' => true,
            'display_order' => null,
            'options' => null,
            'settings' => null,
        ];
    }
}
