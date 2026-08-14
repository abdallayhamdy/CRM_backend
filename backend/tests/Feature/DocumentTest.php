<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\Document;
use App\Models\Company;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DocumentTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_list_documents(): void
    {
        $this->authenticateAsAdmin();
        Document::factory()->count(3)->create([
            'workspace_id' => $this->workspace->id,
            'uploaded_by' => $this->adminUser->id,
        ]);

        $response = $this->getJson('/api/documents');

        $response->assertStatus(200);
    }

    public function test_admin_can_show_document(): void
    {
        $this->authenticateAsAdmin();
        $document = Document::factory()->create([
            'workspace_id' => $this->workspace->id,
            'uploaded_by' => $this->adminUser->id,
        ]);

        $response = $this->getJson('/api/documents/' . $document->id);

        $response->assertStatus(200);
    }

    public function test_admin_can_update_document(): void
    {
        $this->authenticateAsAdmin();
        $document = Document::factory()->create([
            'workspace_id' => $this->workspace->id,
            'uploaded_by' => $this->adminUser->id,
        ]);

        $response = $this->putJson('/api/documents/' . $document->id, [
            'name' => 'Updated Name.pdf',
        ]);

        $this->assertResourceUpdated($response);
        $this->assertDatabaseHas('documents', [
            'id' => $document->id,
            'name' => 'Updated Name.pdf',
        ]);
    }

    public function test_admin_can_delete_document(): void
    {
        $this->authenticateAsAdmin();
        $document = Document::factory()->create([
            'workspace_id' => $this->workspace->id,
            'uploaded_by' => $this->adminUser->id,
        ]);

        $response = $this->deleteJson('/api/documents/' . $document->id);

        $this->assertResourceDeleted($response);
        $this->assertDatabaseMissing('documents', ['id' => $document->id]);
    }

    public function test_create_document_requires_file(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/documents', []);

        $this->assertValidationError($response);
    }

    public function test_admin_can_upload_document(): void
    {
        Storage::fake('local');
        $this->authenticateAsAdmin();
        $company = Company::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $file = UploadedFile::fake()->create('test.pdf', 1024);

        $response = $this->postJson('/api/documents', [
            'file' => $file,
            'documentable_type' => 'company',
            'documentable_id' => $company->id,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('documents', [
            'documentable_type' => 'App\Models\Company',
            'documentable_id' => $company->id,
            'name' => 'test.pdf',
        ]);
    }

    public function test_upload_document_invalid_type(): void
    {
        Storage::fake('local');
        $this->authenticateAsAdmin();
        $company = Company::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $file = UploadedFile::fake()->create('test.php', 1024);

        $response = $this->postJson('/api/documents', [
            'file' => $file,
            'documentable_type' => 'company',
            'documentable_id' => $company->id,
        ]);

        $this->assertValidationError($response);
    }

    public function test_admin_can_download_document(): void
    {
        Storage::fake('local');
        $this->authenticateAsAdmin();
        $company = Company::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $file = UploadedFile::fake()->create('downloadable.pdf', 1024);
        $path = $file->store("documents/{$this->workspace->id}", 'local');

        $document = Document::factory()->create([
            'workspace_id' => $this->workspace->id,
            'uploaded_by' => $this->adminUser->id,
            'file_path' => $path,
            'documentable_type' => 'App\Models\Company',
            'documentable_id' => $company->id,
        ]);

        $response = $this->getJson('/api/documents/' . $document->id . '/download');

        $response->assertStatus(200);
    }

    public function test_cannot_download_another_workspace_document(): void
    {
        Storage::fake('local');
        $this->authenticateAsAdmin();
        $otherDocument = Document::factory()->create();

        $response = $this->getJson('/api/documents/' . $otherDocument->id . '/download');

        $this->assertNotFound($response);
    }

    public function test_user_cannot_view_another_workspace_document(): void
    {
        $this->authenticateAsAdmin();
        $otherDocument = Document::factory()->create();

        $response = $this->getJson('/api/documents/' . $otherDocument->id);

        $this->assertNotFound($response);
    }

    public function test_upload_fails_deletes_stored_file(): void
    {
        Storage::fake('local');
        $this->authenticateAsAdmin();
        $company = Company::factory()->create([
            'workspace_id' => $this->workspace->id,
        ]);

        $file = UploadedFile::fake()->create('test.pdf', 1024);

        // We mock DB::transaction to throw an exception
        \Illuminate\Support\Facades\DB::shouldReceive('transaction')
            ->once()
            ->andThrow(new \Exception('Simulated database failure'));

        $response = $this->postJson('/api/documents', [
            'file' => $file,
            'documentable_type' => 'company',
            'documentable_id' => $company->id,
        ]);

        $response->assertStatus(500);

        // Assert that no files are left in the local storage directory
        $files = Storage::disk('local')->allFiles();
        $this->assertEmpty($files, 'File was not deleted when database insertion failed.');
    }
}
