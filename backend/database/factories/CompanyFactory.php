<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyFactory extends Factory
{
    protected $model = Company::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'name' => fake()->company(),
            'email' => fake()->companyEmail(),
            'phone' => fake()->phoneNumber(),
            'industry' => fake()->word(),
            'website' => fake()->url(),
        ];
    }
}
