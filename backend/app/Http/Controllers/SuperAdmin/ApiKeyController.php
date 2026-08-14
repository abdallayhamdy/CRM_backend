<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\CreateApiKeyRequest;
use App\Http\Resources\SuperAdmin\ApiKeyResource;
use App\Models\ApiKey;
use App\Models\PlatformAuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ApiKeyController extends Controller
{
    public function index(): JsonResponse
    {
        $keys = ApiKey::query()
            ->latest()
            ->get();

        return response()->json([
            'data' => ApiKeyResource::collection($keys),
        ]);
    }

    public function store(CreateApiKeyRequest $request): JsonResponse
    {
        $raw = 'sk_' . Str::random(30);

        $apiKey = ApiKey::create([
            'name' => $request->validated('name'),
            'key_hash' => hash('sha256', $raw),
            'key_prefix' => 'sk_',
            'key_tail' => substr($raw, -4),
        ]);

        PlatformAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'api_key_created',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'metadata' => [
                'api_key_id' => $apiKey->id,
                'api_key_name' => $apiKey->name,
            ],
        ]);

        return response()->json([
            'data' => [
                'id' => $apiKey->id,
                'name' => $apiKey->name,
                'key_preview' => $apiKey->key_prefix . '••••••' . $apiKey->key_tail,
                'created_at' => $apiKey->created_at->toISOString(),
                'last_used_at' => null,
                'status' => 'Active',
                'full_key' => $raw,
            ],
        ], 201);
    }

    public function revoke(ApiKey $apiKey): JsonResponse
    {
        if (! $apiKey->isActive()) {
            return response()->json([
                'message' => 'This API key is already revoked.',
            ], 422);
        }

        $apiKey->update(['revoked_at' => now()]);

        PlatformAuditLog::create([
            'admin_id' => auth('sanctum')->id(),
            'action' => 'api_key_revoked',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => [
                'api_key_id' => $apiKey->id,
                'api_key_name' => $apiKey->name,
            ],
        ]);

        return response()->json([
            'data' => new ApiKeyResource($apiKey->refresh()),
        ]);
    }
}
