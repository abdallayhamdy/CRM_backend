<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateWorkspaceSettingsRequest;
use App\Http\Resources\WorkspaceSettingsResource;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class WorkspaceSettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->hasPermissionTo('manage_settings')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $workspace = $user->currentWorkspace;

        return response()->json([
            'data' => new WorkspaceSettingsResource($workspace),
        ]);
    }

    public function update(UpdateWorkspaceSettingsRequest $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->hasPermissionTo('manage_settings')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $workspace = $user->currentWorkspace;

        $original = $workspace->getOriginal();
        $workspace->update($request->validated());
        $workspace->refresh();

        $changed = $workspace->getChanges();
        if (!empty($changed)) {
            $oldValues = [];
            $newValues = [];
            foreach ($changed as $field => $newValue) {
                $oldValues[$field] = $original[$field] ?? null;
                $newValues[$field] = $newValue;
            }
            AuditService::log(
                workspace: $workspace,
                user: $user,
                action: 'updated',
                category: 'settings',
                subcategory: 'workspace',
                auditable: $workspace,
                changes: ['old' => $oldValues, 'new' => $newValues],
                source: 'web',
            );
        }

        return response()->json([
            'data' => new WorkspaceSettingsResource($workspace),
            'message' => 'Workspace settings updated.',
        ]);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => 'required|image|max:2048',
        ]);

        $user = $request->user();

        if (!$user->hasPermissionTo('manage_settings')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $workspace = $user->currentWorkspace;

        if ($workspace->logo_path) {
            Storage::disk('public')->delete($workspace->logo_path);
        }

        $path = $request->file('logo')->store('workspace-logos/' . $workspace->id, 'public');

        $workspace->update(['logo_path' => $path]);

        return response()->json([
            'data' => [
                'logo_path' => $path,
                'logo_url' => Storage::disk('public')->url($path),
            ],
            'message' => 'Logo uploaded.',
        ]);
    }
}
