<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePanelConfigRequest;
use App\Http\Resources\PanelConfigResource;
use App\Models\PanelConfig;
use App\Services\AuditService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PanelConfigController extends Controller
{
    use AuthorizesRequests;
    public function show(string $type, Request $request): JsonResponse
    {
        $this->authorize('manage_panel_configs');
        $user = $request->user();
        $workspace = $user->currentWorkspace;

        if (!$workspace) {
            return response()->json([
                'data' => [
                    'object_type' => $type,
                    'layout' => 'table',
                    'visible_fields' => [],
                ],
            ]);
        }

        $config = PanelConfig::where('workspace_id', $workspace->id)
            ->where('object_type', $type)
            ->first();

        if (!$config) {
            return response()->json([
                'data' => [
                    'object_type' => $type,
                    'config' => null,
                ],
            ]);
        }

        return response()->json([
            'data' => new PanelConfigResource($config),
        ]);
    }

    public function update(string $type, StorePanelConfigRequest $request): JsonResponse
    {
        $this->authorize('manage_panel_configs');

        $user = $request->user();
        $workspace = $user->currentWorkspace;

        $config = PanelConfig::updateOrCreate(
            ['workspace_id' => $workspace->id, 'object_type' => $type],
            ['config' => $request->input('config')],
        );

        AuditService::log(
            workspace: $workspace,
            user: $user,
            action: 'updated',
            category: 'settings',
            subcategory: 'panel_config',
            auditable: $config,
            changes: ['config' => $request->input('config')],
            source: 'web',
        );

        return response()->json([
            'data' => new PanelConfigResource($config),
            'message' => 'Panel config updated.',
        ]);
    }
}
