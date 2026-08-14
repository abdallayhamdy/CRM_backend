<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\UpdatePlatformSettingsRequest;
use App\Http\Resources\SuperAdmin\PlatformSettingsResource;
use App\Models\PlatformSettings;
use Illuminate\Http\JsonResponse;

class PlatformSettingsController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = PlatformSettings::instance();

        return response()->json([
            'data' => new PlatformSettingsResource($settings),
        ]);
    }

    public function update(UpdatePlatformSettingsRequest $request): JsonResponse
    {
        $settings = PlatformSettings::instance();

        $original = $settings->getOriginal();
        $settings->update($request->validated());
        $settings->refresh();

        // TODO: Add platform-level audit logging when platform audit infrastructure is built.
        // This will use a nullable workspace_id pattern on AuditLog to distinguish
        // platform-level events from workspace-level events.

        return response()->json([
            'data' => new PlatformSettingsResource($settings),
        ]);
    }
}
