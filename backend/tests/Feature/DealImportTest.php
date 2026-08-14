<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\DealImport;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use App\Jobs\ImportDealsJob;
use Illuminate\Support\Facades\Storage;

class DealImportTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_import_csv(): void
    {
        Queue::fake();
        Storage::fake('local');

        $this->authenticateAsAdmin();

        $csvContent = "title,amount,status\nBig Deal,1000,open\nAnother Deal,500,open";
        $file = UploadedFile::fake()->createWithContent('deals.csv', $csvContent);

        $response = $this->postJson('/api/deals/import', [
            'file' => $file,
        ]);

        $response->assertStatus(202);
        Queue::assertPushed(ImportDealsJob::class);
    }

    public function test_import_requires_csv_file(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/deals/import', []);

        $this->assertValidationError($response);
    }

    public function test_import_rejects_invalid_file_type(): void
    {
        $this->authenticateAsAdmin();

        $file = UploadedFile::fake()->create('document.pdf', 100);
        $response = $this->postJson('/api/deals/import', [
            'file' => $file,
        ]);

        $this->assertValidationError($response);
    }

    public function test_viewer_without_create_deals_cannot_import(): void
    {
        $this->setUpWorkspace();

        $viewer = \App\Models\User::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);
        $viewer->assignRole('Workspace Viewer');
        $viewer->workspaces()->attach($this->workspace->id, [
            'role_name' => 'Workspace Viewer',
            'is_active' => true,
        ]);
        \Laravel\Sanctum\Sanctum::actingAs($viewer);

        $file = UploadedFile::fake()->create('deals.csv', 100);
        $response = $this->postJson('/api/deals/import', [
            'file' => $file,
        ]);

        $this->assertForbidden($response);
    }

    public function test_import_job_creates_deals(): void
    {
        Storage::fake('local');
        $this->setUpWorkspace();

        $path = "imports/{$this->workspace->id}/deals.csv";
        Storage::disk('local')->put($path, "title,amount,status,expected_close_date\nBig Deal,1000,open,2026-12-01\nAnother Deal,,won,\n");

        $import = DealImport::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
            'file_path' => $path,
        ]);

        (new ImportDealsJob($import, $path))->handle();

        $this->assertDatabaseHas('deals', [
            'title' => 'Big Deal',
            'amount' => 1000,
            'status' => 'open',
            'expected_close_date' => '2026-12-01',
        ]);
        $this->assertDatabaseHas('deals', [
            'title' => 'Another Deal',
            'amount' => 0,
            'status' => 'won',
        ]);
        $this->assertDatabaseHas('deal_imports', ['id' => $import->id, 'status' => 'completed']);
    }

    public function test_admin_can_view_import_result(): void
    {
        $this->authenticateAsAdmin();
        $import = DealImport::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
        ]);

        $response = $this->getJson('/api/deals/import/' . $import->id);

        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $import->id);
    }

    public function test_user_cannot_view_another_workspace_import(): void
    {
        $this->authenticateAsAdmin();
        $otherImport = DealImport::factory()->create();

        $response = $this->getJson('/api/deals/import/' . $otherImport->id);

        $this->assertNotFound($response);
    }
}
