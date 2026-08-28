<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permission_set_permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('permission_set_id')->constrained('permission_sets')->cascadeOnDelete();

            // object: كيان الوصول (مثال: contacts, deals, bulk_delete, reports_access)
            $table->string('object');

            // key: الإجراء داخل الكيان (مثال: view, create, edit, delete, أو فارغ للتوجهات البسيطة)
            $table->string('key');

            // value: المدى أو قيمة التفعيل (مثال: all, team, their, none, 1, 0)
            $table->string('value')->nullable();

            // scope: التصنيف الذي تظهر تحته الصلاحية (مثال: CRM objects, CRM tools, Reporting, Settings access)
            $table->string('scope')->nullable();

            $table->timestamps();

            // منع تسجيل نفس الصلاحية (object + key) أكثر من مرة داخل نفس مجموعة الصلاحيات
            $table->unique(['permission_set_id', 'object', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_set_permissions');
    }
};