<?php

namespace Database\Factories;

use App\Models\DealImport;
use App\Models\Workspace;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DealImportFactory extends Factory
{
    protected $model = DealImport::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'user_id' => User::factory(),
            'file_name' => 'deals.csv',
            'file_path' => 'imports/' . fake()->uuid() . '.csv',
            'total_rows' => 10,
            'processed_rows' => 0,
            'failed_rows' => 0,
            'status' => 'pending',
        ];
    }
}
