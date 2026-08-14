<?php

namespace App\Jobs;

use App\Models\Contact;
use App\Models\Company;
use App\Models\Deal;
use App\Models\DealImport;
use App\Models\PipelineStage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportDealsJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public int $timeout = 600;
    public int $tries = 3;
    public int $backoff = 5;

    protected array $pipelineStageCache = [];
    protected array $pipelineStageNameCache = [];
    protected array $workspaceIdCache = [];
    protected array $userIdCache = [];

    public function __construct(
        public DealImport $import,
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

                if (empty($data['title'])) {
                    $failed++;
                    $errors[] = "Row " . ($processed + $failed) . ": Missing required 'title' field.";
                    continue;
                }

                $pipelineStageId = $this->resolvePipelineStageId($data, $workspaceId);

                $expectedCloseDate = $data['expected_close_date'] ?? $data['close_date'] ?? null;
                if ($expectedCloseDate && strtotime($expectedCloseDate) === false) {
                    $expectedCloseDate = null;
                } elseif ($expectedCloseDate) {
                    $expectedCloseDate = date('Y-m-d', strtotime($expectedCloseDate));
                }

                $amount = $data['amount'] ?? null;
                if ($amount === null || !is_numeric($amount)) {
                    $amount = 0;
                }
                $amount = (float) $amount;

                $contactId = $this->resolveWorkspaceId($data['contact_id'] ?? null, Contact::class, $workspaceId);
                $companyId = $this->resolveWorkspaceId($data['company_id'] ?? null, Company::class, $workspaceId);
                $assignedTo = $this->resolveUserId($data['assigned_to'] ?? $data['owner_id'] ?? null, $workspaceId);

                $customData = [];
                foreach (['deal_type', 'priority', 'probability'] as $field) {
                    if (isset($data[$field]) && $data[$field] !== '') {
                        $customData[$field] = is_numeric($data[$field]) ? (float) $data[$field] : $data[$field];
                    }
                }

                $status = $data['status'] ?? 'open';
                if ($status === '') {
                    $status = 'open';
                }

                $batch[] = [
                    'id' => (string) Str::uuid(),
                    'workspace_id' => $workspaceId,
                    'contact_id' => $contactId,
                    'company_id' => $companyId,
                    'stage_id' => null,
                    'pipeline_stage_id' => $pipelineStageId,
                    'assigned_to' => $assignedTo,
                    'title' => $data['title'],
                    'amount' => $amount,
                    'status' => $status,
                    'value' => $amount,
                    'expected_close_date' => $expectedCloseDate,
                    'custom_data' => empty($customData) ? null : json_encode($customData),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                $processed++;

                if (count($batch) >= $batchSize) {
                    DB::transaction(fn () => Deal::forWorkspace($workspaceId)->insert($batch));
                    $batch = [];

                    $this->import->update([
                        'processed_rows' => $processed,
                        'failed_rows' => $failed,
                        'errors' => $errors,
                    ]);
                }
            }

            if (!empty($batch)) {
                DB::transaction(fn () => Deal::forWorkspace($workspaceId)->insert($batch));
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

    protected function resolvePipelineStageId(array $data, string $workspaceId): ?string
    {
        $stageId = $data['pipeline_stage_id'] ?? $data['stage_id'] ?? null;

        if ($stageId) {
            if (!isset($this->pipelineStageCache[$stageId])) {
                $this->pipelineStageCache[$stageId] = $this->idBelongsToWorkspace(PipelineStage::class, $stageId, $workspaceId);
            }
            if ($this->pipelineStageCache[$stageId]) {
                return $stageId;
            }
        }

        if (isset($data['stage']) && $data['stage'] !== '') {
            $stageName = trim($data['stage']);
            if (!isset($this->pipelineStageNameCache[$stageName])) {
                $stage = PipelineStage::where('name', 'like', '%' . $stageName . '%')
                    ->whereHas('pipeline', fn ($q) => $q->where('workspace_id', $workspaceId))
                    ->first();
                $this->pipelineStageNameCache[$stageName] = $stage?->id ?: null;
            }
            return $this->pipelineStageNameCache[$stageName];
        }

        return null;
    }

    protected function resolveWorkspaceId(?string $id, string $model, string $workspaceId): ?string
    {
        if (!$id) {
            return null;
        }

        $cacheKey = $model . ':' . $id;
        if (!isset($this->workspaceIdCache[$cacheKey])) {
            $this->workspaceIdCache[$cacheKey] = $this->idBelongsToWorkspace($model, $id, $workspaceId);
        }

        return $this->workspaceIdCache[$cacheKey] ? $id : null;
    }

    protected function idBelongsToWorkspace(string $model, string $id, string $workspaceId): bool
    {
        if ($model === PipelineStage::class) {
            return PipelineStage::whereHas('pipeline', fn ($q) => $q->where('workspace_id', $workspaceId))
                ->whereKey($id)
                ->exists();
        }
        return $model::query()->where('workspace_id', $workspaceId)->whereKey($id)->exists();
    }

    protected function resolveUserId(?string $id, string $workspaceId): ?string
    {
        if (!$id) {
            return null;
        }

        if (!isset($this->userIdCache[$id])) {
            $exists = DB::table('workspace_user')
                ->where('workspace_id', $workspaceId)
                ->where('user_id', $id)
                ->exists();
            $this->userIdCache[$id] = $exists;
        }

        return $this->userIdCache[$id] ? $id : null;
    }
}
