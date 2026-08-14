<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PipelineStage extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'pipeline_id',
        'name',
        'display_order',
        'win_probability',
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

    public function pipeline()
    {
        return $this->belongsTo(Pipeline::class);
    }

    // الصفقات اللي موجودة في المرحلة دي
    public function deals()
    {
        return $this->hasMany(Deal::class);
    }
}