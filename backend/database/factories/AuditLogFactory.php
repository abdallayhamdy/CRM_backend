<?php

namespace Database\Factories;

use App\Models\AuditLog;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

class AuditLogFactory extends Factory
{
    protected $model = AuditLog::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'user_id' => User::factory(),
            'action' => fake()->randomElement(['created', 'updated', 'deleted']),
            'category' => fake()->randomElement(['Crm Record View', 'Login', 'Security', 'Settings', 'Deal', 'Contact', 'Company', 'Task']),
            'subcategory' => fake()->optional(0.7)->randomElement(['Contact', 'Login Succeeded', 'Login Failed', 'Deal', 'Company', 'Task', 'Setting']),
            'auditable_type' => 'App\\Models\\Contact',
            'auditable_id' => fake()->uuid(),
            'changes' => null,
            'assisted_by' => null,
            'source' => fake()->optional(0.5)->randomElement(['Web App', 'Mobile App', 'API', 'Import']),
            'source_url' => null,
        ];
    }
}
