<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('sanctum')->check() && auth('sanctum')->user()->is_super_admin;
    }

    public function rules(): array
    {
        return [
            // ── Company information ────────────────────────────────────────────
            'company_name' => 'required|string|max:255',
            'company_domain' => 'nullable|string|max:255',
            'industry' => 'required|string|in:technology,real_estate,finance,healthcare,education,retail,manufacturing,services,other',
            'company_address' => 'nullable|string|max:500',
            'company_address2' => 'nullable|string|max:500',
            'company_city' => 'nullable|string|max:128',
            'company_state' => 'nullable|string|max:128',
            'company_zip' => 'nullable|string|max:20',
            'company_country' => 'required|string|max:128',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp,svg|max:2048',

            // ── Workspace configuration ────────────────────────────────────────
            'name' => 'required_without:workspace_name|string|max:255',
            'workspace_name' => 'nullable|string|max:255',
            'slug' => [
                'nullable',
                'string',
                'max:63',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            ],
            'fiscal_year_start' => 'nullable|string|max:10',

            // ── Localization ───────────────────────────────────────────────────
            'timezone' => 'required|string|max:64',
            'currency' => 'required|string|in:USD,EUR,GBP,AUD,CAD,JPY,CNY,INR,AED,EGP,SAR,KWD',
            'default_language' => 'required|string|in:en,ar,fr,es,de',
            'default_date_format' => 'required|string|in:us,eu,iso',

            // ── Admin user (owner) ─────────────────────────────────────────────
            'admin_full_name' => 'required|string|max:255',
            'admin_email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->whereNull('deleted_at'),
            ],
            'admin_phone' => 'nullable|string|max:50',
            'admin_job_title' => 'nullable|string|max:128',

            // ── Subscription ───────────────────────────────────────────────────
            'plan' => 'required|string|in:starter,pro,enterprise',
            'billing_cycle' => 'required|string|in:monthly,annual',
            'user_limit' => 'required|integer|min:1|max:1000',
            'status' => 'required|string|in:active,trial',
            'trial_end_date' => 'required_if:status,trial|nullable|date|after_or_equal:today',
            'subscription_start_date' => 'nullable|date',

            // ── Billing ────────────────────────────────────────────────────────
            'billing_email' => 'required|string|email|max:255',
            'billing_phone' => 'nullable|string|max:50',
            'tax_id' => 'nullable|string|max:64',
            'billing_address' => 'nullable|string|max:500',
            'billing_city' => 'nullable|string|max:128',
            'billing_state' => 'nullable|string|max:128',
            'billing_zip' => 'nullable|string|max:20',
            'billing_country' => 'nullable|string|max:128',
        ];
    }
}
