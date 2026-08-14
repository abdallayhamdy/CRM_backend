<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePanelConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = auth()->user();
        return $user->hasPermissionTo('manage_panel_configs');
    }

    public function rules(): array
    {
        return [
            'config' => 'required|array',
            'config.cards' => 'present|array',
            'config.custom_left_cards' => 'nullable|array',
            'config.left_added_ids' => 'nullable|array',
            'config.custom_right_cards' => 'nullable|array',
            'config.table_settings' => 'nullable|array',
        ];
    }
}
