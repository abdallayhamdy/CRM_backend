<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkspaceSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = auth()->user();

        return $user && ($user->is_super_admin || $user->hasPermissionTo('manage_settings'));
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|string|max:255',
            'timezone' => 'sometimes|nullable|string|max:64',
            'fiscal_year_start' => 'sometimes|nullable|string|max:10',
            'industry' => 'sometimes|nullable|string|max:128',
            'company_name' => 'sometimes|nullable|string|max:255',
            'company_domain' => 'sometimes|nullable|string|max:255',
            'company_address' => 'sometimes|nullable|string|max:500',
            'company_address2' => 'sometimes|nullable|string|max:500',
            'company_city' => 'sometimes|nullable|string|max:128',
            'company_state' => 'sometimes|nullable|string|max:128',
            'company_zip' => 'sometimes|nullable|string|max:20',
            'company_country' => 'sometimes|nullable|string|max:128',
            'currency' => 'sometimes|nullable|string|max:10',
            'currency_symbol' => 'sometimes|nullable|string|max:10',
            'default_language' => 'sometimes|nullable|string|max:10',
            'default_date_format' => 'sometimes|nullable|string|max:20',
            'data_quality_monitoring' => 'sometimes|boolean',
        ];
    }
}
