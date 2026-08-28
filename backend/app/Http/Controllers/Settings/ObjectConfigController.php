<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreObjectConfigRequest;
use App\Http\Resources\ObjectConfigResource;
use App\Models\ObjectConfig;
use App\Models\Stage;
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

        // The stages table is the source of truth (synced on every save) and is
        // guaranteed to be seeded for contact/company. Return the real stages
        // with live usage counts so the UI never shows hardcoded numbers.
        $lifecycleStages = $this->resolveLifecycleStages(
            $workspace->id,
            $objectType,
            $config,
        );

        return response()->json([
            'object_type' => $objectType,
            'lifecycle_stages' => $lifecycleStages,
            'display_style' => $config?->display_style ?? 'colored_badge',
            'used_in_computed' => true,
        ]);
    }

    /**
     * Build the lifecycle stages returned to the UI.
     *
     * Real stages come from the stages table (which is kept in sync by
     * StageSyncService on every save and seeded for contact/company). The
     * per-stage attributes that have no column (is_default / is_active /
     * calculated_props) are merged from the stored config, while used_in is
     * always aggregated live from the underlying records.
     */
    private function resolveLifecycleStages(string $workspaceId, string $objectType, ?ObjectConfig $config): array
    {
        if (!in_array($objectType, ['contact', 'company', 'deal'], true)) {
            // No stages table support yet for other object types: fall back to
            // whatever was stored in the config so the page stays editable.
            return $config?->lifecycle_stages ?? [];
        }

        $countRelation = match ($objectType) {
            'contact' => 'contacts',
            'company' => 'companies',
            'deal' => 'deals',
            default => null,
        };

        $storedStages = collect($config?->lifecycle_stages ?? []);

        return Stage::withoutGlobalScope('workspace')
            ->where('workspace_id', $workspaceId)
            ->where('object_type', $objectType)
            ->orderBy('order')
            ->withCount($countRelation)
            ->get()
            ->map(function (Stage $stage) use ($storedStages, $countRelation) {
                $stored = $storedStages->firstWhere('id', $stage->slug) ?? [];

                return [
                    'id' => $stage->slug,
                    'name' => $stage->name,
                    'color' => $stage->color,
                    'order' => (int) $stage->order,
                    'is_default' => $stored['is_default'] ?? ($stage->order === 0),
                    'is_active' => $stored['is_active'] ?? true,
                    'calculated_props' => $stored['calculated_props'] ?? true,
                    'used_in' => (int) $stage->{$countRelation . '_count'},
                ];  
            })
            ->values()
            ->all();
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
