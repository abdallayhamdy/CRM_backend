<?php

namespace App\Http\Resources\SuperAdmin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlatformSettingsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'platform_name' => $this->platform_name,
            'support_email' => $this->support_email,
            'default_trial_days' => $this->default_trial_days,
            'default_plan' => $this->default_plan,
        ];
    }
}
