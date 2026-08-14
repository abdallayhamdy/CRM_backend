<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContactRequest extends FormRequest
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
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'company_name' => 'nullable|string|max:255',
        ];
    }
}
