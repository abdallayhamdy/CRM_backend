<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DealResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $customData = $this->custom_data ?? [];

        return [
            'id' => $this->id,
            'title' => $this->title,
            'amount' => (float) $this->amount,
            'stage' => $this->whenLoaded('pipelineStage', function () {
                if (!$this->pipelineStage) return null;
                // Match the frontend slug format used across the UI:
                // lowercase with single spaces replaced by underscores
                // (e.g. "Closed Won" -> "closed_won").
                return strtolower(str_replace(' ', '_', $this->pipelineStage->name));
            }),
            'contact_id' => $this->contact_id,
            'company_id' => $this->company_id,
            'owner_id' => $this->assigned_to,
            'close_date' => $this->expected_close_date?->format('Y-m-d'),
            'probability' => $this->whenLoaded('pipelineStage', function () {
                return $this->pipelineStage?->win_probability ?? 0;
            }),
            'pipeline' => $this->whenLoaded('pipelineStage.pipeline', function () {
                return $this->pipelineStage?->pipeline?->name;
            }),
            'pipeline_id' => $this->whenLoaded('pipelineStage', function () {
                return $this->pipelineStage?->pipeline_id;
            }),
            'pipeline_stage' => $this->whenLoaded('pipelineStage', function () {
                if (!$this->pipelineStage) return null;
                return [
                    'id' => $this->pipelineStage->id,
                    'name' => $this->pipelineStage->name,
                    'stage_order' => $this->pipelineStage->display_order,
                ];
            }),
            'stage_id' => $this->stage_id,
            'pipeline_stage_id' => $this->pipeline_stage_id,
            'deal_type' => $customData['deal_type'] ?? null,
            'priority' => $customData['priority'] ?? null,
            'custom_fields' => $customData,
            'status' => $this->status,
            'contact' => new ContactResource($this->whenLoaded('contact')),
            'company' => new CompanyResource($this->whenLoaded('company')),
            'owner' => $this->whenLoaded('assignee', function () {
                if (!$this->assignee) return null;
                return [
                    'id' => $this->assignee->id,
                    'first_name' => $this->assignee->first_name ?? $this->assignee->name,
                    'last_name' => $this->assignee->last_name ?? '',
                ];
            }),
            'workspace_id' => $this->workspace_id,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
            'activities' => ActivityResource::collection($this->whenLoaded('activities')),
            'notes' => NoteResource::collection($this->whenLoaded('notes')),
            'tasks' => TaskResource::collection($this->whenLoaded('tasks')),
        ];
    }
}
