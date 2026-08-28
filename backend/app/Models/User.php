<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasUuids, SoftDeletes, HasRoles;
    
    protected $guard_name = 'sanctum';
    
    protected $fillable = [
        'workspace_id',
        'name',
        'job_title',
        'email',
        'password',
        'language',
        'date_format',
        'phone_country',
        'phone_number',
        'default_landing_page',
        'work_start_day',
        'work_end_day',
        'work_start_time',
        'work_end_time',
        'avatar_path',
    ];

    protected $guarded = [
        'is_super_admin',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'is_super_admin' => 'boolean',
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // --- العلاقات ---

    // 1. مساحة العمل اللي اليوزر فاتحها وشغال عليها دلوقتي
    public function currentWorkspace() // غيرنا اسمها عشان متعملش لخبطة مع العلاقة التانية
    {
        return $this->belongsTo(Workspace::class, 'workspace_id');
    }

    // 2. كل مساحات العمل اللي اليوزر مشترك فيها (صاحبها أو موظف فيها)
    public function workspaces()
    {
        return $this->belongsToMany(Workspace::class, 'workspace_user')->withPivot('is_active', 'role_name')->withTimestamps();
    }

    public function viewPreferences()
    {
        return $this->hasMany(UserViewPreference::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'assigned_to');
    }
    
    public function teams()
    {
        return $this->belongsToMany(Team::class);
    }

    public function permissionSets()
    {
        return $this->belongsToMany(PermissionSet::class, 'permission_set_user')->withTimestamps();
    }

    public function impersonationSessions()
    {
        return $this->hasMany(\App\Models\ImpersonationSession::class, 'admin_id');
    }

    public function activeImpersonationSession()
    {
        return $this->hasOne(\App\Models\ImpersonationSession::class, 'admin_id')
            ->whereNull('revoked_at');
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new \App\Notifications\PasswordResetNotification($token));
    }
}