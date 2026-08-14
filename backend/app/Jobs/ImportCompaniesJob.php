<?php

namespace App\Jobs;

use App\Models\Company;
use App\Models\CompanyImport;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportCompaniesJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public int $timeout = 600;
    public int $tries = 3;
    public int $backoff = 5;

    public function __construct(
        public CompanyImport $import,
        public string $filePath,
    ) {}

    public function handle(): void
    {
        $path = Storage::disk('local')->path($this->filePath);

        if (!file_exists($path)) {
            $this->import->update(['status' => 'failed', 'errors' => ['File not found.']]);
            return;
        }

        $handle = fopen($path, 'r');
        $header = fgetcsv($handle);

        if (!$header) {
            $this->import->update(['status' => 'failed', 'errors' => ['Invalid CSV file.']]);
            fclose($handle);
            Storage::disk('local')->delete($this->filePath);
            return;
        }

        $header = array_map('trim', $header);
        $workspaceId = $this->import->workspace_id;
        $userId = $this->import->user_id;

        $batch = [];
        $batchSize = 50;
        $processed = 0;
        $failed = 0;
        $errors = [];

        try {
            while (($row = fgetcsv($handle)) !== false) {
                if (count($header) !== count($row)) {
                    $failed++;
                    $errors[] = "Row " . ($processed + $failed) . ": Column count mismatch.";
                    continue;
                }

                $data = array_combine($header, array_map('trim', $row));

                if (empty($data['name'])) {
                    $failed++;
                    $errors[] = "Row " . ($processed + $failed) . ": Missing required 'name' field.";
                    continue;
                }

                $batch[] = [
                    'id' => (string) Str::uuid(),
                    'workspace_id' => $workspaceId,
                    'name' => $data['name'],
                    'website' => $data['domain'] ?? $data['website'] ?? null,
                    'industry' => $data['industry'] ?? null,
                    'phone' => $data['phone'] ?? null,
                    'email' => $data['email'] ?? null,
                    'created_by' => $userId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                $processed++;

                if (count($batch) >= $batchSize) {
                    DB::transaction(fn () => Company::forWorkspace($workspaceId)->insert($batch));
                    $batch = [];

                    $this->import->update([
                        'processed_rows' => $processed,
                        'failed_rows' => $failed,
                        'errors' => $errors,
                    ]);
                }
            }

            if (!empty($batch)) {
                DB::transaction(fn () => Company::forWorkspace($workspaceId)->insert($batch));
            }

            $this->import->update([
                'total_rows' => $processed + $failed,
                'processed_rows' => $processed,
                'failed_rows' => $failed,
                'status' => $failed > 0 ? 'completed_with_errors' : 'completed',
                'errors' => $errors,
            ]);

            Storage::disk('local')->delete($this->filePath);
        } finally {
            fclose($handle);
        }
    }

    public function failed(\Throwable $e): void
    {
        Storage::disk('local')->delete($this->filePath);

        $this->import->update([
            'status' => 'failed',
            'errors' => [$e->getMessage()],
        ]);
    }
}
