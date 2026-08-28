<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permission_set_user', function (Blueprint $table) {
            $table->foreignUuid('permission_set_id')->constrained('permission_sets')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();

            // مركب كمفتاح أساسي لمنع التكرار
            $table->primary(['permission_set_id', 'user_id']);
            $table->timestamps();

            // عمليات البحث عن المستخدمين المرتبطين بمجموعات الصلاحيات
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_set_user');
    }
};