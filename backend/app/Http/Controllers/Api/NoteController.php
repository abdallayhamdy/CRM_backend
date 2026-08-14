<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Note;
use App\Http\Requests\StoreNoteRequest;
use App\Http\Requests\UpdateNoteRequest;
use App\Http\Resources\NoteResource;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;


class NoteController extends Controller
{
    use AuthorizesRequests;

    protected $typeMap = [
        'company' => \App\Models\Company::class,
        'contact' => \App\Models\Contact::class,
        'deal'    => \App\Models\Deal::class,
    ];

    public function index(Request $request)
    {
        $this->authorize('viewAny', Note::class);

        $query = Note::with('user');

        if ($request->q) {
            $query->where(function ($q) use ($request) {
                $q->where('content', 'like', "%{$request->q}%");
            });
        }

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        // Record-scoped filtering (polymorphic notable relation)
        if ($request->contact_id) {
            $query->where('notable_type', \App\Models\Contact::class)
                ->where('notable_id', $request->contact_id);
        }

        if ($request->company_id) {
            $query->where('notable_type', \App\Models\Company::class)
                ->where('notable_id', $request->company_id);
        }

        if ($request->deal_id) {
            $query->where('notable_type', \App\Models\Deal::class)
                ->where('notable_id', $request->deal_id);
        }

        if ($request->ticket_id) {
            $query->where('notable_type', \App\Models\Ticket::class)
                ->where('notable_id', $request->ticket_id);
        }

        $sortBy = in_array($request->sort_by, ['created_at', 'updated_at']) ? $request->sort_by : 'created_at';
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        $notes = $query->paginate($this->paginationLimit($request));

        return response()->json([
            'status' => 'success',
            'data' => NoteResource::collection($notes),
            'meta' => [
                'page' => $notes->currentPage(),
                'limit' => $notes->perPage(),
                'total' => $notes->total(),
                'last_page' => $notes->lastPage(),
            ],
        ]);
    }

    public function store(StoreNoteRequest $request)
    {
        $this->authorize('create', Note::class);

        $data = $request->validated();

        $data['user_id'] = auth('sanctum')->id();
        $data['workspace_id'] = auth('sanctum')->user()->workspace_id;
        if (isset($data['notable_type'])) {
            $data['notable_type'] = $this->typeMap[$data['notable_type']];
        }

        $note = Note::create($data);
        $note->load('user');

        return response()->json([
            'status' => 'success',
            'message' => 'added successfully',
            'data' => new NoteResource($note)
        ], 201);
    }

    public function show(Note $note)
    {
        $this->authorize('view', $note);

        $note->load('user');

        return response()->json([
            'status' => 'success',
            'data' => new NoteResource($note)
        ]);
    }

    public function update(UpdateNoteRequest $request, Note $note)
    {
        $this->authorize('update', $note);

        $data = $request->validated();

        if (isset($data['notable_type'])) {
            $data['notable_type'] = $this->typeMap[$data['notable_type']];
        }

        $note->update($data);
        $note->load('user');

        return response()->json([
            'status' => 'success',
            'message' => 'updated successfully',
            'data' => new NoteResource($note)
        ]);
    }

    public function destroy(Note $note)
    {
        $this->authorize('delete', $note);

        $note->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'deleted successfully'
        ]);
    }
}