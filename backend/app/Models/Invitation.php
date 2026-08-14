<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use App\Traits\BelongsToWorkspace;

class Invitation extends Model
{
    use HasFactory, BelongsToWorkspace;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'workspace_id',
        'email',
        'role_name',
        'expires_at',
    ];

    protected $hidden = [
        'token',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
            // توليد توكن عشوائي طويل لو مش مبعوت
            if (empty($model->token)) {
                $model->token = Str::random(60);
            }
            // الدعوة بتنتهي بعد 7 أيام أوتوماتيك
            if (empty($model->expires_at)) {
                $model->expires_at = now()->addDays(7);
            }
        });
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }
}