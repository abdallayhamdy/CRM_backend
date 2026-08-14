<?php

namespace App\Observers;

use App\Models\Workspace;
use App\Services\ContactStageService;

class WorkspaceObserver
{
    public function created(Workspace $workspace): void
    {
        app(ContactStageService::class)->ensureStagesExist($workspace->id);
    }
}
