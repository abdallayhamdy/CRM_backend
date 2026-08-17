<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkspaceMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $nameParts = $this->parseName($this->name ?? '');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'first_name' => $nameParts['first_name'],
            'last_name' => $nameParts['last_name'],
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

    private function parseName(string $fullName): array
    {
        $parts = array_filter(explode(' ', trim($fullName)));
        $firstName = $parts[0] ?? '';
        $lastName = implode(' ', array_slice($parts, 1));

        return [
            'first_name' => $firstName,
            'last_name' => $lastName ?: null,
        ];
    }
}
