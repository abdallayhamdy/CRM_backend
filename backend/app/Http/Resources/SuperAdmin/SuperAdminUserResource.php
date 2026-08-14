<?php

namespace App\Http\Resources\SuperAdmin;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SuperAdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->user_id,
            'name' => $this->resource->name,
            'email' => $this->resource->email,
            'tenant_id' => $this->resource->tenant_id,
            'tenant_name' => $this->resource->company_name ?? $this->resource->workspace_name,
            'role' => match ($this->resource->role_name) {
                'Workspace Owner' => 'Admin',
                'Workspace Admin' => 'Admin',
                'Workspace Member' => 'Member',
                'Workspace Viewer' => 'Viewer',
                default => 'Member',
            },
            'status' => $this->resource->is_active ? 'Active' : 'Deactivated',
            'created_at' => $this->resource->created_at
                ? Carbon::parse($this->resource->created_at)->toISOString()
                : null,
        ];
    }
}
