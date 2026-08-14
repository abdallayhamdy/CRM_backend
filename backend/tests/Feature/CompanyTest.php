<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Company;
use App\Models\User;

class CompanyTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_list_companies(): void
    {
        $this->authenticateAsAdmin();
        Company::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/companies');

        $response->assertStatus(200);
    }

    public function test_admin_can_create_company(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/companies', [
            'name' => 'Test Company',
            'domain' => 'https://test.com',
            'industry' => 'Technology',
            'phone' => '01234567890',
        ]);

        $this->assertResourceCreated($response);
        $this->assertDatabaseHas('companies', [
            'name' => 'Test Company',
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_admin_can_show_company(): void
    {
        $this->authenticateAsAdmin();
        $company = Company::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/companies/' . $company->id);

        $this->assertResourceShown($response);
    }

    public function test_admin_can_update_company(): void
    {
        $this->authenticateAsAdmin();
        $company = Company::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->putJson('/api/companies/' . $company->id, [
            'name' => 'Updated Company',
        ]);

        $this->assertResourceUpdated($response);
        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'name' => 'Updated Company',
        ]);
    }

    public function test_admin_can_delete_company(): void
    {
        $this->authenticateAsAdmin();
        $company = Company::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->deleteJson('/api/companies/' . $company->id);

        $this->assertResourceDeleted($response);
        $this->assertSoftDeleted('companies', ['id' => $company->id]);
    }

    public function test_create_company_requires_name(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/companies', []);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_create_company_name_max_length(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/companies', [
            'name' => str_repeat('a', 256),
        ]);

        $this->assertValidationError($response);
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_unauthenticated_user_cannot_access_companies(): void
    {
        $response = $this->getJson('/api/companies');
        $this->assertUnauthenticated($response);
    }

    public function test_user_without_role_cannot_create_company(): void
    {
        $this->setUpWorkspace();
        $user = User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        \Laravel\Sanctum\Sanctum::actingAs($user);

        $response = $this->postJson('/api/companies', [
            'name' => 'Test',
        ]);

        $this->assertForbidden($response);
    }

    public function test_user_cannot_view_another_workspace_company(): void
    {
        $this->authenticateAsAdmin();
        $otherCompany = Company::factory()->create();

        $response = $this->getJson('/api/companies/' . $otherCompany->id);

        $this->assertNotFound($response);
    }

    public function test_user_cannot_update_another_workspace_company(): void
    {
        $this->authenticateAsAdmin();
        $otherCompany = Company::factory()->create();

        $response = $this->putJson('/api/companies/' . $otherCompany->id, [
            'name' => 'Hacked',
        ]);

        $this->assertNotFound($response);
    }

    public function test_user_cannot_delete_another_workspace_company(): void
    {
        $this->authenticateAsAdmin();
        $otherCompany = Company::factory()->create();

        $response = $this->deleteJson('/api/companies/' . $otherCompany->id);

        $this->assertNotFound($response);
    }

    public function test_list_companies_paginates(): void
    {
        $this->authenticateAsAdmin();
        Company::factory()->count(5)->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $response = $this->getJson('/api/companies?limit=2');

        $response->assertStatus(200);
    }

    public function test_list_companies_sorts_by_name(): void
    {
        $this->authenticateAsAdmin();
        Company::factory()->create([
            'workspace_id' => $this->workspace->id,
            'name' => 'A Company',
        ]);
        Company::factory()->create([
            'workspace_id' => $this->workspace->id,
            'name' => 'B Company',
        ]);

        $response = $this->getJson('/api/companies?sort_by=name&sort_dir=asc');

        $response->assertStatus(200);
    }
}
