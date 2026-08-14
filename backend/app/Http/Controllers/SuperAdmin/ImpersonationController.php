<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\ImpersonationSession;
use App\Models\PlatformAuditLog;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ImpersonationController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $admin = $request->user();

        $validated = $request->validate([
            'target_user_id' => 'required|uuid|exists:users,id',
            'target_workspace_id' => 'required|uuid|exists:workspaces,id',
        ]);

        $targetUser = User::withoutGlobalScopes()->find($validated['target_user_id']);

        if ($targetUser->is_super_admin) {
            return response()->json([
                'message' => 'Cannot impersonate another Platform Owner.',
            ], 403);
        }

        $hasWorkspace = DB::table('workspace_user')
            ->where('user_id', $targetUser->id)
            ->where('workspace_id', $validated['target_workspace_id'])
            ->where('is_active', true)
            ->exists();

        if (!$hasWorkspace) {
            return response()->json([
                'message' => 'User is not a member of this workspace.',
            ], 422);
        }

        $existingSession = ImpersonationSession::where('admin_id', $admin->id)
            ->whereNull('revoked_at')
            ->first();

        if ($existingSession && $existingSession->isActive()) {
            return response()->json([
                'message' => 'An impersonation session is already active.',
            ], 409);
        }

        if ($existingSession && $existingSession->isExpired()) {
            $existingSession->revoke();
        }

        $timeoutMinutes = config('impersonation.timeout_minutes', 30);

        $token = $targetUser->createToken(
            'impersonation-' . $admin->id,
            ['impersonate'],
            now()->addMinutes($timeoutMinutes)
        );

        \DB::table('personal_access_tokens')
            ->where('id', $token->accessToken->id)
            ->update([
                'is_impersonation' => true,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

        $session = ImpersonationSession::create([
            'admin_id' => $admin->id,
            'target_user_id' => $targetUser->id,
            'target_workspace_id' => $validated['target_workspace_id'],
            'token_id' => $token->accessToken->id,
            'expires_at' => now()->addMinutes($timeoutMinutes),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        PlatformAuditLog::create([
            'admin_id' => $admin->id,
            'target_user_id' => $targetUser->id,
            'workspace_id' => $validated['target_workspace_id'],
            'action' => 'impersonation_started',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'metadata' => [
                'target_user_email' => $targetUser->email,
                'target_user_name' => $targetUser->name,
                'workspace_name' => Workspace::find($validated['target_workspace_id'])?->name,
                'expires_at' => $session->expires_at->toISOString(),
            ],
        ]);

        return response()->json([
            'data' => [
                'token' => $token->plainTextToken,
                'expires_at' => $session->expires_at->toISOString(),
                'session_id' => $session->id,
                'target_user' => [
                    'id' => $targetUser->id,
                    'name' => $targetUser->name,
                    'email' => $targetUser->email,
                ],
                'workspace' => [
                    'id' => $validated['target_workspace_id'],
                    'name' => Workspace::find($validated['target_workspace_id'])?->name,
                ],
            ],
        ], 201);
    }

    public function stop(Request $request): JsonResponse
    {
        $admin = $request->user();
        $token = $admin->currentAccessToken();

        $session = null;

        if ($token && $token->is_impersonation) {
            $session = ImpersonationSession::where('token_id', $token->id)
                ->whereNull('revoked_at')
                ->first();
        }

        if (!$session) {
            $session = ImpersonationSession::where('admin_id', $admin->id)
                ->whereNull('revoked_at')
                ->first();
        }

        if (!$session) {
            return response()->json([
                'message' => 'No active impersonation session found.',
            ], 404);
        }

        $durationSeconds = $session->created_at->diffInSeconds(now());

        $session->revoke();

        PlatformAuditLog::create([
            'admin_id' => $session->admin_id,
            'target_user_id' => $session->target_user_id,
            'workspace_id' => $session->target_workspace_id,
            'action' => 'impersonation_ended',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'metadata' => [
                'duration_seconds' => $durationSeconds,
                'target_user_email' => $session->targetUser?->email,
            ],
        ]);

        return response()->json([
            'message' => 'Impersonation session ended.',
        ]);
    }

    public function status(Request $request): JsonResponse
    {
        $admin = $request->user();
        $token = $admin->currentAccessToken();

        $session = null;

        if ($token && $token->is_impersonation) {
            $session = ImpersonationSession::where('token_id', $token->id)
                ->whereNull('revoked_at')
                ->with(['targetUser:id,name,email', 'targetWorkspace:id,name'])
                ->first();
        }

        if (!$session) {
            $session = ImpersonationSession::where('admin_id', $admin->id)
                ->whereNull('revoked_at')
                ->with(['targetUser:id,name,email', 'targetWorkspace:id,name'])
                ->first();
        }

        if (!$session) {
            return response()->json([
                'data' => ['active' => false],
            ]);
        }

        if ($session->isExpired()) {
            $session->revoke();

            return response()->json([
                'data' => ['active' => false],
            ]);
        }

        return response()->json([
            'data' => [
                'active' => true,
                'session_id' => $session->id,
                'expires_at' => $session->expires_at->toISOString(),
                'target_user' => [
                    'id' => $session->targetUser?->id,
                    'name' => $session->targetUser?->name,
                    'email' => $session->targetUser?->email,
                ],
                'workspace' => [
                    'id' => $session->targetWorkspace?->id,
                    'name' => $session->targetWorkspace?->name,
                ],
            ],
        ]);
    }
}
