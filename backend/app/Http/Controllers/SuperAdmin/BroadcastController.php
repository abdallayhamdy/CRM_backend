<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StoreBroadcastRequest;
use App\Http\Resources\SuperAdmin\BroadcastMessageResource;
use App\Models\BroadcastMessage;
use App\Models\PlatformAuditLog;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;

class BroadcastController extends Controller
{
    public function index(): JsonResponse
    {
        $messages = BroadcastMessage::query()
            ->latest()
            ->get();

        return response()->json([
            'data' => BroadcastMessageResource::collection($messages),
        ]);
    }

    public function store(StoreBroadcastRequest $request): JsonResponse
    {
        $audience = $request->validated('audience');

        $recipientCount = match ($audience) {
            'All Tenants' => Workspace::count(),
            'Active Only' => Workspace::where('status', 'active')->count(),
            'Trial Only' => Workspace::where('status', 'trial')->count(),
            default => 0,
        };

        $message = BroadcastMessage::create([
            'title' => $request->validated('title'),
            'message' => $request->validated('message'),
            'audience' => $audience,
            'sent_by' => $request->user()->name,
            'recipient_count' => $recipientCount,
            'sent_at' => now(),
        ]);

        PlatformAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'broadcast_sent',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'metadata' => [
                'broadcast_id' => $message->id,
                'broadcast_title' => $message->title,
                'audience' => $audience,
                'recipient_count' => $recipientCount,
            ],
        ]);

        return response()->json([
            'data' => new BroadcastMessageResource($message),
        ], 201);
    }
}
