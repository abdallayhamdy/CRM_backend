<?php

namespace Database\Factories;

use App\Models\ContactImport;
use App\Models\Workspace;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ContactImportFactory extends Factory
{
    protected $model = ContactImport::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'user_id' => User::factory(),
            'file_name' => 'contacts.csv',
            'file_path' => 'imports/' . fake()->uuid() . '.csv',
            'total_rows' => 10,
            'processed_rows' => 0,
            'failed_rows' => 0,
            'status' => 'pending',
        ];
    }
}
