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

        return $user && $this->canManagePermissionSets($user);
    }

    private function canManagePermissionSets($user): bool
    {
        return \Spatie\Permission\Models\Permission::query()
                ->where('name', 'manage_permission_sets')
                ->where('guard_name', 'sanctum')
                ->exists()
            && $user->hasPermissionTo('manage_permission_sets');
    }

    public function rules(): array
    {
        return [
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'string|exists:users,id',
        ];
    }
}