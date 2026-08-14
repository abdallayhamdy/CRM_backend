<?php

namespace App\Services;

use App\Models\Stage;

class StageSyncService
{
    /**
     * Sync object config lifecycle stages into the stages table so that the
     * configured stages are the source of truth for Contacts and Companies.
     *
     * Stages that are no longer present in the config are removed; existing
     * record assignments are cleaned up automatically via nullOnDelete FKs.
     */
    public function sync(string $workspaceId, string $objectType, array $configStages): void
    {
        if (!in_array($objectType, ['contact', 'company'], true)) {
            return;
        }

        $seenSlugs = [];

        foreach ($configStages as $index => $stageData) {
            $slug = (string) ($stageData['id'] ?? '');
            if ($slug === '') {
                continue;
            }
            $seenSlugs[] = $slug;

            Stage::withoutGlobalScope('workspace')->updateOrCreate(
                [
                    'workspace_id' => $workspaceId,
                    'object_type' => $objectType,
                    'slug' => $slug,
                ],
                [
                    'name' => (string) ($stageData['name'] ?? $slug),
                    'color' => (string) ($stageData['color'] ?? '#3b82f6'),
                    'order' => (int) ($stageData['order'] ?? $index),
                ],
            );
        }

        // Only clean up when the config actually defines stages; an empty
        // payload (e.g. malformed request) should never wipe all stages.
        if (count($seenSlugs) > 0) {
            Stage::withoutGlobalScope('workspace')
                ->where('workspace_id', $workspaceId)
                ->where('object_type', $objectType)
                ->whereNotIn('slug', $seenSlugs)
                ->delete();
        }
    }
}
