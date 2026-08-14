<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class UpdateActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $workspaceId = $this->user()?->workspace_id;

        return [
            'type' => 'sometimes|string|max:50',
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string',
            'completed' => 'sometimes|nullable|boolean',

            'activity_date' => 'sometimes|nullable|date',

            'owner_id' => [
                'nullable',
                'uuid',
                Rule::exists('users', 'id')->where(function ($q) use ($workspaceId) {
                    $q->where('workspace_id', $workspaceId)
                      ->orWhereExists(function ($sub) use ($workspaceId) {
                          $sub->select(DB::raw(1))
                              ->from('workspace_user')
                              ->whereColumn('workspace_user.user_id', 'users.id')
                              ->where('workspace_user.workspace_id', $workspaceId);
                      });
                })
            ],

            'contact_id' => [
                'nullable',
                'uuid',
                Rule::exists('contacts', 'id')->where('workspace_id', $workspaceId),
            ],
            'company_id' => [
                'nullable',
                'uuid',
                Rule::exists('companies', 'id')->where('workspace_id', $workspaceId),
            ],
            'deal_id' => [
                'nullable',
                'uuid',
                Rule::exists('deals', 'id')->where('workspace_id', $workspaceId),
            ],
            'ticket_id' => [
                'nullable',
                'uuid',
                Rule::exists('tickets', 'id')->where('workspace_id', $workspaceId),
            ],
        ];
    }
}

