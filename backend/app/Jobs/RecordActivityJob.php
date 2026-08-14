<?php

namespace App\Jobs;

use App\Models\Activity;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;

class RecordActivityJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $userId,
        public ?string $workspaceId,
        public string $activitableType,
        public string $activitableId,
        public string $action,
        public string $subject,
        public ?array $details = null,
    ) {
        $this->afterCommit = !app()->runningUnitTests();
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $activityDate = $this->resolveActivityDate();

        Activity::create([
            'user_id' => $this->userId,
            'workspace_id' => $this->workspaceId,
            'activitable_type' => $this->activitableType,
            'activitable_id' => $this->activitableId,
            'type' => $this->action,
            'subject' => $this->subject,
            'description' => $this->details ? json_encode($this->details) : null,
            'activity_date' => $activityDate,
        ]);
    }

    /**
     * Prefer the actual update timestamp captured in the diff payload
     * (details["new"]["updated_at"]) so delayed queue processing does not
     * rewrite the activity date. Falls back to now() for older payloads.
     */
    private function resolveActivityDate(): Carbon
    {
        $updatedAt = $this->details['new']['updated_at'] ?? null;
        if (is_string($updatedAt) || $updatedAt instanceof \DateTimeInterface) {
            try {
                $parsed = Carbon::parse($updatedAt);
                if ($parsed->isValid()) {
                    return $parsed;
                }
            } catch (\Throwable) {
                // fall through to now()
            }
        }

        return now();
    }
}
