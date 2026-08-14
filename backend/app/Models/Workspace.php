<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Workspace extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'status',
        'plan',
        'max_users',
        'trial_end_date',
        'subscription_start_date',
        'billing_cycle',
        'timezone',
        'fiscal_year_start',
        'industry',
        'company_name',
        'company_domain',
        'company_address',
        'company_address2',
        'company_city',
        'company_state',
        'company_zip',
        'company_country',
        'currency',
        'currency_symbol',
        'default_language',
        'default_date_format',
        'logo_path',
        'billing_email',
        'billing_phone',
        'billing_address',
        'billing_city',
        'billing_state',
        'billing_zip',
        'billing_country',
        'tax_id',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'trial_end_date' => 'date',
        'subscription_start_date' => 'date',
    ];

    // --- العلاقات ---

    public function users()
    {
        return $this->belongsToMany(User::class, 'workspace_user')->withPivot('is_active', 'role_name')->withTimestamps();
    }

    public function ownerUsers()
    {
        return $this->belongsToMany(User::class, 'workspace_user', 'workspace_id', 'user_id')
            ->wherePivot('role_name', 'Workspace Owner');
    }

    public function getOwner(): ?User
    {
        if ($this->relationLoaded('ownerUsers')) {
            return $this->ownerUsers->first();
        }

        return $this->ownerUsers()->first();
    }

    public function contacts()
    {
        return $this->hasMany(Contact::class);
    }

    public function deals()
    {
        return $this->hasMany(Deal::class);
    }
}