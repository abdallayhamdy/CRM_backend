<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserViewPreference extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'object_type',
        'visible_columns',
        'column_order',
    ];

    protected $casts = [
        'visible_columns' => 'array',
        'column_order' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
