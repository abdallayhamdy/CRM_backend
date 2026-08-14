<?php

namespace App\Support;

class ActivityChangeParser
{
    public const MAX_KEYS = 50;

    /**
     * Parse the JSON diff stored in activities.description into a list of
     * field-level changes: [{ key, old, new }].
     *
     * Handles:
     *  - null / empty descriptions (created, deleted, user-entered activity)
     *  - free-text descriptions written by ActivityController::store
     *  - {"old": {...}, "new": {...}} payloads written by RecordActivityJob
     *
     * @return array<int, array{key: string, old: mixed, new: mixed}>
     */
    public static function parse(?string $description): array
    {
        if ($description === null || trim($description) === '') {
            return [];
        }

        $data = json_decode($description, true);
        if (!is_array($data) || !isset($data['new']) || !is_array($data['new'])) {
            return [];
        }

        $old = is_array($data['old'] ?? null) ? $data['old'] : [];
        $changes = [];

        foreach ($data['new'] as $key => $value) {
            if (count($changes) >= self::MAX_KEYS) {
                break;
            }
            $changes[] = [
                'key' => (string) $key,
                'old' => array_key_exists($key, $old) ? $old[$key] : null,
                'new' => $value,
            ];
        }

        return $changes;
    }

    public static function hasChanges(?string $description): bool
    {
        return self::parse($description) !== [];
    }
}
