<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'sku' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('products', 'sku')
                    ->ignore($this->route('product'))
                    ->where('workspace_id', $this->user()?->workspace_id),
            ],
            'unit_price' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:Active,Archived',
            'product_folder' => 'nullable|string|max:255',
            'custom_fields' => 'nullable|array',
        ];
    }
}