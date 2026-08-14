<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateNotificationPreferenceRequest;
use App\Http\Resources\NotificationPreferenceResource;
use App\Models\NotificationPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    private const DEFAULTS = [
        'channels' => ['email' => true, 'bell' => true, 'browser' => true, 'popup' => true],
        'new_leads' => true,
        'task_reminders' => true,
        'weekly_digest' => false,
        'browser_alerts' => true,
    ];

    public function show(Request $request): JsonResponse
    {
        $preference = NotificationPreference::firstOrCreate(
            ['user_id' => $request->user()->id],
            self::DEFAULTS
        );

        return response()->json([
            'data' => new NotificationPreferenceResource($preference),
        ]);
    }

    public function update(UpdateNotificationPreferenceRequest $request): JsonResponse
    {
        $preference = NotificationPreference::firstOrCreate(
            ['user_id' => $request->user()->id],
            self::DEFAULTS
        );

        $preference->update($request->validated());

        return response()->json([
            'data' => new NotificationPreferenceResource($preference->fresh()),
            'message' => 'Notification preferences saved.',
        ]);
    }
}
