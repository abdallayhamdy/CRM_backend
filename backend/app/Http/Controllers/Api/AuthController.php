<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\TwoFactorCodeMail;
use App\Models\PlatformSettings;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // explicitly provide operator and boolean to match expected signature
        $user = User::where('email', '=', $request->email, 'and')->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            $this->recordLoginEvent($user, 'Login Failed');

            return response()->json([
                'status' => 'error',
                'message' => 'Invalid Credentials',
            ], 401);
        }

        if (!$user->is_super_admin && !$user->workspaces()->wherePivot('is_active', true)->exists()) {
            $this->recordLoginEvent($user, 'Login Failed');

            return response()->json([
                'status' => 'error',
                'message' => 'Your account has been deactivated. Please contact your workspace administrator.',
            ], 403);
        }

        if (PlatformSettings::instance()->two_factor_required) {
            return $this->initiateTwoFactor($user, $request);
        }

        $issued = $this->issueToken($user, $request);

        $this->recordLoginEvent($user, 'Login Succeeded');

        return response()->json([
            'status' => 'success',
            'message' => 'User logged in successfully',
            'data' => [
                'user' => $user,
                'token' => $issued->plainTextToken,
                'expires_at' => $issued->accessToken->expires_at?->toISOString(),
            ]
        ], 200);
    }

    public function verifyTwoFactor(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $user = User::where('email', '=', $request->email, 'and')->first();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired verification code.',
            ], 401);
        }

        $stored = Cache::get('two_factor_code:'.$user->id);

        if (!$stored || !hash_equals((string) $stored['code'], (string) $request->code)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired verification code.',
            ], 401);
        }

        Cache::forget('two_factor_code:'.$user->id);

        $issued = $this->issueToken($user, $request);

        $this->recordLoginEvent($user, 'Login Succeeded');

        return response()->json([
            'status' => 'success',
            'message' => 'User logged in successfully',
            'data' => [
                'user' => $user,
                'token' => $issued->plainTextToken,
                'expires_at' => $issued->accessToken->expires_at?->toISOString(),
            ]
        ], 200);
    }

    protected function initiateTwoFactor(User $user, Request $request)
    {
        $code = (string) random_int(100000, 999999);

        Cache::put(
            'two_factor_code:'.$user->id,
            ['email' => $user->email, 'code' => $code],
            now()->addMinutes(5)
        );

        try {
            Mail::to($user->email)->send(new TwoFactorCodeMail($code));
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Two-factor authentication required. A verification code has been sent to your email.',
            'data' => [
                'user' => $user,
                'two_factor_required' => true,
            ]
        ], 200);
    }

    protected function issueToken(User $user, Request $request): \Laravel\Sanctum\NewAccessToken
    {
        $user->tokens()
            ->where('is_impersonation', false)
            ->delete();

        $expiresAt = config('sanctum.expiration')
            ? now()->addMinutes((int) config('sanctum.expiration'))
            : null;

        $newToken = $user->createToken('auth_token', ['*'], $expiresAt);
        DB::table('personal_access_tokens')
            ->where('id', $newToken->accessToken->id)
            ->update([
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

        return $newToken;
    }

    public function currentUser(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'id' => $user?->id,
                'name' => $user?->name ?? 'User',
                'email' => $user?->email,
                'workspace_id' => $user?->workspace_id,
                'is_super_admin' => $user?->is_super_admin ?? false,
                'roles' => $user?->getRoleNames() ?? [],
                'permissions' => $user?->getAllPermissions()->pluck('name') ?? [],
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Record a login attempt in the workspace audit log.
     * Skipped when there is no matching user or no workspace to attribute it to.
     */
    protected function recordLoginEvent(?User $user, string $subcategory): void
    {
        if (!$user) {
            return;
        }

        $workspace = $user->currentWorkspace;
        if (!$workspace) {
            return;
        }

        AuditService::log(
            workspace: $workspace,
            user: $user,
            action: 'login',
            category: 'Login',
            subcategory: $subcategory,
            source: 'web',
        );
    }
}