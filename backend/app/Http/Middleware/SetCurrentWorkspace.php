<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentWorkspace
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth('sanctum')->user() ?? auth()->user();

        if ($user) {
            $requestedWorkspaceId =
                $request->header('X-Workspace-Id') ??
                $request->header('X-Workspace-ID') ??
                $request->query('workspace_id');

            $workspaceId = $requestedWorkspaceId ?: $user->workspace_id;

            if (!$workspaceId && !$user->is_super_admin) {
                $workspaceId = $user->workspaces()
                    ->wherePivot('is_active', true)
                    ->orderByDesc('workspace_user.updated_at')
                    ->value('workspaces.id');
            }

            if (!$workspaceId && !$user->is_super_admin && !$request->is('api/auth/me') && !$request->is('api/logout')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'workspace_id is required.',
                ], 400);
            }

            if ($workspaceId) {
                if (!$user->is_super_admin) {
                    $isMember = $user->workspaces()
                        ->where('workspaces.id', $workspaceId)
                        ->wherePivot('is_active', true)
                        ->exists();

                    if (!$isMember) {
                        return response()->json([
                            'status' => 'error',
                            'message' => 'Forbidden.',
                        ], 403);
                    }

                    $workspace = \App\Models\Workspace::find($workspaceId);

                    if ($workspace && in_array($workspace->status, ['suspended', 'churned'])) {
                        return response()->json([
                            'status' => 'error',
                            'message' => 'This workspace has been '.$workspace->status.'.',
                        ], 403);
                    }

                    if ($workspace && $workspace->status === 'trial' && $workspace->trial_end_date && $workspace->trial_end_date->isPast()) {
                        return response()->json([
                            'status' => 'error',
                            'message' => 'This workspace trial has expired.',
                        ], 403);
                    }
                }

                if (!$user->is_super_admin && $user->workspace_id !== $workspaceId) {
                    $user->forceFill(['workspace_id' => $workspaceId]);
                    if ($user->isDirty('workspace_id')) {
                        $user->save();
                    }
                }

                app(PermissionRegistrar::class)->setPermissionsTeamId($workspaceId);
            }
        }

        return $next($request);
    }
}
