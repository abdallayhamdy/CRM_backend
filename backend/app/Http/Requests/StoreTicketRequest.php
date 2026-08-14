<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class StoreTicketRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $workspaceId = $this->user()?->workspace_id;

        $userScope = function ($q) use ($workspaceId) {
            $q->where('workspace_id', $workspaceId)
              ->orWhereExists(function ($sub) use ($workspaceId) {
                  $sub->select(DB::raw(1))
                      ->from('workspace_user')
                      ->whereColumn('workspace_user.user_id', 'users.id')
                      ->where('workspace_user.workspace_id', $workspaceId);
              });
        };

        return [
            'contact_id' => [
                'nullable',
                Rule::exists('contacts', 'id')->where(fn ($q) => $q->where('workspace_id', $workspaceId)),
            ],
            'assigned_to' => [
                'nullable',
                Rule::exists('users', 'id')->where($userScope),
            ],
            'owner_id' => [
                'nullable',
                Rule::exists('users', 'id')->where($userScope),
            ],
            'subject' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:open,pending,resolved,closed',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'workspace_id' => 'nullable|uuid|exists:workspaces,id',
            'custom_fields' => 'nullable|array',
        ];
    }
}
