<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CompanyImportRequest;
use App\Jobs\ImportCompaniesJob;
use App\Models\CompanyImport;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class CompanyImportController extends Controller
{
    use AuthorizesRequests;

    public function store(CompanyImportRequest $request)
    {
        $this->authorize('create', \App\Models\Company::class);

        $file = $request->file('file');
        $workspaceId = auth()->user()->workspace_id;
        $path = $file->store("imports/{$workspaceId}", 'local');

        $import = CompanyImport::create([
            'workspace_id' => $workspaceId,
            'user_id' => auth()->id(),
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'status' => 'pending',
        ]);

        ImportCompaniesJob::dispatch($import, $path);

        return response()->json([
            'status' => 'success',
            'message' => 'Import started. You will be notified when complete.',
            'data' => [
                'import_id' => $import->id,
                'status' => 'pending',
            ],
        ], 202);
    }

    public function show(CompanyImport $companyImport)
    {
        $this->authorize('view', $companyImport);

        return response()->json([
            'status' => 'success',
            'data' => $companyImport,
        ]);
    }
}
