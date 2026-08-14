<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\TestHelpers;
use App\Models\ContactImport;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use App\Jobs\ImportContactsJob;
use Illuminate\Support\Facades\Storage;

class ContactImportTest extends TestCase
{
    use TestHelpers;

    public function test_admin_can_import_csv(): void
    {
        Queue::fake();
        Storage::fake('local');

        $this->authenticateAsAdmin();

        $csvContent = "first_name,last_name,email\nJohn,Doe,john@test.com\nJane,Doe,jane@test.com";
        $file = UploadedFile::fake()->createWithContent('contacts.csv', $csvContent);

        $response = $this->postJson('/api/contacts/import', [
            'file' => $file,
        ]);

        $response->assertStatus(202);
        Queue::assertPushed(ImportContactsJob::class);
    }

    public function test_import_requires_csv_file(): void
    {
        $this->authenticateAsAdmin();

        $response = $this->postJson('/api/contacts/import', []);

        $this->assertValidationError($response);
    }

    public function test_import_rejects_invalid_file_type(): void
    {
        $this->authenticateAsAdmin();

        $file = UploadedFile::fake()->create('document.pdf', 100);
        $response = $this->postJson('/api/contacts/import', [
            'file' => $file,
        ]);

        $this->assertValidationError($response);
    }

    public function test_import_job_deletes_file_on_success(): void
    {
        Storage::fake('local');
        $this->authenticateAsAdmin();

        $import = ContactImport::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
        ]);

        $path = "imports/{$this->workspace->id}/contacts.csv";
        Storage::disk('local')->put($path, "first_name,last_name,email\nJohn,Doe,john@test.com");

        (new ImportContactsJob($import, $path))->handle();

        Storage::disk('local')->assertMissing($path);
        $this->assertDatabaseHas('contact_imports', [
            'id' => $import->id,
            'status' => 'completed',
        ]);
    }

    public function test_import_job_deletes_file_when_csv_invalid(): void
    {
        Storage::fake('local');
        $this->authenticateAsAdmin();

        $import = ContactImport::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
        ]);

        $path = "imports/{$this->workspace->id}/contacts.csv";
        Storage::disk('local')->put($path, '');

        (new ImportContactsJob($import, $path))->handle();

        Storage::disk('local')->assertMissing($path);
        $this->assertDatabaseHas('contact_imports', [
            'id' => $import->id,
            'status' => 'failed',
        ]);
    }

    public function test_import_job_failed_deletes_file(): void
    {
        Storage::fake('local');
        $this->authenticateAsAdmin();

        $import = ContactImport::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
        ]);

        $path = "imports/{$this->workspace->id}/contacts.csv";
        Storage::disk('local')->put($path, "first_name,last_name,email\nJohn,Doe,john@test.com");

        (new ImportContactsJob($import, $path))->failed(new \RuntimeException('Boom'));

        Storage::disk('local')->assertMissing($path);
        $this->assertDatabaseHas('contact_imports', [
            'id' => $import->id,
            'status' => 'failed',
        ]);
    }

    public function test_admin_can_view_import_result(): void
    {
        $this->authenticateAsAdmin();
        $import = ContactImport::factory()->create([
            'workspace_id' => $this->workspace->id,
            'user_id' => $this->adminUser->id,
        ]);

        $response = $this->getJson('/api/contacts/import/' . $import->id);

        $response->assertStatus(200);
    }

    public function test_user_cannot_view_another_workspace_import(): void
    {
        $this->authenticateAsAdmin();
        $otherImport = ContactImport::factory()->create();

        $response = $this->getJson('/api/contacts/import/' . $otherImport->id);

        $this->assertNotFound($response);
    }
}
