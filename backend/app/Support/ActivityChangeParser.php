<?php

namespace App\Support;

class ActivityChangeParser
{
    public const MAX_KEYS = 50;

    public const FIELD_LABELS = [
        'status' => 'Status',
        'owner_id' => 'Owner',
        'assignee_id' => 'Assignee',
        'assigned_to' => 'Assigned to',
        'contact_id' => 'Contact',
        'company_id' => 'Company',
        'deal_id' => 'Deal',
        'ticket_id' => 'Ticket',
        'first_name' => 'First name',
        'last_name' => 'Last name',
        'email' => 'Email',
        'phone' => 'Phone',
        'title' => 'Title',
        'name' => 'Name',
        'subject' => 'Subject',
        'description' => 'Description',
        'content' => 'Content',
        'type' => 'Type',
        'priority' => 'Priority',
        'stage' => 'Stage',
        'value' => 'Value',
        'amount' => 'Amount',
        'due_date' => 'Due date',
        'activity_date' => 'Activity date',
        'completed' => 'Completed',
        'deal_stage' => 'Deal stage',
        'lifecycle_stage' => 'Lifecycle stage',
        'lead_status' => 'Lead status',
        'job_title' => 'Job title',
        'website' => 'Website',
        'address' => 'Address',
        'city' => 'City',
        'country' => 'Country',
        'notes' => 'Notes',
        'tags' => 'Tags',
    ];

    public const SKIP_FIELDS = [
        'updated_at', 'created_at', 'workspace_id', 'id',
    ];

    public const ENTITY_NAME_FIELDS = [
        'contact_id', 'company_id', 'deal_id', 'ticket_id',
        'owner_id', 'assigned_to', 'assignee_id', 'user_id',
    ];

    public const ENUM_VALUES = [
        'status' => [
            'active' => 'Active', 'inactive' => 'Inactive', 'archived' => 'Archived',
            'pending' => 'Pending', 'in_progress' => 'In Progress', 'completed' => 'Completed',
            'open' => 'Open', 'closed' => 'Closed', 'won' => 'Won', 'lost' => 'Lost',
            'contacted' => 'Contacted', 'qualified' => 'Qualified',
            'unqualified' => 'Unqualified', 'new' => 'New', 'proposal' => 'Proposal',
            'negotiation' => 'Negotiation', 'discovery' => 'Discovery',
            'proposal_sent' => 'Proposal Sent', 'contract_sent' => 'Contract Sent',
            'verbal_agreement' => 'Verbal Agreement',
        ],
        'lifecycle_stage' => [
            'lead' => 'Lead', 'mql' => 'MQL', 'sql' => 'SQL',
            'opportunity' => 'Opportunity', 'customer' => 'Customer', 'churned' => 'Churned',
        ],
        'lead_status' => [
            'new' => 'New', 'contacted' => 'Contacted', 'qualified' => 'Qualified',
            'unqualified' => 'Unqualified', 'nurturing' => 'Nurturing',
        ],
        'completed' => [
            'true' => 'Yes', '1' => 'Yes', 'false' => 'No', '0' => 'No',
        ],
    ];

    /**
     * Parse the JSON diff stored in activities.description into a list of
     * field-level changes: [{ key, old, new }].
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
            if (in_array($key, self::SKIP_FIELDS, true)) {
                continue;
            }
            $changes[] = [
                'key' => (string) $key,
                'old' => array_key_exists($key, $old) ? $old[$key] : null,
                'new' => $value,
            ];
        }

        return $changes;
    }

    /**
     * Resolve raw change values through a UUID→name map, adding old_label/new_label.
     *
     * @param  array<int, array{key: string, old: mixed, new: mixed}>  $changes
     * @param  array<string, string>  $nameMap  UUID → display name
     * @return array<int, array{key: string, old: mixed, new: mixed, old_label: ?string, new_label: ?string}>
     */
    public static function resolveChanges(array $changes, array $nameMap = []): array
    {
        $entityFields = array_flip(self::ENTITY_NAME_FIELDS);

        return array_map(function ($change) use ($nameMap, $entityFields) {
            $key = $change['key'];
            $isEntityField = isset($entityFields[$key]);

            $oldLabel = null;
            if ($isEntityField && isset($change['old']) && is_string($change['old'])) {
                $oldLabel = $nameMap[$change['old']] ?? null;
            } elseif (!is_null($change['old'])) {
                $oldLabel = self::formatValue($key, $change['old']);
            }

            $newLabel = null;
            if ($isEntityField && isset($change['new']) && is_string($change['new'])) {
                $newLabel = $nameMap[$change['new']] ?? null;
            } elseif (!is_null($change['new'])) {
                $newLabel = self::formatValue($key, $change['new']);
            }

            return [
                'key' => $key,
                'old' => $change['old'],
                'new' => $change['new'],
                'old_label' => $oldLabel,
                'new_label' => $newLabel,
            ];
        }, $changes);
    }

    /**
     * Build a human-readable summary from resolved changes.
     *
     * @param  array<int, array{key: string, old: mixed, new: mixed, old_label: ?string, new_label: ?string}>  $resolvedChanges
     */
    public static function formatChangeSummary(array $resolvedChanges): string
    {
        $parts = [];

        foreach ($resolvedChanges as $change) {
            $label = self::FIELD_LABELS[$change['key']] ?? str_replace('_', ' ', ucfirst($change['key']));
            $oldDisplay = $change['old_label'] ?? self::formatValue($change['key'], $change['old']) ?? '—';
            $newDisplay = $change['new_label'] ?? self::formatValue($change['key'], $change['new']) ?? '—';

            $parts[] = "{$label} changed from {$oldDisplay} to {$newDisplay}";
        }

        return $parts ? implode(', ', $parts) : '';
    }

    /**
     * Collect all UUID values from changes that reference entities, grouped by field.
     *
     * @param  array<int, array{key: string, old: mixed, new: mixed}>  $changes
     * @return array<string, array<int, string>>  field → unique UUID values
     */
    public static function collectEntityUuids(array $changes): array
    {
        $entityFields = array_flip(self::ENTITY_NAME_FIELDS);
        $uuids = [];

        foreach ($changes as $change) {
            $key = $change['key'];
            if (!isset($entityFields[$key])) {
                continue;
            }
            foreach ([$change['old'], $change['new']] as $val) {
                if (is_string($val) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $val)) {
                    $uuids[$key][$val] = true;
                }
            }
        }

        return array_map(fn($set) => array_keys($set), $uuids);
    }

    /**
     * Format a raw value for human display (enums, booleans, etc.).
     */
    public static function formatValue(string $key, mixed $value): ?string
    {
        if ($value === null || $value === '' || $value === false) {
            return null;
        }

        if (isset(self::ENUM_VALUES[$key])) {
            $strVal = strtolower((string) $value);
            return self::ENUM_VALUES[$key][$strVal] ?? (string) $value;
        }

        if (str_contains($key, 'date') || str_contains($key, '_at')) {
            try {
                $d = new \DateTime((string) $value);
                if ($d->getTimestamp() > 0) {
                    return $d->format('M d, Y \a\t g:i A');
                }
            } catch (\Exception) {
                // fall through
            }
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        return (string) $value;
    }

    public static function hasChanges(?string $description): bool
    {
        return self::parse($description) !== [];
    }
}
