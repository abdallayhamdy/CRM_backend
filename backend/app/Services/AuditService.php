<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Model;

class AuditService
{
    public static function log(
        Workspace $workspace,
        User $user,
        string $action,
        string $category = null,
        string $subcategory = null,
        Model $auditable = null,
        array $changes = null,
        string $source = null,
        string $source_url = null,
        string $assisted_by = null,
    ): AuditLog {
        return AuditLog::create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'action' => $action,
            'category' => $category,
            'subcategory' => $subcategory,
            'auditable_type' => $auditable ? get_class($auditable) : null,
            'auditable_id' => $auditable ? $auditable->getKey() : null,
            'changes' => $changes,
            'source' => $source,
            'source_url' => $source_url,
            'assisted_by' => $assisted_by,
        ]);
    }
}
