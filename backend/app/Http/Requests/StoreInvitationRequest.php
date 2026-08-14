<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInvitationRequest extends FormRequest
{
    private const ROLE_LEVELS = [
        'Workspace Viewer' => 1,
        'Workspace Member' => 2,
        'Workspace Admin'  => 3,
        'Workspace Owner'  => 4,
    ];

    public function authorize(): bool
    {
        $user = auth()->user();

        if (!$user || !$user->hasPermissionTo('invite_users')) {
            return false;
        }

        $roleName = $this->input('role_name');

        if (!$roleName) {
            return true;
        }

        $targetLevel = self::ROLE_LEVELS[$roleName] ?? 0;
        $authRole = $user->workspaces()
            ->where('workspace_id', $user->workspace_id)
            ->first()
            ?->pivot->role_name;
        $authLevel = self::ROLE_LEVELS[$authRole] ?? 0;

        return $targetLevel <= $authLevel;
    }

    public function rules(): array
    {
        $workspaceId = auth()->user()->workspace_id;

        return [
            'email' => [
                'required',
                'email',
                // التأكد إن الإيميل ده مش مدعو قبل كده في نفس الشركة
                Rule::unique('invitations')->where(function ($query) use ($workspaceId) {
                    return $query->where('workspace_id', $workspaceId);
                }),
                // التأكد إن الموظف ده مش متسجل أصلاً في الداتا بيز
                'unique:users,email'
            ],
            // التأكد إن الدور ده موجود في الداتا بيز فعلاً
            'role_name' => 'required|string|exists:roles,name',
        ];
    }
    
    public function messages()
    {
        return [
            'email.unique' => 'هذا البريد الإلكتروني مستخدم أو تم دعوته مسبقاً.',
        ];
    }
}