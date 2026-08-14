<?php

namespace Database\Factories;

use App\Models\Activity;
use App\Models\Workspace;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ActivityFactory extends Factory
{
    protected $model = Activity::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'user_id' => User::factory(),
            'type' => fake()->randomElement(['call', 'meeting', 'email']),
            'subject' => fake()->sentence(3),
            'description' => fake()->paragraph(),
            'activity_date' => fake()->dateTimeThisMonth(),
            'activitable_type' => 'App\Models\Company',
            'activitable_id' => 1,
        ];
    }
}
