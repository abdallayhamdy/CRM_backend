<?php

namespace App\Jobs;

use App\Models\Contact;
use App\Models\ContactImport;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportContactsJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public int $timeout = 600;
    public int $tries = 3;
    public int $backoff = 5;

    public function __construct(
        public ContactImport $import,
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
        $requiredFields = ['first_name', 'last_name'];
        $workspaceId = $this->import->workspace_id;
        $userId = $this->import->user_id;

        $batch = [];
        $batchSize = 50;
        $processed = 0;
        $failed = 0;
        $errors = [];

        // Collect only the emails present in the file, then load those that
        // already exist in this workspace in chunks — bounded by file size,
        // not by the total number of contacts in the workspace.
        $fileEmails = $this->collectFileEmails($handle, $header);
        $existingEmails = [];
        foreach (array_chunk(array_keys($fileEmails), 1000) as $chunk) {
            $placeholders = implode(',', array_fill(0, count($chunk), '?'));
            $found = Contact::forWorkspace($workspaceId)
                ->whereNotNull('email')
                ->whereRaw('LOWER(email) IN (' . $placeholders . ')', array_map('strtolower', $chunk))
                ->pluck('email')
                ->map(fn ($e) => strtolower(trim($e)));
            foreach ($found as $existingEmail) {
                $existingEmails[$existingEmail] = true;
            }
        }
        unset($fileEmails);

        // collectFileEmails() rewound the handle — consume the header line
        // again so the processing loop starts at the first data row.
        fgetcsv($handle);

        try {
            while (($row = fgetcsv($handle)) !== false) {
                if (count($header) !== count($row)) {
                    $failed++;
                    $errors[] = "Row " . ($processed + $failed + 1) . ": Column count mismatch.";
                    continue;
                }

                $data = array_combine($header, array_map('trim', $row));

                if (empty($data['first_name']) || empty($data['last_name'])) {
                    $failed++;
                    $errors[] = "Row " . ($processed + $failed + 1) . ": Missing required fields.";
                    continue;
                }

                $email = $data['email'] ?? null;

                if ($email) {
                    $normalizedEmail = strtolower(trim($email));
                    if (isset($existingEmails[$normalizedEmail])) {
                        $failed++;
                        $errors[] = "Row " . ($processed + $failed + 1) . ": Duplicate email '{$email}'.";
                        continue;
                    }
                    $existingEmails[$normalizedEmail] = true;
                }

                $batch[] = [
                    'id' => (string) Str::uuid(),
                    'workspace_id' => $workspaceId,
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'email' => $email,
                    'phone' => $data['phone'] ?? null,
                    'created_by' => $userId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                $processed++;

                if (count($batch) >= $batchSize) {
                    DB::transaction(fn () => Contact::forWorkspace($workspaceId)->insert($batch));
                    $batch = [];

                    $this->import->update([
                        'processed_rows' => $processed,
                        'failed_rows' => $failed,
                        'errors' => $errors,
                    ]);
                }
            }

            if (!empty($batch)) {
                DB::transaction(fn () => Contact::forWorkspace($workspaceId)->insert($batch));
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

    protected function collectFileEmails($handle, array $header): array
    {
        $emails = [];

        rewind($handle);

        $headerLine = fgetcsv($handle);

        if ($headerLine !== false) {
            $collectHeader = array_map('trim', $headerLine);
            while (($row = fgetcsv($handle)) !== false) {
                if (count($collectHeader) !== count($row)) {
                    continue;
                }
                $data = array_combine($collectHeader, array_map('trim', $row));
                $email = $data['email'] ?? null;
                if ($email) {
                    $emails[strtolower(trim($email))] = true;
                }
            }
        }

        rewind($handle);

        return $emails;
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
