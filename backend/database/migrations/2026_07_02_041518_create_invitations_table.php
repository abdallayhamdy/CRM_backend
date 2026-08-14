<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            
            // الشركة اللي بعتت الدعوة
            $table->foreignUuid('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            
            // إيميل الموظف المدعو
            $table->string('email');
            
            // الدور اللي هياخده لما يقبل الدعوة (مثلاً: Standard User)
            $table->string('role_name');
            
            // التوكن السري اللي هيتبعت في اللينك
            $table->string('token')->unique();
            
            // تاريخ انتهاء صلاحية الدعوة (عشان الأمان)
            $table->timestamp('expires_at');
            
            $table->timestamps();

            // منع إرسال أكتر من دعوة شغالة لنفس الإيميل في نفس الشركة
            $table->unique(['workspace_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};