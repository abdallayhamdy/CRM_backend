<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Product;

class SearchTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_search_companies(): void
    {
        $this->authenticateAsAdmin();
        Company::factory()->create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Acme Corp',
        ]);

        $response = $this->getJson('/api/search/companies?q=Acme');

        $response->assertStatus(200);
    }

    public function test_search_companies_returns_matching_results(): void
    {
        $this->authenticateAsAdmin();
        Company::factory()->create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Acme Corp',
        ]);
        Company::factory()->create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Other Inc',
        ]);

        $response = $this->getJson('/api/search/companies?q=Acme');

        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'Acme Corp']);
        $response->assertJsonMissing(['name' => 'Other Inc']);
    }

    public function test_admin_can_search_contacts(): void
    {
        $this->authenticateAsAdmin();
        Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);

        $response = $this->getJson('/api/search/contacts?q=John');

        $response->assertStatus(200);
    }

    public function test_search_contacts_filters_by_assigned_to(): void
    {
        $this->authenticateAsAdmin();
        $contact = Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'assigned_to' => $this->adminUser->id,
            'first_name' => 'John',
        ]);
        Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'assigned_to' => null,
            'first_name' => 'Jane',
        ]);

        $response = $this->getJson('/api/search/contacts?assigned_to=' . $this->adminUser->id);

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $contact->id]);
    }

    public function test_admin_can_search_deals(): void
    {
        $this->authenticateAsAdmin();
        Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
            'title' => 'Big Deal',
        ]);

        $response = $this->getJson('/api/search/deals?q=Big');

        $response->assertStatus(200);
    }

    public function test_search_deals_filters_by_status(): void
    {
        $this->authenticateAsAdmin();
        Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
            'title' => 'Won Deal',
            'status' => 'won',
        ]);
        Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
            'title' => 'Lost Deal',
            'status' => 'lost',
        ]);

        $response = $this->getJson('/api/search/deals?status=won');

        $response->assertStatus(200);
        $response->assertJsonFragment(['title' => 'Won Deal']);
        $response->assertJsonMissing(['title' => 'Lost Deal']);
    }

    public function test_admin_can_search_products(): void
    {
        $this->authenticateAsAdmin();
        Product::factory()->create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Widget',
        ]);

        $response = $this->getJson('/api/search/products?q=Widget');

        $response->assertStatus(200);
    }

    public function test_unified_search_returns_results(): void
    {
        $this->authenticateAsAdmin();
        Company::factory()->create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Acme Corp',
        ]);
        Contact::factory()->create([
            'workspace_id' => $this->workspace->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
        ]);
        Deal::factory()->create([
            'workspace_id' => $this->workspace->id,
            'title' => 'Big Deal',
        ]);
        Product::factory()->create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Widget',
        ]);

        $response = $this->getJson('/api/search?q=Acme');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'contacts',
            'companies',
            'deals',
            'products',
        ]);
    }

    public function test_unified_search_returns_filtered_results(): void
    {
        $this->authenticateAsAdmin();
        Company::factory()->create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Acme Corp',
        ]);
        Company::factory()->create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Other Inc',
        ]);

        $response = $this->getJson('/api/search?q=Acme');

        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'Acme Corp']);
    }

    public function test_unified_search_returns_empty_when_no_query(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->getJson('/api/search');

        $response->assertStatus(200);
        $response->assertJson([
            'contacts' => [],
            'companies' => [],
            'deals' => [],
            'products' => [],
        ]);
    }

    public function test_search_requires_authentication(): void
    {
        $response = $this->getJson('/api/search/companies?q=test');
        $this->assertUnauthenticated($response);
    }
}
