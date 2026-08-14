<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePropertyRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'label' => 'sometimes|required|string|max:255',
            'field_type' => 'sometimes|required|string|max:100',
            'object_type' => 'sometimes|required|string|max:100',
            'group_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'is_required' => 'nullable|boolean',
            'is_archived' => 'nullable|boolean',
            'show_in_forms' => 'nullable|boolean',
            'display_order' => 'nullable|integer|min:0',
            'options' => 'nullable|array',
            'settings' => 'nullable|array',
            'restore' => 'nullable|boolean',
        ];
    }
}
