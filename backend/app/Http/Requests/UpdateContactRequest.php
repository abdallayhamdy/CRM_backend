<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContactRequest extends FormRequest
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
            'owner_id' => [
                'nullable',
                Rule::exists('users', 'id')->where(fn ($q) => $this->user()?->is_super_admin ? $q : $q->where('workspace_id', $this->user()?->workspace_id)),
            ],
            'lifecycle_stage' => 'nullable|string|max:255',
            'custom_fields' => 'nullable|array',
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'emailOptOut' => 'nullable|boolean',
            'source' => 'nullable|string|max:255',
        ];
    }
}
