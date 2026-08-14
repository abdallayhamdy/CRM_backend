<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PlatformSettings extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'platform_settings';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'platform_name',
        'support_email',
        'default_trial_days',
        'default_plan',
        'two_factor_required',
        'ip_whitelist_enabled',
        'whitelisted_ips',
        'session_timeout_minutes',
    ];

    protected function casts(): array
    {
        return [
            'default_trial_days' => 'integer',
            'two_factor_required' => 'boolean',
            'ip_whitelist_enabled' => 'boolean',
            'whitelisted_ips' => 'array',
            'session_timeout_minutes' => 'integer',
            'bootstrap_completed_at' => 'datetime',
        ];
    }

    public static function instance(): static
    {
        return static::first() ?? static::create([
            'platform_name' => 'CRM Platform',
            'default_trial_days' => 14,
            'default_plan' => 'starter',
            'two_factor_required' => false,
            'ip_whitelist_enabled' => false,
            'whitelisted_ips' => null,
            'session_timeout_minutes' => 30,
        ]);
    }
}
