<?php

namespace App\Http\Resources\SuperAdmin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $owner = $this->getOwner();

        return [
            'id' => $this->id,
            'company_name' => $this->company_name ?? $this->name,
            'workspace_name' => $this->name,
            'slug' => $this->slug,
            'industry' => $this->industry,
            'company_domain' => $this->company_domain,
            'company_address' => $this->company_address,
            'company_address2' => $this->company_address2,
            'company_city' => $this->company_city,
            'company_state' => $this->company_state,
            'company_zip' => $this->company_zip,
            'company_country' => $this->company_country,
            'timezone' => $this->timezone,
            'currency' => $this->currency,
            'currency_symbol' => $this->currency_symbol,
            'default_language' => $this->default_language,
            'default_date_format' => $this->default_date_format,
            'fiscal_year_start' => $this->fiscal_year_start,
            'logo_path' => $this->logo_path,
            'billing_cycle' => $this->billing_cycle,
            'billing_email' => $this->billing_email,
            'billing_phone' => $this->billing_phone,
            'billing_address' => $this->billing_address,
            'billing_city' => $this->billing_city,
            'billing_state' => $this->billing_state,
            'billing_zip' => $this->billing_zip,
            'billing_country' => $this->billing_country,
            'tax_id' => $this->tax_id,
            'subscription_start_date' => $this->subscription_start_date?->toISOString(),
            'admin_full_name' => $owner?->name,
            'admin_email' => $owner?->email,
            'admin_phone' => $owner?->phone_number,
            'admin_job_title' => $owner?->job_title,
            'plan' => $this->plan,
            'user_limit' => $this->max_users,
            'current_user_count' => $this->whenCounted('users'),
            'status' => $this->status,
            'trial_end_date' => $this->trial_end_date?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
