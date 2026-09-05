<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use App\Traits\BelongsToWorkspace;
use App\Traits\HasOwnership;
use App\Traits\HasPermissionScopes;
use App\Traits\RecordsActivity;
 
class Document extends Model
{
    use HasFactory, BelongsToWorkspace, HasOwnership, HasPermissionScopes, RecordsActivity;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'workspace_id',
        'documentable_type',
        'documentable_id',
        'name',
        'document_type',
        'file_path',
        'mime_type',
        'size',
        'uploaded_by',
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
        return ['uploaded_by'];
    }

    // الدالة دي هي اللي بتربط الملف بالكيان بتاعه أياً كان نوعه
    public function documentable()
    {
        return $this->morphTo();
    }

    // علاقة مين اللي رفع الملف
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}