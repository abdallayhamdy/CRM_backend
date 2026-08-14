<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreObjectConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = auth()->user();
        return $user->hasPermissionTo('manage_panel_configs');
    }

    public function rules(): array
    {
        return [
            'object_type' => 'required|string|max:100',
            'lifecycle_stages' => 'required|array',
            'lifecycle_stages.*.id' => 'required|string',
            'lifecycle_stages.*.name' => 'required|string',
            'lifecycle_stages.*.color' => 'required|string',
            'lifecycle_stages.*.order' => 'required|integer|min:0',
            'lifecycle_stages.*.is_default' => 'required|boolean',
            'lifecycle_stages.*.is_active' => 'required|boolean',
            'lifecycle_stages.*.calculated_props' => 'required|boolean',
            'lifecycle_stages.*.used_in' => 'required|integer|min:0',
            'display_style' => 'nullable|string|max:50',
        ];
    }
}
