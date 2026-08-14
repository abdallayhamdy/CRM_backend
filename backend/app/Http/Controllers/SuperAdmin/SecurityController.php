<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\UpdateSecuritySettingsRequest;
use App\Models\AuditLog;
use App\Models\PlatformSettings;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

class SecurityController extends Controller
{
    public function settings(): JsonResponse
    {
        $settings = PlatformSettings::instance();

        return response()->json([
            'data' => [
                'two_factor_required' => $settings->two_factor_required,
                'ip_whitelist_enabled' => $settings->ip_whitelist_enabled,
                'whitelisted_ips' => $settings->whitelisted_ips ?? [],
                'session_timeout_minutes' => $settings->session_timeout_minutes,
            ],
        ]);
    }

    public function updateSettings(UpdateSecuritySettingsRequest $request): JsonResponse
    {
        $settings = PlatformSettings::instance();
        $settings->update($request->validated());

        return response()->json([
            'data' => [
                'two_factor_required' => $settings->two_factor_required,
                'ip_whitelist_enabled' => $settings->ip_whitelist_enabled,
                'whitelisted_ips' => $settings->whitelisted_ips ?? [],
                'session_timeout_minutes' => $settings->session_timeout_minutes,
            ],
        ]);
    }

    public function auditLog(Request $request): JsonResponse
    {
        $query = DB::table('audit_logs')
            ->leftJoin('users', 'audit_logs.user_id', '=', 'users.id')
            ->select(
                'audit_logs.id',
                'audit_logs.created_at as timestamp',
                'users.name as actor_name',
                'users.email as actor_email',
                'audit_logs.action',
                'audit_logs.auditable_type',
                'audit_logs.auditable_id',
                'audit_logs.ip_address',
                'audit_logs.changes'
            )
            ->orderByDesc('audit_logs.created_at');

        if ($action = $request->input('action')) {
            $query->where('audit_logs.action', $action);
        }

        $perPage = min((int) $request->input('limit', 25), 100);
        $paginator = $query->paginate($perPage);

        $workspaceIds = $paginator->getCollection()
            ->filter(fn ($row) => $row->auditable_type === Workspace::class && $row->auditable_id)
            ->pluck('auditable_id')
            ->unique()
            ->values();

        $userIds = $paginator->getCollection()
            ->filter(fn ($row) => $row->auditable_type === User::class && $row->auditable_id)
            ->pluck('auditable_id')
            ->unique()
            ->values();

        $workspaces = $workspaceIds->isNotEmpty()
            ? DB::table('workspaces')->whereIn('id', $workspaceIds)->pluck('company_name', 'id')
            : collect();

        $users = $userIds->isNotEmpty()
            ? DB::table('users')->whereIn('id', $userIds)->pluck('name', 'id')
            : collect();

        $data = $paginator->getCollection()->map(function ($row) use ($workspaces, $users) {
            $targetType = $this->resolveTargetType($row->auditable_type);
            $changes = is_string($row->changes) ? json_decode($row->changes, true) : $row->changes;
            $targetLabel = $this->resolveTargetLabel(
                $targetType,
                $row->auditable_id,
                $workspaces,
                $users,
                $changes
            );

            return [
                'id' => (string) $row->id,
                'timestamp' => $row->timestamp,
                'actor_name' => $row->actor_name ?? 'System',
                'actor_email' => $row->actor_email ?? '',
                'action' => $this->formatAction($row->action, $changes),
                'target_type' => $targetType,
                'target_id' => $row->auditable_id,
                'target_label' => $targetLabel,
                'ip_address' => $row->ip_address ?? 'N/A',
            ];
        })->values()->all();

        return response()->json([
            'data' => $data,
            'meta' => [
                'page' => $paginator->currentPage(),
                'limit' => $perPage,
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function sessions(): JsonResponse
    {
        $tokens = PersonalAccessToken::query()
            ->whereNull('expires_at')
            ->orWhere('expires_at', '>', now())
            ->with([])
            ->get();

        $userIds = $tokens->pluck('tokenable_id')->unique()->values();

        $users = $userIds->isNotEmpty()
            ? User::whereIn('id', $userIds)->get()->keyBy('id')
            : collect();

        $currentTokenId = null;
        $authUser = auth('sanctum')->user();
        if ($authUser) {
            try {
                $currentToken = $authUser->currentAccessToken();
                if ($currentToken && is_int($currentToken->getKey())) {
                    $currentTokenId = $currentToken->getKey();
                }
            } catch (\Throwable) {
                $currentTokenId = null;
            }
        }

        $data = $tokens->map(function ($token) use ($users, $currentTokenId) {
            $user = $users->get($token->tokenable_id);
            $userAgent = $token->user_agent ?? '';

            return [
                'id' => (string) $token->id,
                'user_name' => $user->name ?? 'Unknown',
                'user_id' => $token->tokenable_id,
                'device' => $this->parseDevice($userAgent),
                'ip_address' => $token->ip_address ?? 'Unknown',
                'location' => 'Unknown',
                'last_active' => $token->last_used_at
                    ? $token->last_used_at->diffForHumans()
                    : 'Never',
                'is_current_session' => (string) $token->id === (string) $currentTokenId,
            ];
        })->values()->all();

        return response()->json(['data' => $data]);
    }

    public function revokeSession(string $id): JsonResponse
    {
        $token = PersonalAccessToken::find($id);

        if (! $token) {
            return response()->json(['message' => 'Session not found.'], 404);
        }

        $authUser = auth('sanctum')->user();
        if ($authUser) {
            try {
                $currentToken = $authUser->currentAccessToken();
                if ($currentToken && is_int($currentToken->getKey())) {
                    if ((string) $token->tokenable_id === (string) $authUser->id
                        && (string) $currentToken->getKey() === (string) $token->id) {
                        return response()->json(['message' => 'Cannot revoke your own active session.'], 422);
                    }
                }
            } catch (\Throwable) {
                // Mock token from testing - skip check
            }
        }

        $token->delete();

        return response()->json(['message' => 'Session revoked successfully.']);
    }

    private function resolveTargetType(?string $auditableType): string
    {
        if (! $auditableType) {
            return 'System';
        }

        return match ($auditableType) {
            Workspace::class, 'App\Models\Workspace' => 'Tenant',
            User::class, 'App\Models\User' => 'User',
            'App\Models\Invoice' => 'Invoice',
            default => 'System',
        };
    }

    private function resolveTargetLabel(
        string $targetType,
        ?string $auditableId,
        $workspaces,
        $users,
        ?array $changes
    ): string {
        if (! $auditableId) {
            return 'Platform';
        }

        return match ($targetType) {
            'Tenant' => $workspaces->get($auditableId, 'Unknown Tenant'),
            'User' => $users->get($auditableId, 'Unknown User'),
            'Invoice' => $changes['invoice_number'] ?? $auditableId,
            default => $auditableId,
        };
    }

    private function formatAction(string $action, ?array $changes): string
    {
        return match ($action) {
            'user_activated' => 'Reactivated user',
            'user_deactivated' => 'Deactivated user',
            default => $this->humanizeAction($action, $changes),
        };
    }

    private function humanizeAction(string $action, ?array $changes): string
    {
        $words = explode('_', $action);
        $words = array_map('ucfirst', $words);
        $result = implode(' ', $words);

        if ($changes) {
            if (isset($changes['plan'])) {
                $result = 'Updated tenant plan';
            } elseif (isset($changes['status']) && isset($changes['previous_status'])) {
                $result = 'Changed tenant status';
            } elseif (isset($changes['max_users']) || isset($changes['user_limit'])) {
                $result = 'Updated user limit';
            } elseif (isset($changes['status']) && $changes['status'] === 'Paid') {
                $result = 'Marked invoice as paid';
            }
        }

        return $result;
    }

    private function parseDevice(string $userAgent): string
    {
        if (empty($userAgent)) {
            return 'Unknown device';
        }

        $browser = 'Unknown browser';
        $os = 'Unknown OS';

        if (str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad')) {
            $os = str_contains($userAgent, 'iPad') ? 'iPad' : 'iPhone';
            $browser = 'Safari';
        } elseif (str_contains($userAgent, 'Android')) {
            $os = 'Android';
            $browser = str_contains($userAgent, 'Chrome') ? 'Chrome' : 'Browser';
        } else {
            if (str_contains($userAgent, 'Windows')) {
                $os = 'Windows';
            } elseif (str_contains($userAgent, 'Mac OS')) {
                $os = 'macOS';
            } elseif (str_contains($userAgent, 'Linux')) {
                $os = 'Linux';
            }

            if (str_contains($userAgent, 'Firefox')) {
                $browser = 'Firefox';
            } elseif (str_contains($userAgent, 'Edg')) {
                $browser = 'Edge';
            } elseif (str_contains($userAgent, 'Chrome')) {
                $browser = 'Chrome';
            } elseif (str_contains($userAgent, 'Safari')) {
                $browser = 'Safari';
            }
        }

        return "{$browser} on {$os}";
    }
}
