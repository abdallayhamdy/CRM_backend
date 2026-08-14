<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Contact;

class PaginationLimitTest extends TestCase
{
    use TestHelpers;

    public function test_excessive_limit_is_capped_at_one_hundred(): void
    {
        $this->authenticateAsAdmin();
        Contact::factory()->count(120)->create(['workspace_id' => $this->workspace->id]);

        $response = $this->getJson('/api/contacts?limit=999999999');

        $response->assertStatus(200);
        $response->assertJsonPath('meta.per_page', 100);
        $this->assertCount(100, $response->json('data'));
    }

    public function test_default_limit_applied_when_omitted(): void
    {
        $this->authenticateAsAdmin();
        Contact::factory()->count(20)->create(['workspace_id' => $this->workspace->id]);

        $response = $this->getJson('/api/contacts');

        $response->assertStatus(200);
        $response->assertJsonPath('meta.per_page', 15);
        $this->assertCount(15, $response->json('data'));
    }

    public function test_reasonable_limit_is_honored(): void
    {
        $this->authenticateAsAdmin();
        Contact::factory()->count(20)->create(['workspace_id' => $this->workspace->id]);

        $response = $this->getJson('/api/contacts?limit=5');

        $response->assertStatus(200);
        $response->assertJsonPath('meta.per_page', 5);
        $this->assertCount(5, $response->json('data'));
    }

    public function test_invalid_limit_falls_back_to_default(): void
    {
        $this->authenticateAsAdmin();
        Contact::factory()->count(20)->create(['workspace_id' => $this->workspace->id]);

        $response = $this->getJson('/api/contacts?limit=abc');

        $response->assertStatus(200);
        $response->assertJsonPath('meta.per_page', 15);
    }
}
