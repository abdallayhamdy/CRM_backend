<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePropertyRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'label' => 'required|string|max:255',
            'field_type' => 'required|string|max:100',
            'object_type' => 'required|string|max:100',
            'group_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_required' => 'nullable|boolean',
            'show_in_forms' => 'nullable|boolean',
            'display_order' => 'nullable|integer|min:0',
            'options' => 'nullable|array',
            'settings' => 'nullable|array',
        ];
    }
}
