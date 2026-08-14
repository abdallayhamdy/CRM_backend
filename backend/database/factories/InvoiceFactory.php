<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $issuedDate = fake()->dateTimeBetween('-6 months', 'now');
        $dueDate = (clone $issuedDate)->modify('+14 days');
        $status = fake()->randomElement(['Paid', 'Pending', 'Overdue']);

        return [
            'workspace_id' => Workspace::factory(),
            'amount' => fake()->randomElement([49, 149, 399]),
            'status' => $status,
            'issued_date' => $issuedDate->format('Y-m-d'),
            'due_date' => $dueDate->format('Y-m-d'),
            'paid_date' => $status === 'Paid' ? $dueDate->modify('-3 days')->format('Y-m-d') : null,
        ];
    }

    public function paid(): static
    {
        return $this->state(fn () => [
            'status' => 'Paid',
            'paid_date' => fake()->dateTimeBetween('-3 months', 'now')->format('Y-m-d'),
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => 'Pending',
            'paid_date' => null,
        ]);
    }

    public function overdue(): static
    {
        return $this->state(fn () => [
            'status' => 'Overdue',
            'paid_date' => null,
        ]);
    }
}
