<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMemberRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->hasPermissionTo('manage_roles');
    }

    public function rules(): array
    {
        return [
            'role_name' => 'required|string|exists:roles,name',
        ];
    }
}
