<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserViewPreferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'object_type' => [
                'sometimes',
                'required',
                'string',
                Rule::in(['contacts', 'deals', 'companies', 'products', 'tickets', 'orders']),
            ],
            'visible_columns' => 'nullable|array',
            'visible_columns.*' => 'string',
            'column_order' => 'nullable|array',
            'column_order.*' => 'string',
        ];
    }
}
