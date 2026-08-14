<?php

namespace App\Observers;

use App\Models\ImpersonationSession;
use App\Models\PlatformAuditLog;
use App\Models\User;

class UserObserver
{
    public function deleted(User $user): void
    {
        $this->revokeSessions($user, 'user_deleted');
    }

    public function updated(User $user): void
    {
        if ($user->wasChanged('is_super_admin') && !$user->is_super_admin) {
            $this->revokeSessions($user, 'platform_owner_deactivated');
        }

        if ($user->wasChanged('workspace_id') && is_null($user->workspace_id)) {
            $this->revokeSessions($user, 'user_deactivated');
        }
    }

    private function revokeSessions(User $user, string $action): void
    {
        $activeSessions = ImpersonationSession::where('admin_id', $user->id)
            ->whereNull('revoked_at')
            ->get();

        foreach ($activeSessions as $session) {
            $session->revoke();

            PlatformAuditLog::create([
                'admin_id' => $session->admin_id,
                'target_user_id' => $session->target_user_id,
                'workspace_id' => $session->target_workspace_id,
                'action' => 'impersonation_' . $action,
                'metadata' => [
                    'reason' => $action,
                    'admin_email' => $user->email,
                    'target_user_email' => $session->targetUser?->email,
                ],
            ]);
        }

        $impersonatingSessions = ImpersonationSession::where('target_user_id', $user->id)
            ->whereNull('revoked_at')
            ->get();

        foreach ($impersonatingSessions as $session) {
            $session->revoke();

            PlatformAuditLog::create([
                'admin_id' => $session->admin_id,
                'target_user_id' => $session->target_user_id,
                'workspace_id' => $session->target_workspace_id,
                'action' => 'impersonation_' . $action,
                'metadata' => [
                    'reason' => $action,
                    'target_user_email' => $user->email,
                    'admin_email' => $session->admin?->email,
                ],
            ]);
        }
    }
}
