<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $scope = fn ($q) => $this->user()?->is_super_admin ? $q : $q->where('workspace_id', $this->user()?->workspace_id);

        return [
            'taskable_type' => 'sometimes|required|string|in:company,contact,deal',
            'taskable_id' => 'sometimes|required|uuid',
            'assigned_to' => [
                'nullable',
                'uuid',
                Rule::exists('users', 'id')->where($scope),
            ],
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'status' => 'nullable|in:pending,in_progress,completed',
            'task_subtype' => 'nullable|string|max:50',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->has('taskable_type') && $this->has('taskable_id')) {
                $type = $this->input('taskable_type');
                $id = $this->input('taskable_id');
                $modelClass = match($type) {
                    'company' => \App\Models\Company::class,
                    'contact' => \App\Models\Contact::class,
                    'deal' => \App\Models\Deal::class,
                    default => null
                };
                if ($modelClass) {
                    $exists = $modelClass::where('id', $id)
                        ->where('workspace_id', $this->user()?->workspace_id)
                        ->exists();
                    if (!$exists) {
                        $validator->errors()->add('taskable_id', 'The selected taskable relation is invalid or does not belong to your workspace.');
                    }
                }
            }
        });
    }
}