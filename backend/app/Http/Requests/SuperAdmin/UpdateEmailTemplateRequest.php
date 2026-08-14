<?php

namespace App\Http\Requests\SuperAdmin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmailTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check() && auth('sanctum')->user()->is_super_admin;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:120',
            'subject' => 'sometimes|required|string|max:255',
            'body' => 'sometimes|required|string',
            'is_active' => 'sometimes|boolean',
        ];
    }
}
