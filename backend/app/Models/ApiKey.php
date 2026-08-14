<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ApiKey extends Model
{
    use HasUuids;

    protected $table = 'api_keys';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'key_hash',
        'key_prefix',
        'key_tail',
        'last_used_at',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'last_used_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function isActive(): bool
    {
        return $this->revoked_at === null;
    }

    public function status(): string
    {
        return $this->isActive() ? 'Active' : 'Revoked';
    }
}
