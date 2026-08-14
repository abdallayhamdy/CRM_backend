<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFormLayoutRequest;
use App\Http\Resources\FormLayoutResource;
use App\Models\FormLayout;
use App\Services\AuditService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FormLayoutController extends Controller
{
    use AuthorizesRequests;
    public function show(Request $request): JsonResponse
    {
        $this->authorize('manage_panel_configs');
        $user = $request->user();
        $workspace = $user->currentWorkspace;

        if (!$workspace) {
            return response()->json([
                'groups' => [],
            ]);
        }

        $objectType = $request->query('object_type', 'contact');

        $layout = FormLayout::forWorkspaceAndObject($workspace->id, $objectType)->first();

        if (!$layout) {
            return response()->json([
                'groups' => [],
            ]);
        }

        return response()->json(new FormLayoutResource($layout));
    }

    public function update(StoreFormLayoutRequest $request): JsonResponse
    {
        $this->authorize('manage_panel_configs');

        $user = $request->user();
        $workspace = $user->currentWorkspace;
        $objectType = $request->input('object_type');

        $layout = FormLayout::updateOrCreate(
            ['workspace_id' => $workspace->id, 'object_type' => $objectType],
            ['groups' => $request->input('groups')],
        );

        AuditService::log(
            workspace: $workspace,
            user: $user,
            action: 'updated',
            category: 'settings',
            subcategory: 'form_layout',
            auditable: $layout,
            changes: ['groups' => $request->input('groups')],
            source: 'web',
        );

        return response()->json([
            'data' => new FormLayoutResource($layout),
            'message' => 'Form layout updated.',
        ]);
    }
}
