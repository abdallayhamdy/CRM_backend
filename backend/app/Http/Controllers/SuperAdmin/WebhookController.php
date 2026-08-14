<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StoreWebhookRequest;
use App\Http\Resources\SuperAdmin\WebhookResource;
use App\Models\PlatformAuditLog;
use App\Models\Webhook;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class WebhookController extends Controller
{
    public function index(): JsonResponse
    {
        $webhooks = Webhook::query()
            ->latest()
            ->get();

        return response()->json([
            'data' => WebhookResource::collection($webhooks),
        ]);
    }

    public function store(StoreWebhookRequest $request): JsonResponse
    {
        $webhook = Webhook::create([
            'url' => $request->validated('url'),
            'secret' => Str::random(48),
            'events' => $request->validated('events'),
            'is_active' => true,
        ]);

        PlatformAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'webhook_created',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'metadata' => [
                'webhook_id' => $webhook->id,
                'webhook_url' => $webhook->url,
            ],
        ]);

        return response()->json([
            'data' => new WebhookResource($webhook),
        ], 201);
    }

    public function toggle(Webhook $webhook): JsonResponse
    {
        $webhook->update(['is_active' => ! $webhook->is_active]);

        PlatformAuditLog::create([
            'admin_id' => auth('sanctum')->id(),
            'action' => 'webhook_status_changed',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => [
                'webhook_id' => $webhook->id,
                'webhook_url' => $webhook->url,
                'status' => $webhook->status(),
            ],
        ]);

        return response()->json([
            'data' => new WebhookResource($webhook->refresh()),
        ]);
    }

    public function destroy(Webhook $webhook): JsonResponse
    {
        PlatformAuditLog::create([
            'admin_id' => auth('sanctum')->id(),
            'action' => 'webhook_deleted',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => [
                'webhook_id' => $webhook->id,
                'webhook_url' => $webhook->url,
            ],
        ]);

        $webhook->delete();

        return response()->json([
            'data' => ['id' => $webhook->id],
        ]);
    }
}
