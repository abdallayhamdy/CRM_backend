<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreObjectConfigRequest;
use App\Http\Resources\ObjectConfigResource;
use App\Models\ObjectConfig;
use App\Services\AuditService;
use App\Services\StageSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ObjectConfigController extends Controller
{
    public function __construct(
        private readonly StageSyncService $stageSyncService,
    ) {
    }

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || (!$user->is_super_admin && !$user->hasPermissionTo('manage_panel_configs'))) {
            return response()->json([
                'message' => 'Forbidden.',
            ], 403);
        }

        $workspace = $user->currentWorkspace;

        if (!$workspace) {
            return response()->json([
                'lifecycle_stages' => [],
                'display_style' => 'colored_badge',
            ]);
        }

        $objectType = $request->query('object_type', 'contact');

        $config = ObjectConfig::forWorkspaceAndObject($workspace->id, $objectType)->first();

        if (!$config) {
            return response()->json([
                'lifecycle_stages' => [],
                'display_style' => 'colored_badge',
            ]);
        }

        return response()->json(new ObjectConfigResource($config));
    }

    public function update(StoreObjectConfigRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || (!$user->is_super_admin && !$user->hasPermissionTo('manage_panel_configs'))) {
            return response()->json([
                'message' => 'Forbidden.',
            ], 403);
        }

        $workspace = $user->currentWorkspace;
        $objectType = $request->input('object_type');

        if (!$workspace) {
            return response()->json(['message' => 'Workspace not found.'], 422);
        }

        $config = ObjectConfig::updateOrCreate(
            ['workspace_id' => $workspace->id, 'object_type' => $objectType],
            [
                'lifecycle_stages' => $request->input('lifecycle_stages'),
                'display_style' => $request->input('display_style', 'colored_badge'),
            ],
        );

        $this->stageSyncService->sync(
            $workspace->id,
            $objectType,
            (array) $request->input('lifecycle_stages', []),
        );

        AuditService::log(
            workspace: $workspace,
            user: $user,
            action: 'updated',
            category: 'settings',
            subcategory: 'object_config',
            auditable: $config,
            changes: [
                'lifecycle_stages' => $request->input('lifecycle_stages'),
                'display_style' => $request->input('display_style'),
            ],
            source: 'web',
        );

        return response()->json([
            'data' => new ObjectConfigResource($config),
            'message' => 'Object config updated.',
        ]);
    }
}
