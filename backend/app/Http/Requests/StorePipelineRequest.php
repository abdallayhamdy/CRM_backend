<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePipelineRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'is_default' => 'boolean',
            
            // مصفوفة المراحل (اختيارية وقت الإنشاء)
            'stages' => 'nullable|array',
            'stages.*.name' => 'required|string|max:255',
            'stages.*.win_probability' => 'nullable|integer|min:0|max:100',
        ];
    }
}