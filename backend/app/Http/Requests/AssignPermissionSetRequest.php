<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignPermissionSetRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = auth()->user();

        if ($user && $user->is_super_admin) {
            return true;
        }

        return $user && $user->hasPermissionTo('manage_permission_sets');
    }

    public function rules(): array
    {
        return [
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'string|exists:users,id',
        ];
    }
}