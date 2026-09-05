<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use App\Traits\BelongsToWorkspace; // Trait العزل اللي موجود عندك
use App\Traits\HasOwnership;
use App\Traits\HasPermissionScopes;
use App\Traits\RecordsActivity;    // Trait تسجيل النشاطات

class Product extends Model
{
    use HasFactory, BelongsToWorkspace, HasOwnership, HasPermissionScopes, RecordsActivity;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'workspace_id',
        'name',
        'sku',
        'unit_price',
        'status',
        'product_folder',
        'custom_data',
    ];

    protected $casts = [
        'custom_data' => 'array',
    ];

    // عشان يولد UUID تلقائي عند الإنشاء
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
        return null;
    }

    // تجهيز العلاقة مع الطلبات (هنحتاجها في الخطوة الجاية)
    // public function orderLineItems()
    // {
    //     return $this->hasMany(OrderLineItem::class);
    // }
}