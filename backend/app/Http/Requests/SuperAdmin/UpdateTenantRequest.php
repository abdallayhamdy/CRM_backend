<?php

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check() && auth('sanctum')->user()->is_super_admin;
    }

    public function rules(): array
    {
        $workspace = $this->route('workspace');
        $owner = $workspace?->getOwner();

        return [
            // ── Company & admin information ───────────────────────────────────
            'company_name' => 'sometimes|required|string|max:255',
            'admin_full_name' => 'sometimes|required|string|max:255',
            'admin_email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->whereNull('deleted_at')
                    ->ignore($owner?->id),
            ],
            'admin_phone' => 'sometimes|nullable|string|max:50',

            // ── Plan & settings ────────────────────────────────────────────────
            'plan' => 'sometimes|required|string|in:starter,pro,enterprise',
            'user_limit' => 'sometimes|required|integer|min:1|max:1000',
            'status' => 'sometimes|required|string|in:active,trial,suspended,churned',
            'trial_end_date' => 'required_if:status,trial|nullable|date',
        ];
    }
}
