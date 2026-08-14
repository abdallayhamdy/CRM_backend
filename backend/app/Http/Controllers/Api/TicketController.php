<?php

namespace App\Http\Controllers\Api;

use App\Models\Ticket;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Requests\UpdateTicketRequest;
use App\Http\Resources\TicketResource;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class TicketController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Ticket::class);

        $query = Ticket::with(['contact', 'assignee']);

        if ($request->q) {
            $query->where('subject', 'like', "%{$request->q}%");
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->priority) {
            $query->where('priority', $request->priority);
        }

        if ($request->owner_id) {
            $query->where('assigned_to', $request->owner_id);
        }

        // Record-scoped filtering
        if ($request->contact_id) {
            $query->where('contact_id', $request->contact_id);
        }

        // Tickets do not carry a company_id column; scope via the ticket's contact
        if ($request->company_id) {
            $query->whereHas('contact', function ($q) use ($request) {
                $q->where('company_id', $request->company_id);
            });
        }

        // Tickets do not link to deals directly; scope via the deal's contact
        if ($request->deal_id) {
            $query->whereHas('contact', function ($q) use ($request) {
                $q->whereHas('deals', function ($dq) use ($request) {
                    $dq->where('deals.id', $request->deal_id);
                });
            });
        }

        $query->latest();

        $tickets = $query->paginate($this->paginationLimit($request));

        return response()->json([
            'status' => 'success',
            'data' => TicketResource::collection($tickets),
            'meta' => [
                'page' => $tickets->currentPage(),
                'limit' => $tickets->perPage(),
                'total' => $tickets->total(),
                'last_page' => $tickets->lastPage(),
            ],
        ]);
    }

    public function store(StoreTicketRequest $request)
    {
        $this->authorize('create', Ticket::class);
        $data = $this->mapRequestFields($request->validated());
        $ticket = Ticket::create($data);

        return response()->json([
            'status' => 'success',
            'data' => new TicketResource($ticket->load(['contact', 'assignee']))
        ], 201);
    }

    public function show(Ticket $ticket)
    {
        $this->authorize('view', $ticket);
        return response()->json([
            'status' => 'success',
            'data' => new TicketResource($ticket->load(['contact', 'assignee', 'documents', 'activities']))
        ]);
    }

    public function update(UpdateTicketRequest $request, Ticket $ticket)
    {
        $this->authorize('update', $ticket);
        $data = $this->mapRequestFields($request->validated());
        $ticket->update($data);

        return response()->json([
            'status' => 'success',
            'data' => new TicketResource($ticket->load(['contact', 'assignee']))
        ]);
    }

    public function destroy(Ticket $ticket)
    {
        $this->authorize('delete', $ticket);
        $ticket->delete();
        return response()->json(['status' => 'success', 'data' => null]);
    }

    protected function mapRequestFields(array $data): array
    {
        $user = auth('sanctum')->user();
        $mapped = [
            'workspace_id' => $user->workspace_id,
        ];

        if (isset($data['subject'])) $mapped['subject'] = $data['subject'];
        if (isset($data['description'])) $mapped['description'] = $data['description'];
        if (isset($data['status'])) $mapped['status'] = $data['status'];
        if (isset($data['priority'])) $mapped['priority'] = $data['priority'];
        if (isset($data['contact_id'])) $mapped['contact_id'] = $data['contact_id'];

        // owner_id -> assigned_to
        if (isset($data['owner_id'])) {
            $mapped['assigned_to'] = $data['owner_id'];
        }
        if (isset($data['assigned_to'])) {
            $mapped['assigned_to'] = $data['assigned_to'];
        }

        if (isset($data['custom_fields'])) {
            $mapped['custom_data'] = $data['custom_fields'];
        }

        return $mapped;
    }
}
