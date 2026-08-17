<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class UpdateCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $workspaceId = $this->user()?->workspace_id;

        return [
            'name' => 'sometimes|required|string|max:255',
            'domain' => 'nullable|string|max:255',
            'industry' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
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
            'lifecycle_stage' => 'nullable|string|max:255',
            'custom_fields' => 'nullable|array',
            'address' => 'nullable|string|max:255',
            'size' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'contacts' => 'nullable|array',
            'contacts.*.id' => [
                'required',
                'uuid',
                Rule::exists('contacts', 'id')->where('workspace_id', $workspaceId),
            ],
        ];
    }
}
