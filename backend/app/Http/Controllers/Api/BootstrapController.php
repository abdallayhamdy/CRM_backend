<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PlatformSettings;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;

class BootstrapController extends Controller
{
    public function status(): JsonResponse
    {
        $isCompleted = $this->isBootstrapCompleted();

        return response()->json([
            'data' => [
                'has_platform_owner' => $isCompleted,
            ],
        ]);
    }

    public function create(Request $request): JsonResponse
    {
        if ($this->isBootstrapCompleted()) {
            return response()->json([
                'message' => 'Bootstrap has already been completed. Use the admin dashboard or Artisan command to manage Platform Owners.',
            ], 403);
        }

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        DB::beginTransaction();
        try {
            $user = User::create([
                'name'     => $validated['name'],
                'email'    => $validated['email'],
                'password' => $validated['password'],
            ]);

            $user->forceFill(['is_super_admin' => true])->save();

            PlatformSettings::instance()->forceFill(['bootstrap_completed_at' => now()])->save();

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create Platform Owner.',
            ], 500);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'data' => [
                'message' => 'Platform Owner created successfully.',
                'user' => [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                ],
                'token' => $token,
            ],
        ], 201);
    }

    private function isBootstrapCompleted(): bool
    {
        $settings = PlatformSettings::instance();

        if ($settings->bootstrap_completed_at !== null) {
            return true;
        }

        // Defense-in-depth: a Platform Owner already existing means the platform
        // was bootstrapped even if the flag was never persisted (legacy DBs).
        return User::where('is_super_admin', true)->exists();
    }
}
