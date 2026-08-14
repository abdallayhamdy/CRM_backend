<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\UpdateEmailTemplateRequest;
use App\Http\Resources\SuperAdmin\EmailTemplateResource;
use App\Models\EmailTemplate;
use App\Models\PlatformAuditLog;
use Illuminate\Http\JsonResponse;

class EmailTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        $templates = EmailTemplate::query()
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => EmailTemplateResource::collection($templates),
        ]);
    }

    public function show(EmailTemplate $emailTemplate): JsonResponse
    {
        return response()->json([
            'data' => new EmailTemplateResource($emailTemplate),
        ]);
    }

    public function update(UpdateEmailTemplateRequest $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $previous = $emailTemplate->only(['name', 'subject', 'body', 'is_active']);

        $emailTemplate->update($request->validated());
        $emailTemplate->refresh();

        PlatformAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'email_template_updated',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'metadata' => [
                'template_key' => $emailTemplate->key,
                'template_name' => $emailTemplate->name,
                'previous' => $previous,
                'current' => $emailTemplate->only(['name', 'subject', 'body', 'is_active']),
            ],
        ]);

        return response()->json([
            'data' => new EmailTemplateResource($emailTemplate),
        ]);
    }
}
