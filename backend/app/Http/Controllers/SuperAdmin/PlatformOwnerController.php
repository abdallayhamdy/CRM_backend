<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PlatformOwnerController extends Controller
{
    public function index(): JsonResponse
    {
        $owners = User::withoutGlobalScopes()
            ->where('is_super_admin', true)
            ->select('id', 'name', 'email', 'created_at')
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'data' => $owners,
            'meta' => [
                'total' => $owners->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
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

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create Platform Owner.',
            ], 500);
        }

        return response()->json([
            'data' => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at,
            ],
            'message' => 'Platform Owner created successfully.',
        ], 201);
    }

    public function deactivate(Request $request, User $user): JsonResponse
    {
        if (!$user->is_super_admin) {
            return response()->json([
                'message' => 'User is not a Platform Owner.',
            ], 404);
        }

        $totalCount = User::withoutGlobalScopes()
            ->where('is_super_admin', true)
            ->count();

        if ($totalCount <= 1) {
            return response()->json([
                'message' => 'Cannot deactivate the last active Platform Owner. Create another one first.',
            ], 403);
        }

        if ($user->id === auth('sanctum')->id()) {
            return response()->json([
                'message' => 'You cannot deactivate your own account.',
            ], 403);
        }

        $user->tokens()->delete();
        $user->forceFill(['is_super_admin' => false])->save();

        return response()->json([
            'message' => 'Platform Owner deactivated successfully.',
        ]);
    }

    public function terminateSelf(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'The provided password is incorrect.',
            ], 422);
        }

        $totalCount = User::withoutGlobalScopes()
            ->where('is_super_admin', true)
            ->count();

        if ($totalCount <= 1) {
            return response()->json([
                'message' => 'Cannot terminate the last active Platform Owner. Create another one first.',
            ], 403);
        }

        $user->tokens()->delete();
        $user->forceFill(['is_super_admin' => false])->save();

        return response()->json([
            'message' => 'Platform Owner account terminated successfully. You can be restored via artisan command.',
        ]);
    }
}
