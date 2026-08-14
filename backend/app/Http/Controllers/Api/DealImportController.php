<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DealImportRequest;
use App\Jobs\ImportDealsJob;
use App\Models\DealImport;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class DealImportController extends Controller
{
    use AuthorizesRequests;

    public function store(DealImportRequest $request)
    {
        $this->authorize('create', \App\Models\Deal::class);

        $file = $request->file('file');
        $workspaceId = auth()->user()->workspace_id;
        $path = $file->store("imports/{$workspaceId}", 'local');

        $import = DealImport::create([
            'workspace_id' => $workspaceId,
            'user_id' => auth()->id(),
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'status' => 'pending',
        ]);

        ImportDealsJob::dispatch($import, $path);

        return response()->json([
            'status' => 'success',
            'message' => 'Import started. You will be notified when complete.',
            'data' => [
                'import_id' => $import->id,
                'status' => 'pending',
            ],
        ], 202);
    }

    public function show(DealImport $dealImport)
    {
        $this->authorize('view', $dealImport);

        return response()->json([
            'status' => 'success',
            'data' => $dealImport,
        ]);
    }
}
