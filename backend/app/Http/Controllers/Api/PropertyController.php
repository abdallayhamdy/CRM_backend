<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Http\Requests\StorePropertyRequest;
use App\Http\Requests\UpdatePropertyRequest;
use App\Http\Resources\PropertyResource;
use App\Services\AuditService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    use AuthorizesRequests;
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Property::class);

        $user = $request->user();

        $query = Property::query();

        if ($request->object_type) {
            $query->where('object_type', $request->object_type);
        }

        if ($request->counts_only) {
            $counts = (clone $query)->selectRaw('is_archived, count(*) as count')
                ->groupBy('is_archived')
                ->pluck('count', 'is_archived');
            $activeCount = $counts->get(0) ?? $counts->get(false) ?? 0;
            $archivedCount = $counts->get(1) ?? $counts->get(true) ?? 0;
            return response()->json([
                'data' => [
                    'activeCount' => $activeCount,
                    'archivedCount' => $archivedCount,
                ],
            ]);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('label', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            });
        }

        if ($request->group && $request->group !== 'all') {
            $query->where('group_name', $request->group);
        }

        if ($request->field_type && $request->field_type !== 'all') {
            $query->where('field_type', $request->field_type);
        }

        if ($request->user_filter && $request->user_filter !== 'all') {
            $query->where('created_by', $request->user_filter);
        }

        if ($request->access_filter && $request->access_filter !== 'all') {
            // access filter is a placeholder — full access control comes later
        }

        // Default: show active (non-archived), unless specifically requesting archived
        if ($request->archived) {
            $query->where('is_archived', true);
        } else {
            $query->where('is_archived', false);
        }

        $sortBy = in_array($request->sort_by, ['label', 'name', 'field_type', 'group_name', 'created_at', 'updated_at'])
            ? $request->sort_by
            : 'created_at';
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = min((int)($request->limit ?? 10), 100);
        $properties = $query->with('creator')->paginate($perPage);

        $counts = Property::where('object_type', $request->object_type)
            ->selectRaw('is_archived, count(*) as count')
            ->groupBy('is_archived')
            ->pluck('count', 'is_archived');
        $activeCount = $counts->get(0) ?? $counts->get(false) ?? 0;
        $archivedCount = $counts->get(1) ?? $counts->get(true) ?? 0;

        return response()->json([
            'data' => [
                'properties' => PropertyResource::collection($properties),
                'meta' => [
                    'totalPages' => $properties->lastPage(),
                    'total' => $properties->total(),
                    'currentPage' => $properties->currentPage(),
                    'perPage' => $properties->perPage(),
                    'activeCount' => $activeCount,
                    'archivedCount' => $archivedCount,
                ],
            ],
        ]);
    }

    public function store(StorePropertyRequest $request): JsonResponse
    {
        $this->authorize('create', Property::class);

        $user = $request->user();

        $data = $request->validated();
        $data['created_by'] = $user->id;
        if (empty($data['workspace_id'])) {
            $data['workspace_id'] = $user->currentWorkspace?->id ?? $user->workspace_id;
        }

        $property = Property::create($data);
        $property->load('creator');

        AuditService::log(
            workspace: $user->currentWorkspace ?? $user->workspace,
            user: $user,
            action: 'created',
            category: 'properties',
            subcategory: $property->object_type,
            auditable: $property,
            changes: ['new' => $property->toArray()],
            source: 'web',
        );

        return response()->json([
            'data' => new PropertyResource($property),
            'message' => 'Property created.',
        ], 201);
    }

    public function show(Property $property): JsonResponse
    {
        $this->authorize('view', $property);

        $property->load('creator');

        return response()->json([
            'data' => new PropertyResource($property),
        ]);
    }

    public function update(UpdatePropertyRequest $request, Property $property): JsonResponse
    {
        $this->authorize('update', $property);

        $user = $request->user();

        $original = $property->getOriginal();

        if ($request->restore) {
            $property->update(['is_archived' => false]);
        } else {
            $property->update($request->validated());
        }

        $property->refresh();
        $property->load('creator');
        $changed = $property->getChanges();

        if (!empty($changed)) {
            $oldValues = [];
            $newValues = [];
            foreach ($changed as $field => $newValue) {
                $oldValues[$field] = $original[$field] ?? null;
                $newValues[$field] = $newValue;
            }
            AuditService::log(
                workspace: $user->currentWorkspace ?? $user->workspace,
                user: $user,
                action: 'updated',
                category: 'properties',
                subcategory: $property->object_type,
                auditable: $property,
                changes: ['old' => $oldValues, 'new' => $newValues],
                source: 'web',
            );
        }

        return response()->json([
            'data' => new PropertyResource($property),
            'message' => 'Property updated.',
        ]);
    }

    public function getRules(Property $property): JsonResponse
    {
        $this->authorize('view', $property);

        $settings = $property->settings ?? [];
        $rules = $settings['rules'] ?? [];
        $uniqueCount = 0;
        $uniqueLimit = 10;

        return response()->json([
            'data' => [
                'rules' => $rules,
                'unique_count' => $uniqueCount,
                'unique_limit' => $uniqueLimit,
            ],
        ]);
    }

    public function updateRules(Request $request, Property $property): JsonResponse
    {
        $this->authorize('update', $property);

        $request->validate([
            'visibility' => 'nullable|array',
            'validation' => 'nullable|array',
            'allowed_characters' => 'nullable|string',
            'allowed_spaces' => 'nullable|string',
            'case_sensitivity' => 'nullable|string',
        ]);

        $settings = $property->settings ?? [];
        $settings['rules'] = [
            'visibility' => $request->visibility ?? [],
            'validation' => $request->validation ?? [],
            'allowed_characters' => $request->allowed_characters ?? 'all',
            'allowed_spaces' => $request->allowed_spaces ?? 'all',
            'case_sensitivity' => $request->case_sensitivity ?? 'none',
        ];
        $property->settings = $settings;
        $property->save();

        return response()->json([
            'data' => [
                'rules' => $settings['rules'],
                'unique_count' => 0,
                'unique_limit' => 10,
            ],
            'message' => 'Rules saved.',
        ]);
    }

    public function getAccess(Property $property): JsonResponse
    {
        $this->authorize('view', $property);

        $settings = $property->settings ?? [];
        $access = $settings['access'] ?? [
            'type' => 'everyone_edit',
            'assignments' => [],
        ];

        return response()->json([
            'data' => [
                'access' => ['type' => $access['type']],
                'assignments' => $access['assignments'] ?? [],
            ],
        ]);
    }

    public function updateAccess(Request $request, Property $property): JsonResponse
    {
        $this->authorize('update', $property);

        $request->validate([
            'access.type' => 'nullable|string',
        ]);

        $settings = $property->settings ?? [];
        $currentAccess = $settings['access'] ?? [
            'type' => 'everyone_edit',
            'assignments' => [],
        ];

        if ($request->has('access.type')) {
            $currentAccess['type'] = $request->input('access.type');
        }

        $settings['access'] = $currentAccess;
        $property->settings = $settings;
        $property->save();

        return response()->json([
            'data' => [
                'access' => ['type' => $currentAccess['type']],
                'assignments' => $currentAccess['assignments'] ?? [],
            ],
        ]);
    }

    public function addAssignment(Request $request, Property $property): JsonResponse
    {
        $this->authorize('update', $property);

        $request->validate([
            'entity_type' => 'required|string|in:team,user',
            'entity_id' => 'required|string',
            'access_level' => 'nullable|string|in:view_and_edit,view_only,no_access',
        ]);

        $settings = $property->settings ?? [];
        $currentAccess = $settings['access'] ?? [
            'type' => 'everyone_edit',
            'assignments' => [],
        ];

        $assignmentId = (string) \Illuminate\Support\Str::uuid();
        $assignment = [
            'id' => $assignmentId,
            'entity_type' => $request->entity_type,
            'entity_id' => $request->entity_id,
            'access_level' => $request->access_level ?? 'view_and_edit',
        ];

        $currentAccess['assignments'][] = $assignment;
        $settings['access'] = $currentAccess;
        $property->settings = $settings;
        $property->save();

        return response()->json([
            'data' => ['assignment' => $assignment],
        ]);
    }

    public function removeAssignment(Property $property, string $assignmentId): JsonResponse
    {
        $this->authorize('update', $property);

        $settings = $property->settings ?? [];
        $currentAccess = $settings['access'] ?? [
            'type' => 'everyone_edit',
            'assignments' => [],
        ];

        $currentAccess['assignments'] = array_values(
            array_filter($currentAccess['assignments'] ?? [], fn($a) => ($a['id'] ?? '') !== $assignmentId)
        );

        $settings['access'] = $currentAccess;
        $property->settings = $settings;
        $property->save();

        return response()->json(['message' => 'Assignment removed.']);
    }

    public function updateAssignment(Request $request, Property $property, string $assignmentId): JsonResponse
    {
        $this->authorize('update', $property);

        $request->validate([
            'access_level' => 'required|string|in:view_and_edit,view_only,no_access',
        ]);

        $settings = $property->settings ?? [];
        $currentAccess = $settings['access'] ?? [
            'type' => 'everyone_edit',
            'assignments' => [],
        ];

        $found = false;
        foreach ($currentAccess['assignments'] as &$a) {
            if (($a['id'] ?? '') === $assignmentId) {
                $a['access_level'] = $request->access_level;
                $found = true;
                break;
            }
        }

        if (!$found) {
            return response()->json(['message' => 'Assignment not found.'], 404);
        }

        $settings['access'] = $currentAccess;
        $property->settings = $settings;
        $property->save();

        return response()->json(['message' => 'Assignment updated.']);
    }

    public function destroy(Property $property): JsonResponse
    {
        $this->authorize('delete', $property);

        $user = request()->user();

        if (request()->query('force')) {
            $property->forceDelete();
        } else {
            $property->update(['is_archived' => true]);
        }

        AuditService::log(
            workspace: $user->currentWorkspace ?? $user->workspace,
            user: $user,
            action: request()->query('force') ? 'deleted' : 'archived',
            category: 'properties',
            subcategory: $property->object_type,
            auditable: $property,
            changes: ['old' => $property->toArray()],
            source: 'web',
        );

        return response()->json([
            'message' => request()->query('force') ? 'Property permanently deleted.' : 'Property archived.',
        ]);
    }
}
