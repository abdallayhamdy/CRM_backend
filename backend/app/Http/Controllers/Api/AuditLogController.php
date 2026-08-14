<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AuditLogController extends Controller
{
    use AuthorizesRequests;
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'action' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'subcategory' => 'nullable|string|max:255',
            'source' => 'nullable|string|max:255',
            'source_url' => 'nullable|string|max:2048',
            'assisted_by' => 'nullable|string|max:255',
            'record_id' => 'nullable|string|max:255',
            'record_type' => 'nullable|string|max:255',
        ]);

        $log = AuditLog::create([
            'user_id' => $user->id,
            'action' => strtolower(trim($validated['action'])),
            'category' => $validated['category'],
            'subcategory' => $validated['subcategory'] ?? $validated['category'],
            'source' => $validated['source'] ?? 'web',
            'source_url' => $validated['source_url'] ?? null,
            'assisted_by' => $validated['assisted_by'] ?? null,
            'auditable_id' => $validated['record_id'] ?? null,
            'auditable_type' => $validated['record_type'] ?? null,
        ]);

        return response()->json([
            'data' => $log,
            'message' => 'Audit log created.',
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('manage_audit_log');
        $query = AuditLog::with('user')
            ->where('workspace_id', $request->user()->workspace_id)
            ->orderBy('created_at', 'desc');

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('tab_category')) {
            $query->where('category', $request->tab_category);
        }

        if ($request->filled('subcategory')) {
            $query->where('subcategory', $request->subcategory);
        }

        if ($request->filled('action')) {
            // The UI action dropdown sends display labels ("Update") while
            // backend AuditService::log stores past-tense forms ("updated")
            // and frontend logAudit stores lowercase base forms ("update").
            // Match case-insensitively against every known variant.
            $needle = strtolower(trim($request->action));
            $forms = match ($needle) {
                'create' => ['created', 'create'],
                'update' => ['updated', 'update'],
                'delete' => ['deleted', 'delete'],
                'view'   => ['viewed', 'view'],
                default  => [$needle],
            };
            $placeholders = implode(',', array_fill(0, count($forms), '?'));
            $query->whereRaw("LOWER(action) IN ($placeholders)", $forms);
        }

        if ($request->filled('modified_by_me')) {
            $query->where('user_id', $request->user()->id);
        }

        if ($request->filled('has_assisted_by')) {
            $hasAssistedBy = filter_var($request->has_assisted_by, FILTER_VALIDATE_BOOLEAN);
            if ($hasAssistedBy) {
                $query->whereNotNull('assisted_by');
            } else {
                $query->whereNull('assisted_by');
            }
        }

        $page = max(1, (int) $request->input('page', 1));
        $pageSize = min(100, max(1, (int) $request->input('page_size', 50)));

        $paginator = $query->paginate($pageSize, ['*'], 'page', $page);
        $total = $paginator->total();

        $logs = AuditLogResource::collection($paginator)->toArray($request);

        return response()->json([
            'logs' => $logs,
            'total' => $total,
        ]);
    }
}
