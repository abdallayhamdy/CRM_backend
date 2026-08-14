<?php

namespace Database\Factories;

use App\Models\Ticket;
use App\Models\Workspace;
use App\Models\Contact;
use Illuminate\Database\Eloquent\Factories\Factory;

class TicketFactory extends Factory
{
    protected $model = Ticket::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'contact_id' => Contact::factory(),
            'subject' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'status' => 'open',
            'priority' => 'medium',
        ];
    }
}
