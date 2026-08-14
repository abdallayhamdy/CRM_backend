<?php

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePlatformSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->is_super_admin;
    }

    public function rules(): array
    {
        return [
            'platform_name' => 'sometimes|string|max:255',
            'support_email' => 'sometimes|nullable|email|max:255',
            'default_trial_days' => 'sometimes|integer|min:1|max:90',
            'default_plan' => 'sometimes|string|in:starter,pro,enterprise',
        ];
    }
}
