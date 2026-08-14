<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkspaceMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'is_active' => $this->whenPivotLoaded('workspace_user', function () {
                return $this->pivot->is_active ?? true;
            }),
            'role_name' => $this->whenPivotLoaded('workspace_user', function () {
                return $this->pivot->role_name;
            }),
            'roles' => $this->getRoleNames(),
            'joined_at' => $this->whenPivotLoaded('workspace_user', function () {
                return $this->pivot->created_at?->format('Y-m-d H:i:s');
            }),
        ];
    }
}
