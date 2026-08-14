<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use App\Traits\BelongsToWorkspace;
use App\Traits\HasOwnership;
use App\Traits\RecordsActivity;

class Order extends Model
{
    use HasFactory, BelongsToWorkspace, HasOwnership, RecordsActivity;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'workspace_id', 'contact_id', 'company_id', 'owner_id',
        'order_number', 'title', 'status', 'currency',
        'subtotal', 'discount', 'tax', 'shipping', 'total',
        'closed_at', 'custom_data'
    ];

    protected $casts = [
        'closed_at' => 'datetime',
        'custom_data' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            // توليد UUID
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
            // توليد رقم الطلب تلقائياً لو مش مبعوت
            if (empty($model->order_number)) {
                $model->order_number = 'ORD-' . strtoupper(Str::random(6));
            }
        });
    }

    protected function getOwnershipColumns(): ?array
    {
        return ['owner_id'];
    }

    // --- العلاقات (Relations) --- //

    public function lineItems()
    {
        return $this->hasMany(OrderLineItem::class)->orderBy('display_order');
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}