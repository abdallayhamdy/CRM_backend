<?php

namespace App\Http\Controllers\Api;

use App\Models\Document;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\UpdateDocumentRequest;
use App\Http\Resources\DocumentResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class DocumentController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Document::class);

        $query = Document::with('uploader:id,name');

        $workspaceId = $request->user()?->workspace_id;
        if ($workspaceId) {
            $query->where('workspace_id', $workspaceId);
        }

        if ($request->has('documentable_type') && $request->has('documentable_id')) {
            $type = $this->getModelClass($request->documentable_type);
            $query->where('documentable_type', $type)
                  ->where('documentable_id', $request->documentable_id);
        }

        if ($request->q) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->q}%")
                  ->orWhere('mime_type', 'like', "%{$request->q}%");
            });
        }

        $query->applyRecordScope(auth('sanctum')->user(), 'documents', 'view');

        $sortBy = in_array($request->sort_by, ['name', 'size', 'mime_type', 'created_at', 'updated_at']) ? $request->sort_by : 'created_at';
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortDir);

        $documents = $query->paginate($this->paginationLimit($request));

        return response()->json([
            'status' => 'success',
            'data' => DocumentResource::collection($documents),
            'meta' => [
                'page' => $documents->currentPage(),
                'limit' => $documents->perPage(),
                'total' => $documents->total(),
                'last_page' => $documents->lastPage(),
            ],
        ]);
    }

    public function show(Document $document)
    {
        $this->authorize('view', $document);

        $document->load('uploader:id,name');

        return response()->json([
            'status' => 'success',
            'data' => new DocumentResource($document),
        ]);
    }

    public function update(UpdateDocumentRequest $request, Document $document)
    {
        $this->authorize('update', $document);

        $document->update($request->validated());

        return response()->json([
            'status' => 'success',
            'data' => new DocumentResource($document->load('uploader:id,name')),
        ]);
    }

    public function store(StoreDocumentRequest $request)
    {
        $this->authorize('create', Document::class);

        $file = $request->file('file');
        $workspaceId = auth()->user()->workspace_id;
        $path = $file->store("documents/{$workspaceId}", 'local');

        try {
            $document = \Illuminate\Support\Facades\DB::transaction(function () use ($workspaceId, $request, $path, $file) {
                return Document::create([
                    'workspace_id' => $workspaceId,
                    'documentable_type' => $this->getModelClass($request->documentable_type),
                    'documentable_id' => $request->documentable_id,
                    'name' => $request->name ?? $file->getClientOriginalName(),
                    'document_type' => $request->document_type ?? 'General',
                    'file_path' => $path,
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                    'uploaded_by' => auth()->id(),
                ]);
            });
        } catch (\Throwable $e) {
            if (Storage::disk('local')->exists($path)) {
                Storage::disk('local')->delete($path);
            }
            throw $e;
        }

        $document->load('uploader:id,name');

        return response()->json([
            'status' => 'success',
            'data' => new DocumentResource($document),
        ], 201);
    }

    public function download(Document $document)
    {
        $this->authorize('view', $document);

        if (!Storage::disk('local')->exists($document->file_path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        return Storage::disk('local')->download($document->file_path, $document->name);
    }

    public function destroy(Document $document)
    {
        $this->authorize('delete', $document);
        if (Storage::disk('local')->exists($document->file_path)) {
            Storage::disk('local')->delete($document->file_path);
        }

        $document->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Document deleted successfully',
        ]);
    }

    private function getModelClass($type)
    {
        $map = [
            'deal' => 'App\Models\Deal',
            'contact' => 'App\Models\Contact',
            'company' => 'App\Models\Company',
            'product' => 'App\Models\Product',
            'ticket' => 'App\Models\Ticket',
        ];

        return $map[strtolower($type)] ?? null;
    }
}