<?php

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSecuritySettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->is_super_admin;
    }

    public function rules(): array
    {
        return [
            'two_factor_required' => 'sometimes|boolean',
            'ip_whitelist_enabled' => 'sometimes|boolean',
            'whitelisted_ips' => 'sometimes|array',
            'whitelisted_ips.*' => 'string|max:45',
            'session_timeout_minutes' => 'sometimes|integer|min:5|max:480',
        ];
    }
}
