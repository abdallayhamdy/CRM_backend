<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Backup;
use App\Models\RestoreHistory;
use App\Services\AuditService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BackupRestoreController extends Controller
{
    use AuthorizesRequests;
    public function indexBackups(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Backup::class);
        $workspace = $request->user()->currentWorkspace ?? $request->user()->workspace;

        $query = Backup::where('workspace_id', $workspace->id)
            ->orderBy('created_at', 'desc');

        $backups = $query->get()->map(function ($backup) {
            return [
                'id' => $backup->id,
                'workspace_id' => $backup->workspace_id,
                'type' => $backup->type,
                'status' => $backup->status,
                'backup_date' => $backup->backup_date?->format('Y-m-d\TH:i:s\Z'),
                'expires_on' => $backup->expires_on?->format('Y-m-d\TH:i:s\Z'),
                'size' => $backup->size,
                'created_by' => $backup->created_by,
                'download_url' => $backup->download_url,
                'created_at' => $backup->created_at?->format('Y-m-d\TH:i:s\Z'),
            ];
        });

        return response()->json(['data' => $backups]);
    }

    public function storeBackup(Request $request): JsonResponse
    {
        $this->authorize('create', Backup::class);

        $user = $request->user();
        $workspace = $user->currentWorkspace ?? $user->workspace;

        $validated = $request->validate([
            'type' => 'required|string|max:50',
            'status' => 'nullable|string|max:50',
            'backup_date' => 'required|date',
            'expires_on' => 'nullable|date',
            'created_by' => 'nullable|string',
        ]);

        $backup = Backup::create([
            'workspace_id' => $workspace->id,
            'type' => $validated['type'],
            'status' => $validated['status'] ?? 'processing',
            'backup_date' => $validated['backup_date'],
            'expires_on' => $validated['expires_on'] ?? null,
            'created_by' => $validated['created_by'] ?? $user->id,
        ]);

        AuditService::log(
            workspace: $workspace,
            user: $user,
            action: 'created',
            category: 'backup',
            subcategory: $backup->type,
            auditable: $backup,
            changes: ['new' => $backup->toArray()],
            source: 'web',
        );

        return response()->json(['data' => $backup->fresh()->toArray()], 201);
    }

    public function showSchedule(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Backup::class);
        $workspace = $request->user()->currentWorkspace ?? $request->user()->workspace;
        $settings = $workspace->settings ?? [];

        return response()->json([
            'data' => [
                'id' => $workspace->id,
                'workspace_id' => $workspace->id,
                'is_enabled' => $settings['backup_schedule']['is_enabled'] ?? false,
                'frequency' => $settings['backup_schedule']['frequency'] ?? 'weekly',
                'day_of_week' => $settings['backup_schedule']['day_of_week'] ?? 'Monday',
                'updated_at' => $workspace->updated_at?->format('Y-m-d\TH:i:s\Z'),
            ],
        ]);
    }

    public function updateSchedule(Request $request): JsonResponse
    {
        $this->authorize('update', Backup::class);

        $user = $request->user();
        $workspace = $user->currentWorkspace ?? $user->workspace;

        $validated = $request->validate([
            'is_enabled' => 'required|boolean',
            'frequency' => 'required|string|in:weekly,biweekly',
            'day_of_week' => 'required|string',
        ]);

        $settings = $workspace->settings ?? [];
        $settings['backup_schedule'] = [
            'is_enabled' => $validated['is_enabled'],
            'frequency' => $validated['frequency'],
            'day_of_week' => $validated['day_of_week'],
        ];
        $workspace->settings = $settings;
        $workspace->save();

        return response()->json([
            'data' => [
                'id' => $workspace->id,
                'workspace_id' => $workspace->id,
                'is_enabled' => $validated['is_enabled'],
                'frequency' => $validated['frequency'],
                'day_of_week' => $validated['day_of_week'],
                'updated_at' => now()->format('Y-m-d\TH:i:s\Z'),
            ],
            'message' => 'Schedule saved.',
        ]);
    }

    public function indexRestoreHistory(Request $request): JsonResponse
    {
        $this->authorize('viewAny', RestoreHistory::class);
        $workspace = $request->user()->currentWorkspace ?? $request->user()->workspace;

        $history = RestoreHistory::where('workspace_id', $workspace->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'workspace_id' => $item->workspace_id,
                    'restore_type' => $item->restore_type,
                    'status' => $item->status,
                    'source' => $item->source,
                    'objects' => $item->objects,
                    'changed_by' => $item->changed_by,
                    'start_date' => $item->start_date?->format('Y-m-d\TH:i:s\Z'),
                    'end_date' => $item->end_date?->format('Y-m-d\TH:i:s\Z'),
                    'requested_by' => $item->requested_by,
                    'created_at' => $item->created_at?->format('Y-m-d\TH:i:s\Z'),
                ];
            });

        return response()->json(['data' => $history]);
    }

    public function storeRestoreHistory(Request $request): JsonResponse
    {
        $this->authorize('create', RestoreHistory::class);

        $user = $request->user();
        $workspace = $user->currentWorkspace ?? $user->workspace;

        $validated = $request->validate([
            'restore_type' => 'required|string|in:crm_changes,deleted_records',
            'status' => 'nullable|string|max:50',
            'source' => 'nullable|string',
            'objects' => 'nullable|array',
            'objects.*' => 'string',
            'changed_by' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'requested_by' => 'nullable|string',
        ]);

        $item = RestoreHistory::create([
            'workspace_id' => $workspace->id,
            'restore_type' => $validated['restore_type'],
            'status' => $validated['status'] ?? 'processing',
            'source' => $validated['source'] ?? null,
            'objects' => $validated['objects'] ?? null,
            'changed_by' => $validated['changed_by'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'requested_by' => $validated['requested_by'] ?? $user->id,
        ]);

        AuditService::log(
            workspace: $workspace,
            user: $user,
            action: 'created',
            category: 'restore',
            subcategory: $item->restore_type,
            auditable: $item,
            changes: ['new' => $item->toArray()],
            source: 'web',
        );

        return response()->json(['data' => $item->fresh()->toArray()], 201);
    }
}
