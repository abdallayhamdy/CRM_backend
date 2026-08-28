<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkspaceSettingsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'status' => $this->status,
            'plan' => $this->plan,
            'max_users' => $this->max_users,
            'timezone' => $this->timezone,
            'fiscal_year_start' => $this->fiscal_year_start,
            'industry' => $this->industry,
            'company_name' => $this->company_name,
            'company_domain' => $this->company_domain,
            'company_address' => $this->company_address,
            'company_address2' => $this->company_address2,
            'company_city' => $this->company_city,
            'company_state' => $this->company_state,
            'company_zip' => $this->company_zip,
            'company_country' => $this->company_country,
            'currency' => $this->currency,
            'currency_symbol' => $this->currency_symbol,
            'default_language' => $this->default_language,
            'default_date_format' => $this->default_date_format,
            'logo_path' => $this->logo_path,
            'data_quality_monitoring' => $this->data_quality_monitoring,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
