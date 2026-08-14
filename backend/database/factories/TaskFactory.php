<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\Workspace;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'created_by' => User::factory(),
            'title' => fake()->sentence(4),
            'status' => 'pending',
            'taskable_type' => 'App\Models\Company',
            'taskable_id' => 1,
        ];
    }
}
