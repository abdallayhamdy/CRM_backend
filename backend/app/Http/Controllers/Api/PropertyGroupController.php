<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyGroup;
use App\Services\AuditService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PropertyGroupController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Property::class);

        $user = $request->user();
        $workspaceId = $user->currentWorkspace?->id ?? $user->workspace_id;

        $objectType = $request->object_type;

        // Groups explicitly created via the property_groups table
        $storedGroups = PropertyGroup::query()
            ->when($objectType, fn ($q) => $q->where('object_type', $objectType))
            ->orderBy('object_type')
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->keyBy(fn ($g) => $g->object_type . "\0" . $g->name);

        // Groups derived from properties that were never persisted (legacy data)
        $derived = Property::query()
            ->where('is_archived', false)
            ->whereNotNull('group_name')
            ->when($objectType, fn ($q) => $q->where('object_type', $objectType))
            ->select('group_name', 'object_type', DB::raw('count(*) as property_count'))
            ->groupBy('group_name', 'object_type')
            ->get();

        $counts = $derived->keyBy(fn ($r) => $r->object_type . "\0" . $r->group_name);

        $groups = collect();

        foreach ($storedGroups as $key => $stored) {
            $groups->push([
                'id' => $stored->id,
                'name' => $stored->name,
                'object_type' => $stored->object_type,
                'property_count' => (int) ($counts[$key]->property_count ?? 0),
                'display_order' => (int) $stored->display_order,
                'created_at' => $stored->created_at?->format('Y-m-d H:i:s'),
            ]);
        }

        foreach ($derived as $row) {
            $key = $row->object_type . "\0" . $row->group_name;
            if ($storedGroups->has($key)) {
                continue;
            }
            $groups->push([
                'id' => md5($row->group_name . $row->object_type),
                'name' => $row->group_name,
                'object_type' => $row->object_type,
                'property_count' => (int) $row->property_count,
                'display_order' => 0,
                'created_at' => now()->format('Y-m-d H:i:s'),
            ]);
        }

        return response()->json([
            'data' => $groups->values()->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('manage_properties'), 403);

        $request->validate([
            'name' => 'required|string|max:255',
            'object_type' => 'required|string|max:100',
            'display_order' => 'nullable|integer|min:0',
        ]);

        $group = PropertyGroup::firstOrCreate(
            [
                'workspace_id' => $request->user()->workspace_id,
                'object_type' => $request->object_type,
                'name' => $request->name,
            ],
            [
                'display_order' => $request->display_order ?? 0,
            ],
        );

        return response()->json([
            'data' => [
                'id' => $group->id,
                'name' => $group->name,
                'object_type' => $group->object_type,
                'property_count' => 0,
                'display_order' => (int) $group->display_order,
                'created_at' => $group->created_at?->format('Y-m-d H:i:s'),
            ],
            'message' => 'Group created.',
        ], 201);
    }

    public function rename(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('manage_properties'), 403);

        $request->validate([
            'from' => 'required|string|max:255',
            'to' => 'required|string|max:255',
            'object_type' => 'required|string|max:100',
        ]);

        $user = $request->user();
        $workspaceId = $user->currentWorkspace?->id ?? $user->workspace_id;

        $updated = Property::where('workspace_id', $workspaceId)
            ->where('object_type', $request->object_type)
            ->where('group_name', $request->from)
            ->update(['group_name' => $request->to]);

        PropertyGroup::where('workspace_id', $workspaceId)
            ->where('object_type', $request->object_type)
            ->where('name', $request->from)
            ->update(['name' => $request->to]);

        AuditService::log(
            workspace: $user->currentWorkspace ?? $user->workspace,
            user: $user,
            action: 'updated',
            category: 'properties',
            subcategory: 'groups',
            auditable: null,
            changes: [
                'old' => ['group_name' => $request->from],
                'new' => ['group_name' => $request->to],
            ],
            source: 'web',
        );

        return response()->json([
            'message' => "Group renamed from \"{$request->from}\" to \"{$request->to}\".",
            'data' => ['affected' => $updated],
        ]);
    }

    public function merge(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('manage_properties'), 403);

        $request->validate([
            'source' => 'required|string|max:255',
            'target' => 'required|string|max:255',
            'object_type' => 'required|string|max:100',
        ]);

        $user = $request->user();
        $workspaceId = $user->currentWorkspace?->id ?? $user->workspace_id;

        $updated = Property::where('workspace_id', $workspaceId)
            ->where('object_type', $request->object_type)
            ->where('group_name', $request->source)
            ->update(['group_name' => $request->target]);

        PropertyGroup::where('workspace_id', $workspaceId)
            ->where('object_type', $request->object_type)
            ->where('name', $request->source)
            ->delete();

        PropertyGroup::firstOrCreate(
            [
                'workspace_id' => $workspaceId,
                'object_type' => $request->object_type,
                'name' => $request->target,
            ],
            ['display_order' => 0],
        );

        AuditService::log(
            workspace: $user->currentWorkspace ?? $user->workspace,
            user: $user,
            action: 'updated',
            category: 'properties',
            subcategory: 'groups',
            auditable: null,
            changes: [
                'old' => ['merged_group' => $request->source],
                'new' => ['into_group' => $request->target],
            ],
            source: 'web',
        );

        return response()->json([
            'message' => "Merged \"{$request->source}\" into \"{$request->target}\".",
            'data' => ['affected' => $updated],
        ]);
    }

    public function destroy(Request $request, string $group): JsonResponse
    {
        abort_unless($request->user()->can('manage_properties'), 403);

        $request->validate([
            'object_type' => 'required|string|max:100',
        ]);

        $user = $request->user();
        $workspaceId = $user->currentWorkspace?->id ?? $user->workspace_id;

        $updated = Property::where('workspace_id', $workspaceId)
            ->where('object_type', $request->object_type)
            ->where('group_name', $group)
            ->update(['group_name' => null]);

        PropertyGroup::where('workspace_id', $workspaceId)
            ->where('object_type', $request->object_type)
            ->where('name', $group)
            ->delete();

        AuditService::log(
            workspace: $user->currentWorkspace ?? $user->workspace,
            user: $user,
            action: 'deleted',
            category: 'properties',
            subcategory: 'groups',
            auditable: null,
            changes: [
                'old' => ['group_name' => $group],
                'new' => ['group_name' => null],
            ],
            source: 'web',
        );

        return response()->json([
            'message' => "Group \"{$group}\" deleted. Properties ungrouped.",
            'data' => ['affected' => $updated],
        ]);
    }
}
