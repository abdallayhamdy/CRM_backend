<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateUserProfileRequest;
use App\Http\Resources\UserProfileResource;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class UserProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => new UserProfileResource($user),
        ]);
    }

    public function update(UpdateUserProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $nameParts = [];
        if (array_key_exists('first_name', $validated)) {
            $nameParts[] = $validated['first_name'];
        }
        if (array_key_exists('last_name', $validated)) {
            $nameParts[] = $validated['last_name'] ?? '';
        }

        if (!empty($nameParts)) {
            $user->update(['name' => trim(implode(' ', $nameParts))]);
            unset($validated['first_name'], $validated['last_name']);
        }

        if (!empty($validated)) {
            $user->update($validated);
        }

        return response()->json([
            'data' => new UserProfileResource($user->fresh()),
            'message' => 'Profile updated successfully.',
        ]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update(['password' => $request->password]);

        $user->tokens()->delete();

        $workspace = $user->currentWorkspace;
        if ($workspace) {
            AuditService::log(
                workspace: $workspace,
                user: $user,
                action: 'updated',
                category: 'Security',
                subcategory: 'Password Changed',
                source: 'web',
            );
        }

        return response()->json([
            'message' => 'Password changed successfully. Please log in again.',
        ]);
    }

    public function sessions(Request $request): JsonResponse
    {
        $user = $request->user();
        $sessions = DB::table('sessions')
            ->where('user_id', $user->id)
            ->orderBy('last_activity', 'desc')
            ->get()
            ->map(function ($session) {
                $payload = json_decode($session->payload, true);
                return [
                    'id' => $session->id,
                    'ip_address' => $session->ip_address,
                    'user_agent' => $session->user_agent,
                    'last_activity' => $session->last_activity,
                    'is_current' => $session->id === request()->session()->getId(),
                ];
            });

        return response()->json([
            'data' => $sessions,
        ]);
    }

    public function logoutAll(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->tokens()->delete();
        DB::table('sessions')->where('user_id', $user->id)->delete();

        return response()->json([
            'message' => 'Logged out of all sessions.',
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,gif|max:2048',
        ]);

        $user = $request->user();

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar_path' => $path]);

        return response()->json([
            'data' => [
                'avatar_url' => '/storage/' . $path,
                'avatar_path' => $path,
            ],
            'message' => 'Avatar uploaded successfully.',
        ]);
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
            $user->update(['avatar_path' => null]);
        }

        return response()->json([
            'data' => ['avatar_url' => null, 'avatar_path' => null],
            'message' => 'Avatar removed.',
        ]);
    }
}
