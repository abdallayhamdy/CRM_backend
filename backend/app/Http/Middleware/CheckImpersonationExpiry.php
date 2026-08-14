<?php

namespace App\Http\Middleware;

use App\Models\ImpersonationSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckImpersonationExpiry
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->user()?->currentAccessToken();

        if (!$token || !$token->is_impersonation) {
            return $next($request);
        }

        $session = ImpersonationSession::where('token_id', $token->id)
            ->whereNull('revoked_at')
            ->first();

        if ($session && $session->isExpired()) {
            $session->revoke();

            \App\Models\PlatformAuditLog::create([
                'admin_id' => $session->admin_id,
                'target_user_id' => $session->target_user_id,
                'workspace_id' => $session->target_workspace_id,
                'action' => 'impersonation_expired',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'metadata' => [
                    'target_user_email' => $session->targetUser?->email,
                    'admin_email' => $session->admin?->email,
                ],
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Impersonation session expired.',
            ], 401);
        }

        return $next($request);
    }
}
