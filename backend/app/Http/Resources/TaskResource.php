<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status ?? 'pending',
            'due_date' => $this->due_date,
            'type' => class_basename($this->taskable_type),
            'taskable_id' => $this->taskable_id,
            'assigned_to' => $this->whenLoaded('assignee', function () {
                return [
                    'id' => $this->assignee->id,
                    'name' => $this->assignee->name,
                ];
            }),
            'contact' => $this->when($this->taskable_type === \App\Models\Contact::class, function () {
                return $this->relationLoaded('taskable') && $this->taskable ? [
                    'id' => $this->taskable->id,
                    'first_name' => $this->taskable->first_name,
                    'last_name' => $this->taskable->last_name,
                ] : null;
            }),
            'company' => $this->when($this->taskable_type === \App\Models\Company::class, function () {
                return $this->relationLoaded('taskable') && $this->taskable ? [
                    'id' => $this->taskable->id,
                    'name' => $this->taskable->name,
                ] : null;
            }),
            'deal' => $this->when($this->taskable_type === \App\Models\Deal::class, function () {
                return $this->relationLoaded('taskable') && $this->taskable ? [
                    'id' => $this->taskable->id,
                    'name' => $this->taskable->title ?? $this->taskable->name,
                ] : null;
            }),
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}