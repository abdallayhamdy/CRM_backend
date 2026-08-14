<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactImportRequest;
use App\Jobs\ImportContactsJob;
use App\Models\ContactImport;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Storage;

class ContactImportController extends Controller
{
    use AuthorizesRequests;

    public function store(ContactImportRequest $request)
    {
        $this->authorize('create', \App\Models\Contact::class);

        $file = $request->file('file');
        $workspaceId = auth()->user()->workspace_id;
        $path = $file->store("imports/{$workspaceId}", 'local');

        $import = ContactImport::create([
            'workspace_id' => $workspaceId,
            'user_id' => auth()->id(),
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'status' => 'pending',
        ]);

        ImportContactsJob::dispatch($import, $path);

        return response()->json([
            'status' => 'success',
            'message' => 'Import started. You will be notified when complete.',
            'data' => [
                'import_id' => $import->id,
                'status' => 'pending',
            ],
        ], 202);
    }

    public function show(ContactImport $contactImport)
    {
        $this->authorize('view', $contactImport);

        return response()->json([
            'status' => 'success',
            'data' => $contactImport,
        ]);
    }
}
