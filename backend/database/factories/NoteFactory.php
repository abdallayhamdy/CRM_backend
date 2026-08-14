<?php

namespace Database\Factories;

use App\Models\Note;
use App\Models\Workspace;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class NoteFactory extends Factory
{
    protected $model = Note::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'user_id' => User::factory(),
            'content' => fake()->paragraph(),
            'notable_type' => 'App\Models\Company',
            'notable_id' => 1,
        ];
    }
}
