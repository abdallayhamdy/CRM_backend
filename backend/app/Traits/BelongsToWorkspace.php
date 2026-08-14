<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait BelongsToWorkspace
{
    protected static function bootBelongsToWorkspace()
    {
        // 1. الفلترة التلقائية (مع استثناء السوبر أدمن)
        static::addGlobalScope('workspace', function (Builder $builder) {
            $user = auth('sanctum')->user() ?? auth()->user();
            
            // لو اليوزر موجود، ومش سوبر أدمن، وعنده مساحة عمل نشطة -> فلتر الداتا
            if ($user && !$user->is_super_admin && $user->workspace_id) {
                $builder->where($builder->getQuery()->from . '.workspace_id', $user->workspace_id);
            }
        });

        // 2. إضافة مساحة العمل تلقائياً وقت الإنشاء
        static::creating(function ($model) {
            $user = auth('sanctum')->user() ?? auth()->user();
            
            // لو اليوزر مش سوبر أدمن، اربط الموديل بمساحة العمل النشطة بتاعته
            if ($user && empty($model->workspace_id) && !$user->is_super_admin) {
                $model->workspace_id = $user->workspace_id;
            }
        });
    }

    // 3. دالة اختيارية (Local Scope) لو حبيت تجيب داتا مساحة عمل معينة يدوياً
    public function scopeForWorkspace(Builder $query, $workspaceId)
    {
        return $query->withoutGlobalScope('workspace')->where('workspace_id', $workspaceId);
    }
}