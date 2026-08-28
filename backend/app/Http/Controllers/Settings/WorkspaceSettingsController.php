<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateWorkspaceSettingsRequest;
use App\Http\Resources\WorkspaceSettingsResource;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Workspace;
use App\Models\User;

class WorkspaceSettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $this->authorizeSettings($user);

        $workspace = $this->resolveWorkspace($user, $request);

        if (!$workspace) {
            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => new WorkspaceSettingsResource($workspace),
        ]);
    }

    public function update(UpdateWorkspaceSettingsRequest $request): JsonResponse
    {
        $user = $request->user();

        $this->authorizeSettings($user);

        $workspace = $this->resolveWorkspace($user, $request);

        if (!$workspace) {
            return response()->json(['message' => 'Workspace not found.'], 422);
        }

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

        $this->authorizeSettings($user);

        $workspace = $this->resolveWorkspace($user, $request);

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

    private function authorizeSettings(User $user): void
    {
        if (!$user->is_super_admin && !$user->hasPermissionTo('manage_settings')) {
            abort(403, 'Forbidden.');
        }
    }

    private function resolveWorkspace(User $user, Request $request): ?Workspace
    {
        $requestedId = $request->header('X-Workspace-Id')
            ?? $request->header('X-Workspace-ID')
            ?? $request->query('workspace_id')
            ?? $user->workspace_id;

        if ($requestedId && $workspace = Workspace::find($requestedId)) {
            return $workspace;
        }

        return $user->currentWorkspace;
    }
}
