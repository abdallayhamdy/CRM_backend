<?php

namespace Database\Factories;

use App\Models\UserViewPreference;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserViewPreferenceFactory extends Factory
{
    protected $model = UserViewPreference::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'object_type' => fake()->randomElement(['contacts', 'deals', 'companies']),
            'visible_columns' => ['id', 'name', 'email'],
            'column_order' => ['name', 'email', 'id'],
        ];
    }
}
