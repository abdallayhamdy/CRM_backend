<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\UpdateTicketStatusRequest;
use App\Http\Resources\SuperAdmin\SupportTicketResource;
use App\Models\PlatformAuditLog;
use App\Models\SupportTicket;
use Illuminate\Http\JsonResponse;

class SupportTicketController extends Controller
{
    public function index(): JsonResponse
    {
        $tickets = SupportTicket::query()
            ->with('tenant')
            ->latest()
            ->get();

        return response()->json([
            'data' => SupportTicketResource::collection($tickets),
        ]);
    }

    public function updateStatus(UpdateTicketStatusRequest $request, SupportTicket $ticket): JsonResponse
    {
        $previous = $ticket->status;
        $ticket->update(['status' => $request->validated('status')]);

        PlatformAuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => 'support_ticket_status_changed',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'metadata' => [
                'ticket_id' => $ticket->id,
                'ticket_subject' => $ticket->subject,
                'previous_status' => $previous,
                'new_status' => $ticket->status,
            ],
        ]);

        return response()->json([
            'data' => new SupportTicketResource($ticket->load('tenant')),
        ]);
    }
}
