<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UpdateDealRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_id' => [
                'nullable',
                Rule::exists('companies', 'id')->where(fn ($q) => $this->user()?->is_super_admin ? $q : $q->where('workspace_id', $this->user()?->workspace_id)),
            ],
            'contact_id' => [
                'nullable',
                Rule::exists('contacts', 'id')->where(fn ($q) => $this->user()?->is_super_admin ? $q : $q->where('workspace_id', $this->user()?->workspace_id)),
            ],
            'stage_id' => [
                'nullable',
                Rule::exists('pipeline_stages', 'id')->where(function ($query) {
                    if ($this->user()?->is_super_admin) {
                        return;
                    }
                    $query->whereExists(function ($q) {
                        $q->select(DB::raw(1))
                            ->from('pipelines')
                            ->whereColumn('pipelines.id', 'pipeline_stages.pipeline_id')
                            ->where('pipelines.workspace_id', $this->user()?->workspace_id);
                    });
                }),
            ],
            'assigned_to' => [
                'nullable',
                Rule::exists('users', 'id')->where(fn ($q) => $this->user()?->is_super_admin ? $q : $q->where('workspace_id', $this->user()?->workspace_id)),
            ],
            'owner_id' => [
                'nullable',
                Rule::exists('users', 'id')->where(fn ($q) => $this->user()?->is_super_admin ? $q : $q->where('workspace_id', $this->user()?->workspace_id)),
            ],
            'title' => 'sometimes|required|string|max:255',
            'amount' => 'nullable|numeric|min:0',
            'close_date' => 'nullable|date',
            'expected_close_date' => 'nullable|date',
            'status' => 'nullable|in:open,won,lost',
            'custom_data' => 'nullable|array',
            'custom_fields' => 'nullable|array',
            'deal_type' => 'nullable|string|max:255',
            'priority' => 'nullable|string|max:255',
            'probability' => 'nullable|numeric|min:0|max:100',
            'pipeline_stage_id' => [
                'nullable',
                Rule::exists('pipeline_stages', 'id')->where(function ($query) {
                    if ($this->user()?->is_super_admin) {
                        return;
                    }
                    $query->whereExists(function ($q) {
                        $q->select(DB::raw(1))
                            ->from('pipelines')
                            ->whereColumn('pipelines.id', 'pipeline_stages.pipeline_id')
                            ->where('pipelines.workspace_id', $this->user()?->workspace_id);
                    });
                }),
            ],
        ];
    }
}
