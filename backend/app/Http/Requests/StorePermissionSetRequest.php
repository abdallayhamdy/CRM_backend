<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePermissionSetRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = auth()->user();

        if ($user && $user->is_super_admin) {
            return true;
        }

        return $user && $user->hasPermissionTo('manage_permission_sets');
    }

    public function rules(): array
    {
        $workspaceId = $this->route('workspace')?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('permission_sets', 'name')->where(function ($query) use ($workspaceId) {
                    $query->where('workspace_id', $workspaceId);
                }),
            ],
            'description' => 'nullable|string|max:1000',
            'locked' => 'sometimes|boolean',

            'permissions' => 'sometimes|array',
            'permissions.*.object' => 'required_with:permissions|string|max:100',
            'permissions.*.key' => 'required_with:permissions|string|max:100',
            'permissions.*.value' => 'nullable|string|max:20',
            'permissions.*.scope' => 'nullable|string|max:100',
        ];
    }
}