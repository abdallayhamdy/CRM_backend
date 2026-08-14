<?php

namespace App\Services;

use App\Models\User;
use App\Models\Workspace;
use App\Models\Pipeline;
use App\Services\ContactStageService;
use App\Services\CompanyStageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Database\QueryException;
use Illuminate\Support\Str;

class TenantOnboardingService
{
    private const CURRENCY_SYMBOLS = [
        'USD' => '$',
        'EUR' => '€',
        'GBP' => '£',
        'AUD' => 'AU$',
        'CAD' => '$',
        'JPY' => '¥',
        'CNY' => 'CN¥',
        'INR' => '₹',
        'AED' => 'د.إ',
        'EGP' => 'E£',
        'SAR' => '﷼',
        'KWD' => 'د.ك',
    ];

    public function createTenant(array $data)
    {
        return DB::transaction(function () use ($data) {
            $workspace = $this->createWorkspaceWithUniqueSlug($data);

            if (!empty($data['logo']) && $data['logo'] instanceof UploadedFile) {
                $logoPath = $data['logo']->store('workspace-logos/' . $workspace->id, 'public');
                $workspace->update(['logo_path' => $logoPath]);
            }

            $user = User::create([
                'name' => $data['admin_full_name'],
                'job_title' => $data['admin_job_title'] ?? null,
                'email' => $data['admin_email'],
                'phone_number' => $data['admin_phone'] ?? null,
                'password' => Hash::make(Str::random(32)),
                'workspace_id' => $workspace->id,
            ]);

            $workspace->users()->attach($user->id, ['role_name' => 'Workspace Owner']);

            setPermissionsTeamId($workspace->id);
            $user->assignRole('Workspace Owner');

            $pipeline = Pipeline::create([
                'workspace_id' => $workspace->id,
                'name' => 'المبيعات الرئيسية',
                'is_default' => true,
            ]);

            $stages = [
                ['name' => 'Lead (عميل محتمل)', 'probability' => 10],
                ['name' => 'Qualified (مؤهل)', 'probability' => 40],
                ['name' => 'Proposal (عرض سعر)', 'probability' => 70],
                ['name' => 'Won (تم البيع)', 'probability' => 100],
                ['name' => 'Lost (خسارة)', 'probability' => 0],
            ];

            foreach ($stages as $index => $stage) {
                $pipeline->stages()->create([
                    'name' => $stage['name'],
                    'win_probability' => $stage['probability'],
                    'display_order' => $index,
                ]);
            }

            app(ContactStageService::class)->ensureStagesExist($workspace->id);
            app(CompanyStageService::class)->ensureStagesExist($workspace->id);

            Password::broker()->sendResetLink(['email' => $user->email]);

            return [
                'workspace' => $workspace,
                'user' => $user,
            ];
        });
    }

    private function createWorkspaceWithUniqueSlug(array $data): Workspace
    {
        $baseSlug = $this->normalizeSlug($data['slug'] ?? $data['company_name'] ?? $data['workspace_name'] ?? Str::random(8));
        $slug = $baseSlug;
        $attempt = 1;

        while (true) {
            if ($attempt > 1) {
                $slug = "{$baseSlug}-{$attempt}";
            }

            if (Workspace::withTrashed()->where('slug', $slug)->exists()) {
                $attempt++;
                continue;
            }

            try {
                return Workspace::create([
                    'name' => $data['name'] ?? $data['workspace_name'] ?? $data['company_name'],
                    'slug' => $slug,
                    'company_name' => $data['company_name'],
                    'status' => $data['status'] ?? 'active',
                    'plan' => $data['plan'] ?? 'starter',
                    'billing_cycle' => $data['billing_cycle'] ?? 'monthly',
                    'max_users' => $data['user_limit'] ?? 10,
                    'trial_end_date' => $data['trial_end_date'] ?? null,
                    'subscription_start_date' => $data['subscription_start_date'] ?? now()->toDateString(),
                    'timezone' => $data['timezone'] ?? null,
                    'fiscal_year_start' => $data['fiscal_year_start'] ?? null,
                    'industry' => $data['industry'] ?? null,
                    'company_domain' => $data['company_domain'] ?? null,
                    'company_address' => $data['company_address'] ?? null,
                    'company_address2' => $data['company_address2'] ?? null,
                    'company_city' => $data['company_city'] ?? null,
                    'company_state' => $data['company_state'] ?? null,
                    'company_zip' => $data['company_zip'] ?? null,
                    'company_country' => $data['company_country'] ?? null,
                    'currency' => $data['currency'] ?? 'USD',
                    'currency_symbol' => self::CURRENCY_SYMBOLS[$data['currency'] ?? 'USD'] ?? '$',
                    'default_language' => $data['default_language'] ?? 'en',
                    'default_date_format' => $data['default_date_format'] ?? 'us',
                    'billing_email' => $data['billing_email'] ?? $data['admin_email'],
                    'billing_phone' => $data['billing_phone'] ?? null,
                    'billing_address' => $data['billing_address'] ?? null,
                    'billing_city' => $data['billing_city'] ?? null,
                    'billing_state' => $data['billing_state'] ?? null,
                    'billing_zip' => $data['billing_zip'] ?? null,
                    'billing_country' => $data['billing_country'] ?? null,
                    'tax_id' => $data['tax_id'] ?? null,
                ]);
            } catch (QueryException $exception) {
                if ($this->isWorkspaceSlugDuplicateException($exception)) {
                    $attempt++;
                    continue;
                }

                throw $exception;
            }
        }
    }

    private function normalizeSlug(string $value): string
    {
        $slug = Str::slug($value);

        return $slug !== '' ? $slug : Str::random(8);
    }

    private function isWorkspaceSlugDuplicateException(QueryException $exception): bool
    {
        $message = $exception->getMessage();

        return str_contains($message, 'workspaces_slug_unique')
            || str_contains($message, 'UNIQUE constraint failed: workspaces.slug')
            || str_contains($message, 'Duplicate entry') && str_contains($message, 'workspaces');
    }
}
