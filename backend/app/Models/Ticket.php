<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use App\Traits\BelongsToWorkspace;
use App\Traits\HasOwnership;
use App\Traits\RecordsActivity; // لو بتستخدم التتبع

class Ticket extends Model
{
    use HasFactory, BelongsToWorkspace, HasOwnership, RecordsActivity;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'workspace_id',
        'contact_id',
        'assigned_to',
        'subject',
        'description',
        'status',
        'priority',
        'custom_data',
    ];

    protected $casts = [
        'custom_data' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    protected function getOwnershipColumns(): ?array
    {
        return ['assigned_to'];
    }

    // --- العلاقات ---
    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function documents()
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function activities()
    {
        return $this->morphMany(Activity::class, 'activitable');
    }
}