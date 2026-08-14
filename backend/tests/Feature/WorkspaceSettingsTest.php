<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\User;
use App\Models\Workspace;
use App\Models\AuditLog;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class WorkspaceSettingsTest extends TestCase
{
    use TestHelpers;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpWorkspace();
    }

    private function authenticateAsOwner(): void
    {
        $this->adminUser->syncRoles('Workspace Owner');
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
    }

    private function authenticateAsAdmin(): void
    {
        $this->adminUser->syncRoles('Workspace Admin');
        \Laravel\Sanctum\Sanctum::actingAs($this->adminUser);
    }

    private function authenticateStandardUser(): void
    {
        $this->standardUser->syncRoles('Workspace Member');
        \Laravel\Sanctum\Sanctum::actingAs($this->standardUser);
    }

    public function test_owner_can_get_workspace_settings(): void
    {
        $this->authenticateAsOwner();

        $response = $this->getJson('/api/workspace/settings');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'status',
                'max_users',
                'timezone',
                'fiscal_year_start',
                'industry',
                'company_name',
                'company_domain',
                'company_address',
                'company_address2',
                'company_city',
                'company_state',
                'company_zip',
                'company_country',
                'currency',
                'currency_symbol',
                'default_language',
                'default_date_format',
                'logo_path',
                'created_at',
            ],
        ]);
    }

    public function test_owner_can_update_workspace_settings(): void
    {
        $this->authenticateAsOwner();

        $response = $this->patchJson('/api/workspace/settings', [
            'name' => 'Updated Workspace',
            'timezone' => 'America/New_York',
            'industry' => 'Technology',
            'company_name' => 'Acme Corp',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'name' => 'Updated Workspace',
            'timezone' => 'America/New_York',
            'industry' => 'Technology',
            'company_name' => 'Acme Corp',
        ]);

        $this->assertDatabaseHas('workspaces', [
            'id' => $this->workspace->id,
            'name' => 'Updated Workspace',
            'timezone' => 'America/New_York',
            'industry' => 'Technology',
            'company_name' => 'Acme Corp',
        ]);
    }

    public function test_admin_can_update_workspace_settings(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->patchJson('/api/workspace/settings', [
            'name' => 'Admin Updated',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'Admin Updated']);
    }

    public function test_standard_user_cannot_update_workspace_settings(): void
    {
        $this->authenticateStandardUser();

        $response = $this->patchJson('/api/workspace/settings', [
            'name' => 'Should Fail',
        ]);

        $response->assertStatus(403);
    }

    public function test_standard_user_cannot_get_workspace_settings(): void
    {
        $this->authenticateStandardUser();

        $response = $this->getJson('/api/workspace/settings');

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_access_workspace_settings(): void
    {
        $response = $this->getJson('/api/workspace/settings');

        $response->assertStatus(401);
    }

    public function test_update_validates_name_max_length(): void
    {
        $this->authenticateAsOwner();

        $response = $this->patchJson('/api/workspace/settings', [
            'name' => str_repeat('a', 256),
        ]);

        $this->assertValidationError($response);
    }

    public function test_update_validates_timezone_max_length(): void
    {
        $this->authenticateAsOwner();

        $response = $this->patchJson('/api/workspace/settings', [
            'timezone' => str_repeat('a', 65),
        ]);

        $this->assertValidationError($response);
    }

    public function test_owner_can_upload_logo(): void
    {
        Storage::fake('public');

        $this->authenticateAsOwner();

        $file = UploadedFile::fake()->image('logo.png', 200, 200)->size(100);

        $response = $this->post('/api/workspace/settings/logo', [
            'logo' => $file,
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'logo_path',
                'logo_url',
            ],
            'message',
        ]);

        $this->assertDatabaseHas('workspaces', [
            'id' => $this->workspace->id,
        ]);

        Storage::disk('public')->assertExists('workspace-logos/' . $this->workspace->id . '/' . $file->hashName());
    }

    public function test_standard_user_cannot_upload_logo(): void
    {
        Storage::fake('public');

        $this->authenticateStandardUser();

        $file = UploadedFile::fake()->image('logo.png', 200, 200)->size(100);

        $response = $this->post('/api/workspace/settings/logo', [
            'logo' => $file,
        ]);

        $response->assertStatus(403);
    }

    public function test_logo_upload_validates_file_is_image(): void
    {
        Storage::fake('public');

        $this->authenticateAsOwner();

        $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        $response = $this->post('/api/workspace/settings/logo', [
            'logo' => $file,
        ]);

        $this->assertValidationError($response);
    }

    public function test_logo_upload_validates_max_size(): void
    {
        Storage::fake('public');

        $this->authenticateAsOwner();

        $file = UploadedFile::fake()->image('logo.png', 200, 200)->size(3000);

        $response = $this->post('/api/workspace/settings/logo', [
            'logo' => $file,
        ]);

        $this->assertValidationError($response);
    }

    public function test_update_replaces_previous_logo(): void
    {
        Storage::fake('public');

        $this->authenticateAsOwner();

        $file1 = UploadedFile::fake()->image('logo1.png', 200, 200)->size(100);
        $this->post('/api/workspace/settings/logo', ['logo' => $file1]);

        $file2 = UploadedFile::fake()->image('logo2.png', 200, 200)->size(100);
        $response = $this->post('/api/workspace/settings/logo', ['logo' => $file2]);

        $response->assertStatus(200);

        Storage::disk('public')->assertMissing('workspace-logos/' . $this->workspace->id . '/' . $file1->hashName());
        Storage::disk('public')->assertExists('workspace-logos/' . $this->workspace->id . '/' . $file2->hashName());
    }

    public function test_owner_can_update_company_address2(): void
    {
        $this->authenticateAsOwner();

        $response = $this->patchJson('/api/workspace/settings', [
            'company_address2' => 'Suite 100',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('workspaces', [
            'id' => $this->workspace->id,
            'company_address2' => 'Suite 100',
        ]);
    }

    public function test_owner_can_update_currency(): void
    {
        $this->authenticateAsOwner();

        $response = $this->patchJson('/api/workspace/settings', [
            'currency' => 'EUR',
            'currency_symbol' => '€',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'currency' => 'EUR',
            'currency_symbol' => '€',
        ]);
        $this->assertDatabaseHas('workspaces', [
            'id' => $this->workspace->id,
            'currency' => 'EUR',
            'currency_symbol' => '€',
        ]);
    }

    public function test_owner_can_update_default_language_and_date_format(): void
    {
        $this->authenticateAsOwner();

        $response = $this->patchJson('/api/workspace/settings', [
            'default_language' => 'fr',
            'default_date_format' => 'eu',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'default_language' => 'fr',
            'default_date_format' => 'eu',
        ]);
        $this->assertDatabaseHas('workspaces', [
            'id' => $this->workspace->id,
            'default_language' => 'fr',
            'default_date_format' => 'eu',
        ]);
    }

    public function test_owner_can_update_all_account_defaults_at_once(): void
    {
        $this->authenticateAsOwner();

        $response = $this->patchJson('/api/workspace/settings', [
            'name' => 'My Workspace',
            'timezone' => 'UTC +01:00 Central European Time',
            'fiscal_year_start' => 'apr',
            'industry' => 'technology',
            'company_name' => 'Acme Corp',
            'company_domain' => 'https://acme.com',
            'company_address' => '123 Main St',
            'company_address2' => 'Suite 100',
            'company_city' => 'New York',
            'company_state' => 'NY',
            'company_zip' => '10001',
            'company_country' => 'US',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'default_language' => 'en',
            'default_date_format' => 'eu',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('workspaces', [
            'id' => $this->workspace->id,
            'name' => 'My Workspace',
            'timezone' => 'UTC +01:00 Central European Time',
            'fiscal_year_start' => 'apr',
            'industry' => 'technology',
            'company_name' => 'Acme Corp',
            'company_address2' => 'Suite 100',
            'currency' => 'EUR',
            'currency_symbol' => '€',
            'default_language' => 'en',
            'default_date_format' => 'eu',
        ]);
    }

    public function test_update_creates_audit_log(): void
    {
        $this->authenticateAsOwner();

        $this->patchJson('/api/workspace/settings', [
            'name' => 'Audited Workspace',
            'industry' => 'Finance',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
            'action' => 'updated',
            'category' => 'settings',
            'subcategory' => 'workspace',
            'auditable_type' => Workspace::class,
            'auditable_id' => $this->workspace->id,
            'source' => 'web',
        ]);

        $log = AuditLog::where('workspace_id', $this->workspace->id)
            ->where('action', 'updated')
            ->first();

        $this->assertNotNull($log);
        $this->assertIsArray($log->changes);
        $this->assertArrayHasKey('old', $log->changes);
        $this->assertArrayHasKey('new', $log->changes);
        $this->assertEquals('Audited Workspace', $log->changes['new']['name']);
        $this->assertEquals('Finance', $log->changes['new']['industry']);
    }

    public function test_update_without_changes_does_not_create_audit_log(): void
    {
        $this->authenticateAsOwner();

        $originalCount = AuditLog::count();

        $this->patchJson('/api/workspace/settings', []);

        $this->assertEquals($originalCount, AuditLog::count());
    }
}
