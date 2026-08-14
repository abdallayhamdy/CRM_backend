<?php

namespace App\Services;

use App\Models\Stage;

class CompanyStageService
{
    const DEFAULT_STAGES = [
        ['slug' => 'lead', 'name' => 'Lead', 'color' => '#f59e0b', 'order' => 0],
        ['slug' => 'prospect', 'name' => 'Prospect', 'color' => '#3b82f6', 'order' => 1],
        ['slug' => 'opportunity', 'name' => 'Opportunity', 'color' => '#8b5cf6', 'order' => 2],
        ['slug' => 'customer', 'name' => 'Customer', 'color' => '#10b981', 'order' => 3],
        ['slug' => 'churned', 'name' => 'Churned', 'color' => '#ef4444', 'order' => 4],
    ];

    public function ensureStagesExist(string $workspaceId): void
    {
        $hasStages = Stage::withoutGlobalScope('workspace')
            ->where('workspace_id', $workspaceId)
            ->where('object_type', 'company')
            ->exists();

        if (!$hasStages) {
            foreach (self::DEFAULT_STAGES as $stageData) {
                Stage::withoutGlobalScope('workspace')->firstOrCreate(
                    [
                        'workspace_id' => $workspaceId,
                        'object_type' => 'company',
                        'slug' => $stageData['slug'],
                    ],
                    [
                        'name' => $stageData['name'],
                        'color' => $stageData['color'],
                        'order' => $stageData['order'],
                        'is_system' => true,
                    ]
                );
            }
        }
    }

    public function resolveStageId(string $workspaceId, string $slug): ?string
    {
        $this->ensureStagesExist($workspaceId);
        return Stage::where('workspace_id', $workspaceId)
            ->where('object_type', 'company')
            ->where('slug', $slug)
            ->value('id');
    }

    public function resolveSlug(?string $stageId): ?string
    {
        if (!$stageId) {
            return null;
        }
        return Stage::where('id', $stageId)->value('slug');
    }
}
