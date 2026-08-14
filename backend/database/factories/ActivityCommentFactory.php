<?php

namespace Database\Factories;

use App\Models\ActivityComment;
use App\Models\Activity;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

class ActivityCommentFactory extends Factory
{
    protected $model = ActivityComment::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'activity_id' => Activity::factory(),
            'user_id' => User::factory(),
            'content' => fake()->paragraph(),
        ];
    }
}
