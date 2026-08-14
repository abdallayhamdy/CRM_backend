<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImpersonationSession extends Model
{
    use HasUuids;

    protected $table = 'impersonation_sessions';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'admin_id',
        'target_user_id',
        'target_workspace_id',
        'token_id',
        'expires_at',
        'ip_address',
        'user_agent',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function targetUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }

    public function targetWorkspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class, 'target_workspace_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isActive(): bool
    {
        return is_null($this->revoked_at) && !$this->isExpired();
    }

    public function revoke(): void
    {
        $this->update(['revoked_at' => now()]);

        if ($this->token_id) {
            \Laravel\Sanctum\PersonalAccessToken::where('id', $this->token_id)->delete();
        }
    }
}
