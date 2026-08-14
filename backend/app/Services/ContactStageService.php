<?php

namespace App\Services;

use App\Models\Stage;

class ContactStageService
{
    const DEFAULT_STAGES = [
        ['slug' => 'subscriber', 'name' => 'Subscriber', 'color' => '#3b82f6', 'order' => 0],
        ['slug' => 'lead', 'name' => 'Lead', 'color' => '#ef4444', 'order' => 1],
        ['slug' => 'marketing_qualified_lead', 'name' => 'Marketing Qualified Lead', 'color' => '#0d9488', 'order' => 2],
        ['slug' => 'sales_qualified_lead', 'name' => 'Sales Qualified Lead', 'color' => '#ec4899', 'order' => 3],
        ['slug' => 'opportunity', 'name' => 'Opportunity', 'color' => '#f59e0b', 'order' => 4],
        ['slug' => 'customer', 'name' => 'Customer', 'color' => '#8b5cf6', 'order' => 5],
        ['slug' => 'evangelist', 'name' => 'Evangelist', 'color' => '#c4b5fd', 'order' => 6],
        ['slug' => 'other', 'name' => 'Other', 'color' => '#d1d5db', 'order' => 7],
    ];

    public function ensureStagesExist(string $workspaceId): void
    {
        $hasStages = Stage::withoutGlobalScope('workspace')
            ->where('workspace_id', $workspaceId)
            ->where('object_type', 'contact')
            ->exists();

        if (!$hasStages) {
            foreach (self::DEFAULT_STAGES as $stageData) {
                Stage::withoutGlobalScope('workspace')->firstOrCreate(
                    [
                        'workspace_id' => $workspaceId,
                        'object_type' => 'contact',
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
            ->where('object_type', 'contact')
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
