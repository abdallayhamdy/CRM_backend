<?php

namespace Database\Factories;

use App\Models\Invitation;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class InvitationFactory extends Factory
{
    protected $model = Invitation::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'email' => fake()->safeEmail(),
            'role_name' => 'Workspace Member',
            'token' => Str::random(60),
            'expires_at' => now()->addDays(7),
        ];
    }
}
